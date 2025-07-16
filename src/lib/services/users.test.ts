import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getUserById, getUserStats, getUserAssessments, createUser, updateUser, deactivateUser, getAllUsers, validateUserData } from './users';
import { db } from '../db';
import { ServiceError } from '../types/service-interfaces';

// Mock the database
jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    dbError: jest.fn()
  }
}));

describe('Users Service', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const mockLogger = require('../logger').logger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: 1,
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await getUserById('user1');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      const result = await getUserById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(getUserById('user1')).rejects.toThrow('Failed to fetch user');
    });
  });

  describe('getUserStats', () => {
    it('should return correct user statistics', async () => {
      const mockInstances = [
        { id: 1, userId: 'user1', periodId: 1, status: 'completed', completedAt: '2023-01-01T00:00:00Z' },
        { id: 2, userId: 'user1', periodId: 2, status: 'pending', completedAt: null },
        { id: 3, userId: 'user1', periodId: 3, status: 'completed', completedAt: '2023-01-02T00:00:00Z' }
      ];

      const mockPeriods = [
        { id: 1, isActive: 1 },
        { id: 2, isActive: 1 },
        { id: 3, isActive: 1 }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockInstances)
        })
      } as any);

      const result = await getUserStats('user1');

      expect(result).toEqual({
        total: 3,
        completed: 2,
        pending: 1
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(getUserStats('user1')).rejects.toThrow('Failed to fetch user statistics');
    });
  });

  describe('getUserAssessments', () => {
    it('should return user assessments with related data', async () => {
      const mockInstances = [
        {
          id: 1,
          userId: 'user1',
          periodId: 1,
          templateId: 1,
          status: 'completed',
          completedAt: '2023-01-01T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          periodName: 'Q1 2023',
          periodStartDate: '2023-01-01',
          periodEndDate: '2023-03-31',
          userEmail: 'test@example.com',
          userFirstName: 'Test',
          userLastName: 'User'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockInstances)
            })
          })
        })
      } as any);

      const result = await getUserAssessments('user1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Assessment #1',
        description: 'Assessment for Q1 2023 period',
        status: 'completed',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        assignedTo: 'test@example.com',
        dueDate: '2023-03-31',
        periodName: 'Q1 2023',
        templateId: 1
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(getUserAssessments('user1')).rejects.toThrow('Failed to fetch user assessments');
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: 1,
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser])
        })
      } as any);

      const result = await createUser({
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      });

      expect(result).toEqual(mockUser);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.insert.mockImplementation(() => {
        throw error;
      });

      await expect(createUser({
        id: 'user1',
        email: 'test@example.com',
        role: 'user'
      })).rejects.toThrow('Failed to create user');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'User',
        role: 'user',
        isActive: 1,
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await updateUser('user1', { firstName: 'Jane' });

      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(updateUser('nonexistent', { firstName: 'Jane' })).rejects.toThrow('User with id nonexistent not found');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.update.mockImplementation(() => {
        throw error;
      });

      await expect(updateUser('user1', { firstName: 'Jane' })).rejects.toThrow('Failed to update user');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: 0,
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await deactivateUser('user1');

      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(deactivateUser('nonexistent')).rejects.toThrow('User with id nonexistent not found');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.update.mockImplementation(() => {
        throw error;
      });

      await expect(deactivateUser('user1')).rejects.toThrow('Failed to deactivate user');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'test1@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isActive: 1,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'user2',
          email: 'test2@example.com',
          firstName: 'Test',
          lastName: 'User2',
          role: 'admin',
          isActive: 1,
          createdAt: '2023-01-02T00:00:00Z'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockUsers)
        })
      } as any);

      const result = await getAllUsers();

      expect(result).toEqual(mockUsers);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(getAllUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('validateUserData', () => {
    it('should validate user data successfully', () => {
      const result = validateUserData({
        email: 'test@example.com',
        role: 'user'
      });

      expect(result.isValid).toBe(true);
    });

    it('should return error for missing email', () => {
      const result = validateUserData({
        email: '',
        role: 'user'
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('email is required');
    });

    it('should return error for missing role', () => {
      const result = validateUserData({
        email: 'test@example.com',
        role: ''
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('role is required');
    });
  });
}); 