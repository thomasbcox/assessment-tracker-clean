import { db, magicLinks, users } from '@/lib/db';
import { eq, and, lt } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface MagicLinkData {
  email: string;
  token: string;
  expiresAt: string;
  used?: number;
}

export class AuthService {
  static async createMagicLink(email: string): Promise<string> {
    try {
      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) throw new Error('User not found');

      // Check for existing unused tokens (rate limiting)
      const existingTokens = await db.select().from(magicLinks)
        .where(and(
          eq(magicLinks.email, email),
          eq(magicLinks.used, 0),
          lt(magicLinks.expiresAt, new Date().toISOString())
        ));

      if (existingTokens.length >= 3) {
        throw new Error('Too many active tokens. Please wait before requesting another one.');
      }

      // Invalidate all previous unused tokens for this email
      await db.update(magicLinks)
        .set({ used: 1 })
        .where(and(eq(magicLinks.email, email), eq(magicLinks.used, 0)));

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      await db.insert(magicLinks).values({
        email,
        token,
        expiresAt,
        used: 0,
      });

      return token;
    } catch (error) {
      logger.dbError('create magic link', error as Error, { email });
      throw error;
    }
  }

  static async verifyMagicLink(token: string): Promise<AuthUser | null> {
    try {
      // Clean up expired tokens first
      await this.cleanupExpiredTokens();

      const [link] = await db.select().from(magicLinks)
        .where(eq(magicLinks.token, token))
        .limit(1);

      if (!link || link.used || new Date() > new Date(link.expiresAt)) {
        return null;
      }

      // Mark as used
      await db.update(magicLinks)
        .set({ used: 1 })
        .where(eq(magicLinks.token, token));

      // Get user
      const [user] = await db.select().from(users)
        .where(eq(users.email, link.email))
        .limit(1);

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    } catch (error) {
      logger.dbError('verify magic link', error as Error, { token });
      throw error;
    }
  }

  static async cleanupExpiredTokens(): Promise<void> {
    try {
      await db.delete(magicLinks)
        .where(lt(magicLinks.expiresAt, new Date().toISOString()));
    } catch (error) {
      logger.dbError('cleanup expired tokens', error as Error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const [user] = await db.select().from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    } catch (error) {
      logger.dbError('get user by email', error as Error, { email });
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const [user] = await db.select().from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    } catch (error) {
      logger.dbError('get user by id', error as Error, { userId });
      throw error;
    }
  }

  static async validateUserRole(userId: string, requiredRoles: string[]): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;
      return requiredRoles.includes(user.role);
    } catch (error) {
      logger.dbError('validate user role', error as Error, { userId, requiredRoles });
      throw error;
    }
  }

  static async isSuperAdmin(userId: string): Promise<boolean> {
    return this.validateUserRole(userId, ['super_admin']);
  }

  static async isAdmin(userId: string): Promise<boolean> {
    return this.validateUserRole(userId, ['super_admin', 'admin']);
  }

  static async isManager(userId: string): Promise<boolean> {
    return this.validateUserRole(userId, ['super_admin', 'admin', 'manager']);
  }

  static async getActiveTokensForEmail(email: string): Promise<MagicLinkData[]> {
    try {
      const tokens = await db.select().from(magicLinks)
        .where(and(
          eq(magicLinks.email, email),
          eq(magicLinks.used, 0),
          lt(magicLinks.expiresAt, new Date().toISOString())
        ));

      return tokens.map(token => ({
        email: token.email,
        token: token.token,
        expiresAt: token.expiresAt,
        used: token.used || 0,
      }));
    } catch (error) {
      logger.dbError('get active tokens for email', error as Error, { email });
      throw error;
    }
  }

  static async invalidateAllTokensForEmail(email: string): Promise<void> {
    try {
      await db.update(magicLinks)
        .set({ used: 1 })
        .where(eq(magicLinks.email, email));
    } catch (error) {
      logger.dbError('invalidate all tokens for email', error as Error, { email });
      throw error;
    }
  }
} 