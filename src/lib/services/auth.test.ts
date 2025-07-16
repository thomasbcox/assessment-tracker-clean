import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService } from './auth';
import { db, users } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/logger');

const mockDb = db as jest.Mocked<typeof db>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.authenticateUser('test@example.com', 'password123');

      expect(result).toEqual({
        success: true,
        user: mockUser,
        message: 'Authentication successful'
      });
    });

    it('should reject authentication for non-existent user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      const result = await AuthService.authenticateUser('nonexistent@example.com', 'password123');

      expect(result).toEqual({
        success: false,
        user: null,
        message: 'Invalid email or password'
      });
    });

    it('should reject authentication for inactive user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 0,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.authenticateUser('test@example.com', 'password123');

      expect(result).toEqual({
        success: false,
        user: null,
        message: 'Account is deactivated'
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(AuthService.authenticateUser('test@example.com', 'password123'))
        .rejects.toThrow('Database error');
      expect(mockLogger.dbError).toHaveBeenCalledWith('authenticate user', error, { email: 'test@example.com' });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.getUserById('user1');

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

      const result = await AuthService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.getUserByEmail('test@example.com');

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

      const result = await AuthService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        id: 'user1',
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user'
      };

      const mockUser = {
        ...userData,
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      // Mock duplicate check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser])
        })
      } as any);

      const result = await AuthService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        id: 'user1',
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'existing', email: 'existing@example.com' }])
          })
        })
      } as any);

      await expect(AuthService.createUser(userData))
        .rejects.toThrow('User with this email already exists');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      // Mock getUserById to return existing user
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.updateUser('user1', updateData);

      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(AuthService.updateUser('nonexistent', { firstName: 'Updated' }))
        .rejects.toThrow('User not found');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 0,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.deactivateUser('user1');

      expect(result).toEqual(mockUser);
      expect(result.isActive).toBe(0);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUser])
          })
        })
      } as any);

      const result = await AuthService.activateUser('user1');

      expect(result).toEqual(mockUser);
      expect(result.isActive).toBe(1);
    });
  });

  describe('validateUserData', () => {
    it('should validate user data successfully', () => {
      const validData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const result = AuthService.validateUserData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for missing email', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const result = AuthService.validateUserData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should return error for invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const result = AuthService.validateUserData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should return error for missing role', () => {
      const invalidData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = AuthService.validateUserData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Role is required');
    });

    it('should return error for invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid_role'
      };

      const result = AuthService.validateUserData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid role. Must be one of: super_admin, admin, manager, user');
    });
  });
}); 