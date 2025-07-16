import { db, users } from '@/lib/db';
import { eq, like, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface AdminUserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: number | null;
  createdAt: string;
}

export class AdminService {
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(users.createdAt);
      return allUsers.map(user => ({ ...user, createdAt: user.createdAt || '', isActive: user.isActive || 0 }));
    } catch (error) {
      logger.dbError('fetch all users', error as Error);
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return null;
      return { ...user, createdAt: user.createdAt || '' };
    } catch (error) {
      logger.dbError('fetch user by id', error as Error, { userId });
      throw error;
    }
  }

  static async createUser(data: AdminUserData): Promise<AdminUser> {
    try {
      // Validate required fields
      if (!data.id || !data.email || !data.role) {
        throw new Error('User ID, email, and role are required');
      }

      // Check for duplicate email
      const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
      if (existing.length > 0) throw new Error('User with this email already exists');

      // Validate role
      const validRoles = ['super_admin', 'admin', 'manager', 'user'];
      if (!validRoles.includes(data.role)) {
        throw new Error('Invalid role. Must be one of: super_admin, admin, manager, user');
      }

      const [user] = await db.insert(users).values({
        id: data.id,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : 1,
      }).returning();

      return { ...user, createdAt: user.createdAt || '' };
    } catch (error) {
      logger.dbError('create user', error as Error, data);
      throw error;
    }
  }

  static async updateUser(userId: string, data: Partial<AdminUserData>): Promise<AdminUser> {
    try {
      const existing = await this.getUserById(userId);
      if (!existing) throw new Error('User not found');

      // Check for duplicate email if email is being updated
      if (data.email && data.email !== existing.email) {
        const duplicate = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
        if (duplicate.length > 0) throw new Error('User with this email already exists');
      }

      // Validate role if being updated
      if (data.role) {
        const validRoles = ['super_admin', 'admin', 'manager', 'user'];
        if (!validRoles.includes(data.role)) {
          throw new Error('Invalid role. Must be one of: super_admin, admin, manager, user');
        }
      }

      const [updated] = await db.update(users)
        .set({
          ...(data.email && { email: data.email }),
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.role && { role: data.role }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updated) throw new Error('Failed to update user');
      return { ...updated, createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update user', error as Error, { userId, data });
      throw error;
    }
  }

  static async deactivateUser(userId: string): Promise<AdminUser> {
    try {
      const [deactivated] = await db.update(users)
        .set({ isActive: 0 })
        .where(eq(users.id, userId))
        .returning();

      if (!deactivated) throw new Error('User not found');
      return { ...deactivated, createdAt: deactivated.createdAt || '' };
    } catch (error) {
      logger.dbError('deactivate user', error as Error, { userId });
      throw error;
    }
  }

  static async activateUser(userId: string): Promise<AdminUser> {
    try {
      const [activated] = await db.update(users)
        .set({ isActive: 1 })
        .where(eq(users.id, userId))
        .returning();

      if (!activated) throw new Error('User not found');
      return { ...activated, createdAt: activated.createdAt || '' };
    } catch (error) {
      logger.dbError('activate user', error as Error, { userId });
      throw error;
    }
  }

  static async searchUsers(query: string): Promise<AdminUser[]> {
    try {
      const userResults = await db.select().from(users)
        .where(
          or(
            like(users.email, `%${query}%`),
            like(users.firstName, `%${query}%`),
            like(users.lastName, `%${query}%`)
          )
        )
        .orderBy(users.createdAt);
      
      return userResults.map(user => ({ ...user, createdAt: user.createdAt || '', isActive: user.isActive || 0 }));
    } catch (error) {
      logger.dbError('search users', error as Error, { query });
      throw error;
    }
  }

  static async getUsersByRole(role: string): Promise<AdminUser[]> {
    try {
      const userResults = await db.select().from(users)
        .where(eq(users.role, role))
        .orderBy(users.createdAt);
      
      return userResults.map(user => ({ ...user, createdAt: user.createdAt || '', isActive: user.isActive || 0 }));
    } catch (error) {
      logger.dbError('fetch users by role', error as Error, { role });
      throw error;
    }
  }

  static async getActiveUsers(): Promise<AdminUser[]> {
    try {
      const userResults = await db.select().from(users)
        .where(eq(users.isActive, 1))
        .orderBy(users.createdAt);
      
      return userResults.map(user => ({ ...user, createdAt: user.createdAt || '', isActive: user.isActive || 0 }));
    } catch (error) {
      logger.dbError('fetch active users', error as Error);
      throw error;
    }
  }

  static async getInactiveUsers(): Promise<AdminUser[]> {
    try {
      const userResults = await db.select().from(users)
        .where(eq(users.isActive, 0))
        .orderBy(users.createdAt);
      
      return userResults.map(user => ({ ...user, createdAt: user.createdAt || '', isActive: user.isActive || 0 }));
    } catch (error) {
      logger.dbError('fetch inactive users', error as Error);
      throw error;
    }
  }

  static validateUserData(data: AdminUserData): { isValid: boolean; error?: string } {
    if (!data.email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!data.role) {
      return { isValid: false, error: 'Role is required' };
    }
    const validRoles = ['super_admin', 'admin', 'manager', 'user'];
    if (!validRoles.includes(data.role)) {
      return { isValid: false, error: 'Invalid role' };
    }
    return { isValid: true };
  }
} 