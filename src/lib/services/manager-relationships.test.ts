import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ManagerRelationshipsService } from './manager-relationships';
import { db, managerRelationships, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  managerRelationships: {
    id: 'id',
    managerId: 'managerId',
    employeeId: 'employeeId',
    isActive: 'isActive',
    createdAt: 'createdAt'
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

describe('ManagerRelationshipsService', () => {
  const mockRelationship = {
    id: 1,
    managerId: 'manager123',
    employeeId: 'employee456',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockManager = {
    id: 'manager123',
    email: 'manager@example.com',
    firstName: 'Jane',
    lastName: 'Manager',
    role: 'manager',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockEmployee = {
    id: 'employee456',
    email: 'employee@example.com',
    firstName: 'John',
    lastName: 'Employee',
    role: 'user',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRelationship', () => {
    it('should create relationship successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockRelationship])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await ManagerRelationshipsService.createRelationship({
        managerId: 'manager123',
        employeeId: 'employee456'
      });

      expect(mockDb.insert).toHaveBeenCalledWith(managerRelationships);
      expect(result).toEqual(mockRelationship);
    });

    it('should throw error if relationship already exists', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockRelationship])
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(ManagerRelationshipsService.createRelationship({
        managerId: 'manager123',
        employeeId: 'employee456'
      })).rejects.toThrow('Relationship already exists');
    });
  });

  describe('getRelationshipById', () => {
    it('should return relationship by id', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockRelationship])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await ManagerRelationshipsService.getRelationshipById(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockRelationship);
    });

    it('should return null if relationship not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await ManagerRelationshipsService.getRelationshipById(999);

      expect(result).toBeNull();
    });
  });

  describe('getEmployeesByManager', () => {
    it('should return employees by manager', async () => {
      const mockEmployees = [mockEmployee, { ...mockEmployee, id: 'employee789', email: 'employee2@example.com' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockEmployees)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await ManagerRelationshipsService.getEmployeesByManager('manager123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockEmployees);
    });
  });

  describe('getManagerByEmployee', () => {
    it('should return manager by employee', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockManager])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await ManagerRelationshipsService.getManagerByEmployee('employee456');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockManager);
    });

    it('should return null if no manager found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await ManagerRelationshipsService.getManagerByEmployee('employee999');

      expect(result).toBeNull();
    });
  });

  describe('updateRelationship', () => {
    it('should update relationship successfully', async () => {
      const updatedRelationship = { ...mockRelationship, isActive: 0 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedRelationship])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await ManagerRelationshipsService.updateRelationship(1, { isActive: 0 });

      expect(mockDb.update).toHaveBeenCalledWith(managerRelationships);
      expect(result).toEqual(updatedRelationship);
    });

    it('should throw error if relationship not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      await expect(ManagerRelationshipsService.updateRelationship(999, { isActive: 0 }))
        .rejects.toThrow('Relationship not found');
    });
  });

  describe('deleteRelationship', () => {
    it('should delete relationship successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockRelationship])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await ManagerRelationshipsService.deleteRelationship(1);

      expect(mockDb.delete).toHaveBeenCalledWith(managerRelationships);
    });
  });

  describe('deactivateRelationship', () => {
    it('should deactivate relationship successfully', async () => {
      const deactivatedRelationship = { ...mockRelationship, isActive: 0 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([deactivatedRelationship])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await ManagerRelationshipsService.deactivateRelationship(1);

      expect(mockDb.update).toHaveBeenCalledWith(managerRelationships);
      expect(result).toEqual(deactivatedRelationship);
    });
  });

  describe('activateRelationship', () => {
    it('should activate relationship successfully', async () => {
      const activatedRelationship = { ...mockRelationship, isActive: 1 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([activatedRelationship])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await ManagerRelationshipsService.activateRelationship(1);

      expect(mockDb.update).toHaveBeenCalledWith(managerRelationships);
      expect(result).toEqual(activatedRelationship);
    });
  });

  describe('getActiveRelationships', () => {
    it('should return active relationships', async () => {
      const mockRelationships = [mockRelationship, { ...mockRelationship, id: 2, employeeId: 'employee789' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockRelationships)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await ManagerRelationshipsService.getActiveRelationships();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockRelationships);
    });
  });
}); 