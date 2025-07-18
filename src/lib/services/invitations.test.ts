import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupTestData, createTestUser, createTestAssessmentType, createTestAssessmentPeriod, createTestAssessmentTemplate, createInvitationWithExistingData } from '../test-utils-clean';
import { InvitationsService } from './invitations';

describe('InvitationsService', () => {
  // Temporarily disable cleanup to test with existing data
  // beforeEach(async () => {
  //   await cleanupTestData();
  // });

  // afterEach(async () => {
  //   await cleanupTestData();
  // });

  describe('createInvitation', () => {
    it('should create an invitation with valid data', async () => {
      const { manager, template, period, invitation } = await createInvitationWithExistingData();

      expect(invitation).toBeDefined();
      expect(invitation.managerId).toBe(manager.id);
      expect(invitation.templateId).toBe(template.id);
      expect(invitation.periodId).toBe(period.id);
      expect(invitation.status).toBe('pending');
    });

    it('should throw error for non-existent manager', async () => {
      const type = await createTestAssessmentType();
      const period = await createTestAssessmentPeriod();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      const invitationData = {
        managerId: 'non-existent-manager',
        templateId: template.id,
        periodId: period.id,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      await expect(InvitationsService.createInvitation(invitationData)).rejects.toThrow();
    });

    it('should throw error for non-existent template', async () => {
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}@example.com`,
        role: 'manager' 
      });
      const period = await createTestAssessmentPeriod();

      const invitationData = {
        managerId: manager.id,
        templateId: 999,
        periodId: period.id,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      await expect(InvitationsService.createInvitation(invitationData)).rejects.toThrow();
    });

    it('should throw error for non-existent period', async () => {
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-2@example.com`,
        role: 'manager' 
      });
      const type = await createTestAssessmentType();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      const invitationData = {
        managerId: manager.id,
        templateId: template.id,
        periodId: 999,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      await expect(InvitationsService.createInvitation(invitationData)).rejects.toThrow();
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation by token', async () => {
      const { invitation } = await createInvitationWithExistingData();

      const foundInvitation = await InvitationsService.getInvitationByToken(invitation.token);

      expect(foundInvitation).toBeDefined();
      expect(foundInvitation).not.toBeNull();
      if (foundInvitation) {
        expect(foundInvitation.token).toBe(invitation.token);
      }
    });

    it('should return null for non-existent token', async () => {
      const invitation = await InvitationsService.getInvitationByToken('non-existent-token');
      expect(invitation).toBeNull();
    });
  });

  describe('getInvitationsByManager', () => {
    it('should return invitations for a manager', async () => {
      const { manager, invitation } = await createInvitationWithExistingData();

      const invitations = await InvitationsService.getInvitationsByManager(manager.id);

      expect(invitations.length).toBeGreaterThan(0);
      expect(invitations.some(inv => inv.id === invitation.id)).toBe(true);
      expect(invitations.some(inv => inv.managerId === manager.id)).toBe(true);
    });

    it('should return empty array for manager with no invitations', async () => {
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-3@example.com`,
        role: 'manager' 
      });

      const invitations = await InvitationsService.getInvitationsByManager(manager.id);
      expect(invitations).toHaveLength(0);
    });
  });

  describe('getInvitationsByEmail', () => {
    it('should return invitations by email', async () => {
      const { invitation } = await createInvitationWithExistingData();

      const invitations = await InvitationsService.getInvitationsByEmail(invitation.email);

      expect(invitations).toHaveLength(1);
      expect(invitations[0].email).toBe(invitation.email);
    });

    it('should return empty array for email with no invitations', async () => {
      const invitations = await InvitationsService.getInvitationsByEmail('nonexistent@example.com');
      expect(invitations).toHaveLength(0);
    });
  });

  describe('updateInvitationStatus', () => {
    it('should update an existing invitation status', async () => {
      const { invitation } = await createInvitationWithExistingData();

      const updatedInvitation = await InvitationsService.updateInvitationStatus(invitation.id, 'accepted');

      expect(updatedInvitation).toBeDefined();
      expect(updatedInvitation.status).toBe('accepted');
    });

    it('should throw error for non-existent invitation', async () => {
      await expect(InvitationsService.updateInvitationStatus(999, 'accepted')).rejects.toThrow();
    });
  });

  describe('deleteInvitation', () => {
    it('should delete an existing invitation', async () => {
      const { invitation } = await createInvitationWithExistingData();

      await InvitationsService.deleteInvitation(invitation.id);

      const foundInvitation = await InvitationsService.getInvitationByToken(invitation.token);
      expect(foundInvitation).toBeNull();
    });

    it('should not throw error for non-existent invitation', async () => {
      await expect(InvitationsService.deleteInvitation(999)).resolves.not.toThrow();
    });
  });
}); 