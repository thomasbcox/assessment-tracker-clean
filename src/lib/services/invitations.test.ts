import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InvitationsService } from './invitations';
import { db, invitations, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  invitations: {
    id: 'id',
    token: 'token',
    email: 'email',
    managerId: 'managerId',
    assessmentId: 'assessmentId',
    status: 'status',
    expiresAt: 'expiresAt',
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

describe('InvitationsService', () => {
  const mockInvitation = {
    id: 1,
    token: 'invitation-token-123',
    email: 'invitee@example.com',
    managerId: 'manager123',
    assessmentId: 1,
    status: 'pending',
    expiresAt: '2024-12-31T23:59:59Z',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockUser = {
    id: 'user123',
    email: 'invitee@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create invitation successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockInvitation])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await InvitationsService.createInvitation({
        email: 'invitee@example.com',
        managerId: 'manager123',
        assessmentId: 1
      });

      expect(mockDb.insert).toHaveBeenCalledWith(invitations);
      expect(result).toEqual(mockInvitation);
    });

    it('should throw error if invitation already exists', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockInvitation])
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(InvitationsService.createInvitation({
        email: 'invitee@example.com',
        managerId: 'manager123',
        assessmentId: 1
      })).rejects.toThrow('Invitation already exists for this email and assessment');
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation by token', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockInvitation])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.getInvitationByToken('invitation-token-123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockInvitation);
    });

    it('should return null if invitation not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.getInvitationByToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const acceptedInvitation = { ...mockInvitation, status: 'accepted' };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([acceptedInvitation])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await InvitationsService.acceptInvitation('invitation-token-123');

      expect(mockDb.update).toHaveBeenCalledWith(invitations);
      expect(result).toEqual(acceptedInvitation);
    });

    it('should throw error if invitation not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      await expect(InvitationsService.acceptInvitation('invalid-token'))
        .rejects.toThrow('Invitation not found');
    });

    it('should throw error if invitation is expired', async () => {
      const expiredInvitation = { ...mockInvitation, expiresAt: '2020-01-01T00:00:00Z' };
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([expiredInvitation])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(InvitationsService.acceptInvitation('expired-token'))
        .rejects.toThrow('Invitation has expired');
    });
  });

  describe('getInvitationsByManager', () => {
    it('should return invitations by manager', async () => {
      const mockInvitations = [mockInvitation, { ...mockInvitation, id: 2, email: 'user2@example.com' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockInvitations)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.getInvitationsByManager('manager123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('getInvitationsByAssessment', () => {
    it('should return invitations by assessment', async () => {
      const mockInvitations = [mockInvitation, { ...mockInvitation, id: 2, email: 'user2@example.com' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockInvitations)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.getInvitationsByAssessment(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('deleteInvitation', () => {
    it('should delete invitation successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockInvitation])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await InvitationsService.deleteInvitation(1);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
      expect(mockDelete.where).toHaveBeenCalledWith(eq(invitations.id, 1));
    });
  });

  describe('isInvitationValid', () => {
    it('should return true for valid invitation', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockInvitation])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.isInvitationValid('invitation-token-123');

      expect(result).toBe(true);
    });

    it('should return false for invalid invitation', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.isInvitationValid('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false for expired invitation', async () => {
      const expiredInvitation = { ...mockInvitation, expiresAt: '2020-01-01T00:00:00Z' };
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([expiredInvitation])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await InvitationsService.isInvitationValid('expired-token');

      expect(result).toBe(false);
    });
  });
}); 