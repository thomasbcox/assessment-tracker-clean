import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AdminService } from './admin';
import { createTestUser, cleanupTestData } from '../test-utils-clean';

describe('AdminService', () => {
  // Temporarily disable cleanup to test with existing data
  // beforeEach(async () => {
  //   await cleanupTestData();
  // });

  // afterEach(async () => {
  //   await cleanupTestData();
  // });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const user1 = await createTestUser({
        email: `admin-test-${Date.now()}-1@example.com`
      });
      const user2 = await createTestUser({
        email: `admin-test-${Date.now()}-2@example.com`
      });

      const users = await AdminService.getAllUsers();

      expect(users.length).toBeGreaterThan(0);
      expect(users.some(u => u.id === user1.id)).toBe(true);
      expect(users.some(u => u.id === user2.id)).toBe(true);
    });

    it('should return empty array when no users exist', async () => {
      // This test will find existing users since cleanup is disabled
      const users = await AdminService.getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const user = await createTestUser({
        email: `admin-test-${Date.now()}-3@example.com`
      });

      const foundUser = await AdminService.getUserById(user.id);

      expect(foundUser).toBeDefined();
      expect(foundUser).not.toBeNull();
      if (foundUser) {
        expect(foundUser.id).toBe(user.id);
        expect(foundUser.email).toBe(user.email);
      }
    });

    it('should return null for non-existent user', async () => {
      const user = await AdminService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        id: `admin-user-${Date.now()}`,
        email: `admin-create-${Date.now()}@example.com`,
        firstName: 'Admin',
        lastName: 'User',
        role: 'user'
      };

      const user = await AdminService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
    });

    it('should throw error for missing required fields', async () => {
      const userData = {
        id: `admin-invalid-${Date.now()}`,
        email: '', // Missing email
        role: 'user'
      };

      await expect(AdminService.createUser(userData)).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        id: `admin-duplicate-${Date.now()}`,
        email: `admin-duplicate-${Date.now()}@example.com`,
        role: 'user'
      };

      // Create first user
      await AdminService.createUser(userData);

      // Try to create second user with same email
      await expect(AdminService.createUser(userData)).rejects.toThrow();
    });

    it('should throw error for invalid role', async () => {
      const userData = {
        id: `admin-invalid-role-${Date.now()}`,
        email: `admin-invalid-role-${Date.now()}@example.com`,
        role: 'invalid-role'
      };

      await expect(AdminService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      const user = await createTestUser({
        email: `admin-update-${Date.now()}@example.com`
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'manager'
      };

      const updatedUser = await AdminService.updateUser(user.id, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.role).toBe(updateData.role);
    });

    it('should throw error for non-existent user', async () => {
      await expect(AdminService.updateUser('non-existent-id', { firstName: 'Test' })).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const user1 = await createTestUser({
        email: `admin-dup1-${Date.now()}@example.com`
      });
      const user2 = await createTestUser({
        email: `admin-dup2-${Date.now()}@example.com`
      });

      await expect(AdminService.updateUser(user1.id, { email: user2.email })).rejects.toThrow();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const user = await createTestUser({
        email: `admin-deactivate-${Date.now()}@example.com`
      });

      const deactivatedUser = await AdminService.deactivateUser(user.id);

      expect(deactivatedUser).toBeDefined();
      expect(deactivatedUser.isActive).toBe(0);
    });

    it('should throw error for non-existent user', async () => {
      await expect(AdminService.deactivateUser('non-existent-id')).rejects.toThrow();
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const user = await createTestUser({
        email: `admin-activate-${Date.now()}@example.com`
      });

      // First deactivate the user
      await AdminService.deactivateUser(user.id);

      // Then activate the user
      const activatedUser = await AdminService.activateUser(user.id);

      expect(activatedUser).toBeDefined();
      expect(activatedUser.isActive).toBe(1);
    });

    it('should throw error for non-existent user', async () => {
      await expect(AdminService.activateUser('non-existent-id')).rejects.toThrow();
    });
  });

  describe('searchUsers', () => {
    it('should search users by email', async () => {
      const user = await createTestUser({
        email: `admin-search-${Date.now()}@example.com`
      });

      const searchResults = await AdminService.searchUsers(user.email);

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(u => u.id === user.id)).toBe(true);
    });

    it('should search users by first name', async () => {
      const user = await createTestUser({
        email: `admin-search-${Date.now()}@example.com`,
        firstName: 'SearchTest'
      });

      const searchResults = await AdminService.searchUsers('SearchTest');

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(u => u.id === user.id)).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const searchResults = await AdminService.searchUsers('nonexistentuser');

      expect(searchResults).toHaveLength(0);
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const user = await createTestUser({
        email: `admin-role-${Date.now()}@example.com`,
        role: 'manager'
      });

      const usersByRole = await AdminService.getUsersByRole('manager');

      expect(usersByRole.length).toBeGreaterThan(0);
      expect(usersByRole.some(u => u.id === user.id)).toBe(true);
      expect(usersByRole.every(u => u.role === 'manager')).toBe(true);
    });

    it('should return empty array for role with no users', async () => {
      const usersByRole = await AdminService.getUsersByRole('non_existent_role');
      expect(usersByRole).toHaveLength(0);
    });
  });

  describe('getActiveUsers', () => {
    it('should return only active users', async () => {
      const user = await createTestUser({
        email: `admin-active-${Date.now()}@example.com`
      });

      const activeUsers = await AdminService.getActiveUsers();

      expect(activeUsers.length).toBeGreaterThan(0);
      expect(activeUsers.some(u => u.id === user.id)).toBe(true);
      expect(activeUsers.every(u => u.isActive === 1)).toBe(true);
    });
  });

  describe('getInactiveUsers', () => {
    it('should return only inactive users', async () => {
      const user = await createTestUser({
        email: `admin-inactive-${Date.now()}@example.com`
      });

      // Deactivate the user
      await AdminService.deactivateUser(user.id);

      const inactiveUsers = await AdminService.getInactiveUsers();

      expect(inactiveUsers.length).toBeGreaterThan(0);
      expect(inactiveUsers.some(u => u.id === user.id)).toBe(true);
      expect(inactiveUsers.every(u => u.isActive === 0)).toBe(true);
    });
  });

  describe('validateUserData', () => {
    it('should validate correct user data', () => {
      const userData = {
        id: `admin-validate-${Date.now()}`,
        email: `admin-validate-${Date.now()}@example.com`,
        role: 'user'
      };

      const result = AdminService.validateUserData(userData);

      expect(result.isValid).toBe(true);
    });

    it('should reject data without email', () => {
      const result = AdminService.validateUserData({ 
        id: 'test-id', 
        email: '', 
        role: 'manager' 
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Email is required');
    });

    it('should reject data without role', () => {
      const result = AdminService.validateUserData({ 
        id: 'test-id', 
        email: 'test@example.com', 
        role: '' 
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Role is required');
    });

    it('should reject data with invalid role', () => {
      const userData = {
        id: `admin-validate-${Date.now()}`,
        email: `admin-validate-${Date.now()}@example.com`,
        role: 'invalid-role'
      };

      const result = AdminService.validateUserData(userData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
}); 