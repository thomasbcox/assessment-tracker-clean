import { db, magicLinks, users } from './db';
import { createMagicLink, verifyMagicLink, cleanupExpiredTokens } from './auth';
import { eq } from 'drizzle-orm';

beforeAll(async () => {
  // Insert a test user
  await db.insert(users).values({
    id: 'testuser',
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  });
});

afterAll(async () => {
  // Clean up test user and tokens
  await db.delete(magicLinks).where(eq(magicLinks.email, 'testuser@example.com'));
  await db.delete(users).where(eq(users.email, 'testuser@example.com'));
});

describe('Magic Link Token Logic', () => {
  it('should create a new magic link and invalidate previous ones', async () => {
    // Create first token
    const token1 = await createMagicLink('testuser@example.com');
    // Create second token (should invalidate the first)
    const token2 = await createMagicLink('testuser@example.com');

    // Only the second token should be valid
    const user2 = await verifyMagicLink(token2);
    expect(user2).not.toBeNull();
    expect(user2?.email).toBe('testuser@example.com');

    // The first token should now be invalid
    const user1 = await verifyMagicLink(token1);
    expect(user1).toBeNull();
  });

  it('should expire tokens after their expiration time', async () => {
    // Create a token with a short expiration
    const token = await createMagicLink('testuser@example.com');
    // Manually expire the token
    await db.update(magicLinks).set({ expiresAt: new Date(Date.now() - 1000).toISOString() }).where(eq(magicLinks.token, token));
    // Cleanup expired tokens
    await cleanupExpiredTokens();
    // Token should now be gone
    const user = await verifyMagicLink(token);
    expect(user).toBeNull();
  });

  it('should mark tokens as used after verification', async () => {
    const token = await createMagicLink('testuser@example.com');
    const user = await verifyMagicLink(token);
    expect(user).not.toBeNull();
    // Try to use the same token again
    const userAgain = await verifyMagicLink(token);
    expect(userAgain).toBeNull();
  });
}); 