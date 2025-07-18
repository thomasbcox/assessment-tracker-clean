import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestUser, cleanup } from '../test-utils-clean';
import { AuthService } from './auth';
import { db, magicLinks } from '../db';
import { eq } from 'drizzle-orm';

// Helper function to create unique email
const createUniqueEmail = (baseEmail: string = 'test@example.com') => {
  const timestamp = Date.now();
  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}-${timestamp}@${domain}`;
};

describe('AuthService', () => {
  // Temporarily disable cleanup to avoid foreign key constraint issues
  // beforeEach(async () => {
  //   await cleanup();
  // });

  // afterEach(async () => {
  //   await cleanup();
  // });

  describe('createMagicLink', () => {
    it('should create magic link for existing user', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify the magic link was created in the database
      const [magicLink] = await db.select().from(magicLinks).where(eq(magicLinks.token, token)).limit(1);
      expect(magicLink).toBeDefined();
      expect(magicLink.email).toBe(user.email);
      expect(magicLink.used).toBe(0);
    });

    it('should throw error for non-existent user', async () => {
      await expect(AuthService.createMagicLink('nonexistent@example.com')).rejects.toThrow('User not found');
    });

    it('should throw error for invalid email format', async () => {
      await expect(AuthService.createMagicLink('invalid-email')).rejects.toThrow();
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify valid magic link', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);
      const result = await AuthService.verifyMagicLink(token);

      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe(user.email);
      expect(result?.firstName).toBe(user.firstName);
      expect(result?.lastName).toBe(user.lastName);
      expect(result?.role).toBe(user.role);
    });

    it('should return null for invalid token', async () => {
      const result = await AuthService.verifyMagicLink('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);
      
      // Update the magic link to be expired
      await db.update(magicLinks)
        .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
        .where(eq(magicLinks.token, token));

      const result = await AuthService.verifyMagicLink(token);
      expect(result).toBeNull();
    });

    it('should return null for already used token', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);
      
      // Mark the token as used
      await db.update(magicLinks)
        .set({ used: 1 })
        .where(eq(magicLinks.token, token));

      const result = await AuthService.verifyMagicLink(token);
      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      // Create a magic link and manually set it as expired
      const token = await AuthService.createMagicLink(user.email);
      
      await db.update(magicLinks)
        .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
        .where(eq(magicLinks.token, token));

      await AuthService.cleanupExpiredTokens();

      // Verify the expired token was deleted
      const [magicLink] = await db.select().from(magicLinks).where(eq(magicLinks.token, token)).limit(1);
      expect(magicLink).toBeUndefined();
    });

    it('should not delete valid magic links', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);

      const deletedCount = await AuthService.cleanupExpiredTokens();

      // Verify the valid token still exists
      const [magicLink] = await db.select().from(magicLinks).where(eq(magicLinks.token, token)).limit(1);
      expect(magicLink).toBeDefined();
      expect(magicLink.token).toBe(token);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const createdUser = await createTestUser({
        email: createUniqueEmail()
      });

      const user = await AuthService.getUserByEmail(createdUser.email);

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.email).toBe(createdUser.email);
      expect(user?.firstName).toBe(createdUser.firstName);
      expect(user?.lastName).toBe(createdUser.lastName);
      expect(user?.role).toBe(createdUser.role);
    });

    it('should return null for non-existent email', async () => {
      const user = await AuthService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const createdUser = await createTestUser({
        email: createUniqueEmail()
      });

      const user = await AuthService.getUserById(createdUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.email).toBe(createdUser.email);
    });

    it('should return null for non-existent ID', async () => {
      const user = await AuthService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('validateUserRole', () => {
    it('should validate user role correctly', async () => {
      const user = await createTestUser({
        email: createUniqueEmail(),
        role: 'admin'
      });

      const isAdmin = await AuthService.validateUserRole(user.id, ['admin']);
      const isManager = await AuthService.validateUserRole(user.id, ['manager', 'admin']);
      const isUser = await AuthService.validateUserRole(user.id, ['user']);

      expect(isAdmin).toBe(true);
      expect(isManager).toBe(true);
      expect(isUser).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await AuthService.validateUserRole('non-existent-id', ['admin']);
      expect(result).toBe(false);
    });
  });

  describe('role validation helpers', () => {
    it('should validate super admin correctly', async () => {
      const superAdmin = await createTestUser({
        email: createUniqueEmail('superadmin@example.com'),
        role: 'super_admin'
      });

      const regularUser = await createTestUser({
        email: createUniqueEmail('user@example.com'),
        role: 'user'
      });

      const isSuperAdmin1 = await AuthService.isSuperAdmin(superAdmin.id);
      const isSuperAdmin2 = await AuthService.isSuperAdmin(regularUser.id);

      expect(isSuperAdmin1).toBe(true);
      expect(isSuperAdmin2).toBe(false);
    });

    it('should validate admin correctly', async () => {
      const admin = await createTestUser({
        email: createUniqueEmail('admin@example.com'),
        role: 'admin'
      });

      const user = await createTestUser({
        email: createUniqueEmail('user@example.com'),
        role: 'user'
      });

      const isAdmin1 = await AuthService.isAdmin(admin.id);
      const isAdmin2 = await AuthService.isAdmin(user.id);

      expect(isAdmin1).toBe(true);
      expect(isAdmin2).toBe(false);
    });

    it('should validate manager correctly', async () => {
      const manager = await createTestUser({
        email: createUniqueEmail('manager@example.com'),
        role: 'manager'
      });

      const user = await createTestUser({
        email: createUniqueEmail('user@example.com'),
        role: 'user'
      });

      const isManager1 = await AuthService.isManager(manager.id);
      const isManager2 = await AuthService.isManager(user.id);

      expect(isManager1).toBe(true);
      expect(isManager2).toBe(false);
    });
  });

  describe('getActiveTokensForEmail', () => {
    it('should return active tokens for email', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);

      const tokens = await AuthService.getActiveTokensForEmail(user.email);

      expect(tokens).toHaveLength(1); // Should have one active token
      expect(tokens[0].email).toBe(user.email);
      expect(tokens[0].used).toBe(0);
    });

    it('should return empty array for non-existent email', async () => {
      const tokens = await AuthService.getActiveTokensForEmail('nonexistent@example.com');
      expect(tokens).toHaveLength(0);
    });
  });

  describe('invalidateAllTokensForEmail', () => {
    it('should invalidate all tokens for email', async () => {
      const user = await createTestUser({
        email: createUniqueEmail()
      });

      const token = await AuthService.createMagicLink(user.email);

      await AuthService.invalidateAllTokensForEmail(user.email);

      // Verify the token was invalidated
      const [magicLink] = await db.select().from(magicLinks).where(eq(magicLinks.token, token)).limit(1);
      expect(magicLink.used).toBe(1);
    });
  });
}); 