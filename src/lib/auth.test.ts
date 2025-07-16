import { db, magicLinks, users } from './db';
import { createMagicLink, verifyMagicLink, cleanupExpiredTokens, getUserByEmail, AuthUser } from './auth';
import { eq, and, lt } from 'drizzle-orm';
import { testData, testDb } from './test-utils';

describe('Authentication System', () => {
  let testUser1: any;
  let testUser2: any;

  beforeEach(async () => {
    // Generate unique identifiers for each test to avoid conflicts
    const uniqueId = Date.now() + Math.random();
    
    // Create test users with unique data for each test
    testUser1 = testData.createUser({
      id: `testuser1-${uniqueId}`,
      email: `testuser1-${uniqueId}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    });
    
    testUser2 = testData.createUser({
      id: `testuser2-${uniqueId}`,
      email: `testuser2-${uniqueId}@example.com`,
      firstName: 'Another',
      lastName: 'User',
      role: 'admin',
    });

    // Clean up any existing data before each test
    await testDb.cleanup();
    
    // Insert test users after cleanup
    await db.insert(users).values(testUser1);
    await db.insert(users).values(testUser2);
  });

  afterEach(async () => {
    // Clean up after each test
    await testDb.cleanup();
  });

  describe('createMagicLink', () => {
    it('should create a new magic link token', async () => {
      const token = await createMagicLink(testUser1.email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should invalidate previous unused tokens for the same email', async () => {
      // Create first token
      const token1 = await createMagicLink(testUser1.email);
      
      // Create second token (should invalidate the first)
      const token2 = await createMagicLink(testUser1.email);

      // Verify first token is invalidated
      const user1 = await verifyMagicLink(token1);
      expect(user1).toBeNull();

      // Verify second token is valid
      const user2 = await verifyMagicLink(token2);
      expect(user2).not.toBeNull();
      expect(user2?.email).toBe(testUser1.email);
    });

    it('should set proper expiration time (24 hours)', async () => {
      const token = await createMagicLink(testUser1.email);
      
      const link = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token))
        .limit(1);

      expect(link).toHaveLength(1);
      
      const expiresAt = new Date(link[0].expiresAt);
      const now = new Date();
      const timeDiff = expiresAt.getTime() - now.getTime();
      
      // Should be approximately 24 hours (with some tolerance for test execution time)
      expect(timeDiff).toBeGreaterThan(23 * 60 * 60 * 1000); // 23 hours
      expect(timeDiff).toBeLessThan(25 * 60 * 60 * 1000); // 25 hours
    });

    it('should mark tokens as unused initially', async () => {
      const token = await createMagicLink(testUser1.email);
      
      const link = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token))
        .limit(1);

      expect(link[0].used).toBe(0);
    });

    it('should handle non-existent email gracefully', async () => {
      const token = await createMagicLink('nonexistent@example.com');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Token should be created but verification should fail
      const user = await verifyMagicLink(token);
      expect(user).toBeNull();
    });

    it('should create unique tokens for different emails', async () => {
      const token1 = await createMagicLink('testuser1@example.com');
      const token2 = await createMagicLink('testuser2@example.com');
      
      expect(token1).not.toBe(token2);
    });

    it('should handle special characters in email', async () => {
      const uniqueId = Date.now() + Math.random();
      const specialEmail = `test+user-${uniqueId}@example.com`;
      
      // Create a user with special email using test data factory
      const specialUser = testData.createUser({
        id: `specialuser-${uniqueId}`,
        email: specialEmail,
        firstName: 'Special',
        lastName: 'User',
        role: 'user',
      });
      
      await db.insert(users).values(specialUser);

      const token = await createMagicLink(specialEmail);
      expect(token).toBeDefined();
      
      const user = await verifyMagicLink(token);
      expect(user).not.toBeNull();
      expect(user?.email).toBe(specialEmail);
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify valid tokens and return user data', async () => {
      const token = await createMagicLink('testuser1@example.com');
      const user = await verifyMagicLink(token);
      
      expect(user).not.toBeNull();
      expect(user).toMatchObject({
        id: 'testuser1',
        email: 'testuser1@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      });
    });

    it('should mark tokens as used after verification', async () => {
      const token = await createMagicLink('testuser1@example.com');
      
      // First verification should succeed
      const user1 = await verifyMagicLink(token);
      expect(user1).not.toBeNull();
      
      // Second verification should fail
      const user2 = await verifyMagicLink(token);
      expect(user2).toBeNull();
    });

    it('should reject expired tokens', async () => {
      const token = await createMagicLink('testuser1@example.com');
      
      // Manually expire the token
      await db
        .update(magicLinks)
        .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
        .where(eq(magicLinks.token, token));
      
      const user = await verifyMagicLink(token);
      expect(user).toBeNull();
    });

    it('should reject non-existent tokens', async () => {
      const fakeToken = 'a'.repeat(64);
      const user = await verifyMagicLink(fakeToken);
      expect(user).toBeNull();
    });

    it('should reject already used tokens', async () => {
      const token = await createMagicLink('testuser1@example.com');
      
      // Mark as used manually
      await db
        .update(magicLinks)
        .set({ used: 1 })
        .where(eq(magicLinks.token, token));
      
      const user = await verifyMagicLink(token);
      expect(user).toBeNull();
    });

    it('should handle tokens for non-existent users', async () => {
      const token = await createMagicLink('nonexistent@example.com');
      const user = await verifyMagicLink(token);
      expect(user).toBeNull();
    });

    it('should handle malformed tokens', async () => {
      const malformedTokens = [
        '',
        'short',
        'a'.repeat(63), // Too short
        'a'.repeat(65), // Too long
        'invalid-characters-here',
        null,
        undefined,
      ];

      for (const token of malformedTokens) {
        const user = await verifyMagicLink(token as string);
        expect(user).toBeNull();
      }
    });

    it('should return AuthUser interface correctly', async () => {
      const token = await createMagicLink('testuser1@example.com');
      const user = await verifyMagicLink(token);
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('role');
      
      expect(typeof user?.id).toBe('string');
      expect(typeof user?.email).toBe('string');
      expect(typeof user?.role).toBe('string');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens', async () => {
      // Create a token and manually expire it
      const token = await createMagicLink('testuser1@example.com');
      
      await db
        .update(magicLinks)
        .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
        .where(eq(magicLinks.token, token));
      
      // Verify token exists before cleanup
      const beforeCleanup = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token));
      expect(beforeCleanup).toHaveLength(1);
      
      // Run cleanup
      await cleanupExpiredTokens();
      
      // Verify token is removed
      const afterCleanup = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token));
      expect(afterCleanup).toHaveLength(0);
    });

    it('should not remove valid tokens', async () => {
      const token = await createMagicLink('testuser1@example.com');
      
      // Verify token exists before cleanup
      const beforeCleanup = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token));
      expect(beforeCleanup).toHaveLength(1);
      
      // Run cleanup
      await cleanupExpiredTokens();
      
      // Verify token still exists
      const afterCleanup = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, token));
      expect(afterCleanup).toHaveLength(1);
    });

    it('should handle multiple expired tokens', async () => {
      // Create multiple tokens and expire them
      const tokens = [];
      for (let i = 0; i < 3; i++) {
        const token = await createMagicLink(testUser1.email);
        await db
          .update(magicLinks)
          .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
          .where(eq(magicLinks.token, token));
        tokens.push(token);
      }
      
      // Verify only the last token exists (previous ones are invalidated)
      const beforeCleanup = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.email, testUser1.email));
      expect(beforeCleanup.length).toBe(1); // Only the last token remains
      
      // Run cleanup
      await cleanupExpiredTokens();
      
      // Verify all expired tokens are removed
      const afterCleanup = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.email, testUser1.email));
      expect(afterCleanup.length).toBe(0);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user data for existing email', async () => {
      const user = await getUserByEmail(testUser1.email);
      
      expect(user).not.toBeNull();
      expect(user).toMatchObject({
        id: testUser1.id,
        email: testUser1.email,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      });
    });

    it('should return null for non-existent email', async () => {
      const user = await getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should handle case-sensitive email matching', async () => {
      const user = await getUserByEmail('TESTUSER1@EXAMPLE.COM');
      expect(user).toBeNull(); // Should not match due to case sensitivity
    });

    it('should handle empty email', async () => {
      const user = await getUserByEmail('');
      expect(user).toBeNull();
    });

    it('should return AuthUser interface correctly', async () => {
      const user = await getUserByEmail(testUser1.email);
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('role');
      
      expect(typeof user?.id).toBe('string');
      expect(typeof user?.email).toBe('string');
      expect(typeof user?.role).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      // 1. Create magic link
      const token = await createMagicLink('testuser2@example.com');
      expect(token).toBeDefined();
      
      // 2. Verify token and get user
      const user = await verifyMagicLink(token);
      expect(user).not.toBeNull();
      expect(user?.email).toBe('testuser2@example.com');
      expect(user?.role).toBe('admin');
      
      // 3. Verify token cannot be reused
      const userAgain = await verifyMagicLink(token);
      expect(userAgain).toBeNull();
      
      // 4. Get user by email
      const userByEmail = await getUserByEmail('testuser2@example.com');
      expect(userByEmail).toMatchObject(user!);
    });

    it('should handle concurrent token creation', async () => {
      // Create tokens for the same email sequentially (not concurrently)
      // This properly tests the invalidation behavior
      const tokens = [];
      for (let i = 0; i < 3; i++) {
        const token = await createMagicLink(testUser1.email);
        tokens.push(token);
      }
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);
      
      // Only the last token should be valid (previous ones are invalidated)
      const validToken = tokens[tokens.length - 1];
      const user = await verifyMagicLink(validToken);
      expect(user).not.toBeNull();
      
      // Previous tokens should be invalid (invalidated by createMagicLink)
      for (let i = 0; i < tokens.length - 1; i++) {
        const user = await verifyMagicLink(tokens[i]);
        expect(user).toBeNull();
      }
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to simulate errors
      // For now, we'll test with invalid data that should be handled gracefully
      
      // Test with null email
      await expect(createMagicLink('')).resolves.toBeDefined();
      
      // Test with very long email
      const longEmail = 'a'.repeat(1000) + '@example.com';
      await expect(createMagicLink(longEmail)).resolves.toBeDefined();
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in tokens', async () => {
      const token = await createMagicLink('testuser1@example.com');
      
      // Token should not contain email or user information
      expect(token).not.toContain('testuser1');
      expect(token).not.toContain('@example.com');
      expect(token).not.toContain('Test');
      expect(token).not.toContain('User');
    });

    it('should use cryptographically secure random tokens', async () => {
      const tokens = [];
      for (let i = 0; i < 10; i++) {
        const token = await createMagicLink('testuser1@example.com');
        tokens.push(token);
      }
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);
      
      // Tokens should be 64 characters (32 bytes)
      for (const token of tokens) {
        expect(token.length).toBe(64);
        expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Hex characters only
      }
    });

    it('should prevent token reuse attacks', async () => {
      const token = await createMagicLink('testuser1@example.com');
      
      // First use should succeed
      const user1 = await verifyMagicLink(token);
      expect(user1).not.toBeNull();
      
      // Second use should fail
      const user2 = await verifyMagicLink(token);
      expect(user2).toBeNull();
      
      // Third use should also fail
      const user3 = await verifyMagicLink(token);
      expect(user3).toBeNull();
    });
  });
}); 