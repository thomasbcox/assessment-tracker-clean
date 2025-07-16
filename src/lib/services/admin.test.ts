import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdminService } from './admin';
import { db, users } from '@/lib/db';
import { eq, like } from 'drizzle-orm';
import type { CreateAdminUserInput, UpdateAdminUserInput, AdminUser } from '@/lib/types/service-interfaces';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  users: {
    id: 'id',
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    role: 'role',
    isActive: 'isActive',
    createdAt: 'createdAt'
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('AdminService', () => {
  const mockUser: AdminUser = {
    id: 'user123',
    email: 'admin@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockCreateInput: CreateAdminUserInput = {
    id: 'user123',
    email: 'admin@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin'
  };

  const mockUpdateInput: UpdateAdminUserInput = {
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'manager'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await AdminService.createUser(mockCreateInput);

      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockInsert.values).toHaveBeenCalledWith({
        ...mockCreateInput,
        isActive: 1
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user with same email exists', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockUser])
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(AdminService.createUser(mockCreateInput))
        .rejects.toThrow('User with this email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockUser])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.getUserById('user123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateInput };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AdminService.updateUser('user123', mockUpdateInput);

      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      await expect(AdminService.updateUser('nonexistent', mockUpdateInput))
        .rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockUser])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await AdminService.deleteUser('user123');

      expect(mockDb.delete).toHaveBeenCalledWith(users);
      expect(mockDelete.where).toHaveBeenCalledWith(eq(users.id, 'user123'));
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user456', email: 'user2@example.com' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockUsers)
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.getAllUsers();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user456', email: 'admin2@example.com' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockUsers)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.getUsersByRole('admin');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user456', email: 'active@example.com' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockUsers)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.getActiveUsers();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getInactiveUsers', () => {
    it('should return inactive users', async () => {
      const mockUsers = [{ ...mockUser, isActive: 0 }, { ...mockUser, id: 'user456', isActive: 0 }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockUsers)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.getInactiveUsers();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockUsers = [mockUser];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockUsers)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AdminService.searchUsers('john');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: 0 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([deactivatedUser])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AdminService.deactivateUser('user123');

      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(result).toEqual(deactivatedUser);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const activatedUser = { ...mockUser, isActive: 1 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([activatedUser])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AdminService.activateUser('user123');

      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(result).toEqual(activatedUser);
    });
  });

  describe('validateUserData', () => {
    it('should validate valid user data', () => {
      const result = AdminService.validateUserData(mockCreateInput);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidInput = { ...mockCreateInput, email: 'invalid-email' };
      const result = AdminService.validateUserData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });

    it('should reject invalid role', () => {
      const invalidInput = { ...mockCreateInput, role: 'invalid-role' as any };
      const result = AdminService.validateUserData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid role');
    });
  });
}); 