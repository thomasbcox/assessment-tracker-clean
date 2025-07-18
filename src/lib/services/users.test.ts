import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestUser, cleanup } from '../test-utils-clean';
import * as userService from './users';
import { db } from '../db';
import { users } from '../db';

describe('UserService', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const createdUser = await createTestUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      const user = await userService.getUserById(createdUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById('non-existent-id');

      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      await createTestUser({ email: 'user1@example.com' });
      await createTestUser({ email: 'user2@example.com' });
      await createTestUser({ email: 'user3@example.com' });

      const allUsers = await userService.getAllUsers();

      expect(allUsers).toHaveLength(3);
      expect(allUsers.some(u => u.email === 'user1@example.com')).toBe(true);
      expect(allUsers.some(u => u.email === 'user2@example.com')).toBe(true);
      expect(allUsers.some(u => u.email === 'user3@example.com')).toBe(true);
    });

    it('should return empty array when no users exist', async () => {
      const allUsers = await userService.getAllUsers();

      expect(allUsers).toHaveLength(0);
    });
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };

      const user = await userService.createUser(userData);

      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBe(userData.id);
      expect(user.isActive).toBe(1);
    });

    it('should create a manager user', async () => {
      const userData = {
        id: 'manager-id',
        email: 'manager@example.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager'
      };

      const user = await userService.createUser(userData);

      expect(user.role).toBe('manager');
    });

    it('should create an admin user', async () => {
      const userData = {
        id: 'admin-id',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      };

      const user = await userService.createUser(userData);

      expect(user.role).toBe('admin');
    });

    it('should throw error for invalid email format', async () => {
      const userData = {
        id: 'test-id',
        email: 'invalid-email',
        role: 'user'
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });

    it('should throw error for invalid role', async () => {
      const userData = {
        id: 'test-id',
        email: 'test@example.com',
        role: 'invalid-role'
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const createdUser = await createTestUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const updatedUser = await userService.updateUser(createdUser.id, updateData);

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.email).toBe('test@example.com'); // Should not change
    });

    it('should update user role', async () => {
      const createdUser = await createTestUser({
        email: 'test@example.com',
        role: 'user'
      });

      const updatedUser = await userService.updateUser(createdUser.id, {
        role: 'manager'
      });

      expect(updatedUser.role).toBe('manager');
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.updateUser('non-existent-id', { firstName: 'Test' })).rejects.toThrow();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const createdUser = await createTestUser({
        email: 'test@example.com'
      });

      const deactivatedUser = await userService.deactivateUser(createdUser.id);

      expect(deactivatedUser.isActive).toBe(0);
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.deactivateUser('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const user = await createTestUser({
        email: 'test@example.com'
      });

      const stats = await userService.getUserStats(user.id);

      expect(stats).toBeDefined();
      expect(stats.total).toBeDefined();
      expect(stats.completed).toBeDefined();
      expect(stats.pending).toBeDefined();
    });

    it('should return zero stats for non-existent user', async () => {
      const stats = await userService.getUserStats('non-existent-id');

      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.pending).toBe(0);
    });
  });

  describe('getUserAssessments', () => {
    it('should return user assessments', async () => {
      const user = await createTestUser({
        email: 'test@example.com'
      });

      const assessments = await userService.getUserAssessments(user.id);

      expect(Array.isArray(assessments)).toBe(true);
    });

    it('should return empty array for non-existent user', async () => {
      const assessments = await userService.getUserAssessments('non-existent-id');

      expect(assessments).toEqual([]);
    });
  });

  describe('validateUserData', () => {
    it('should validate valid user data', () => {
      const userData = {
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User'
      };

      const result = userService.validateUserData(userData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const userData = {
        email: 'invalid-email',
        role: 'user'
      };

      const result = userService.validateUserData(userData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid role', () => {
      const userData = {
        email: 'test@example.com',
        role: 'invalid-role'
      };

      const result = userService.validateUserData(userData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
}); 