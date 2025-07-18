import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupTestData, createTestUser, createTestAssessmentType, createTestAssessmentPeriod, createTestAssessmentTemplate, createInvitationWithExistingData } from '../test-utils-clean';
import { InvitationsService } from './invitations';
import { db, users, assessmentInstances, managerRelationships, invitations } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { insertTestInvitation } from '../test-utils-clean';

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

  describe('acceptInvitation', () => {
    it('should successfully accept invitation and create user with assessment instance', async () => {
      // Create test data directly
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-success@example.com`,
        role: 'manager' 
      });
      const period = await createTestAssessmentPeriod();
      const type = await createTestAssessmentType();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      // Create invitation directly in database to avoid validation issues
      const invitation = await insertTestInvitation({
        managerId: manager.id,
        templateId: template.id,
        periodId: period.id,
        email: `success-test-${Date.now()}@example.com`,
        firstName: 'Success',
        lastName: 'Test',
        status: 'pending',
        token: 'test-token-' + Date.now(),
        invitedAt: new Date().toISOString(),
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: 0,
        lastReminderSent: null,
      });

      // Verify invitation was created
      const [createdInvitation] = await db.select().from(invitations).where(eq(invitations.id, invitation.id));
      expect(createdInvitation).toBeDefined();
      expect(createdInvitation.id).toBe(invitation.id);

      const userData = {
        email: invitation.email,
        firstName: 'John',
        lastName: 'Doe',
        password: 'securepassword123'
      };

      const result = await InvitationsService.acceptInvitation(invitation.id, userData);

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.assessmentInstanceId).toBeDefined();

      // Verify user was created
      const [createdUser] = await db.select().from(users).where(eq(users.id, result.userId!));
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email.toLowerCase());
      expect(createdUser.firstName).toBe(userData.firstName);
      expect(createdUser.lastName).toBe(userData.lastName);
      expect(createdUser.role).toBe('user');
      expect(createdUser.isActive).toBe(1);

      // Verify assessment instance was created
      const [createdInstance] = await db.select().from(assessmentInstances).where(eq(assessmentInstances.id, result.assessmentInstanceId!));
      expect(createdInstance).toBeDefined();
      expect(createdInstance.userId).toBe(result.userId);
      expect(createdInstance.periodId).toBe(period.id);
      expect(createdInstance.templateId).toBe(template.id);
      expect(createdInstance.status).toBe('pending');

      // Verify manager relationship was created
      const [createdRelationship] = await db.select().from(managerRelationships)
        .where(eq(managerRelationships.subordinateId, result.userId!));
      expect(createdRelationship).toBeDefined();
      expect(createdRelationship.managerId).toBe(manager.id);
      expect(createdRelationship.periodId).toBe(period.id);

      // Verify invitation status was updated
      const [updatedInvitation] = await db.select().from(invitations).where(eq(invitations.id, invitation.id));
      expect(updatedInvitation.status).toBe('accepted');
      expect(updatedInvitation.acceptedAt).toBeDefined();
    });

    it('should return error for non-existent invitation', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'securepassword123'
      };

      const result = await InvitationsService.acceptInvitation(99999, userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation not found');
    });

    it('should return error for already used invitation', async () => {
      // Create test data directly
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-used@example.com`,
        role: 'manager' 
      });
      const period = await createTestAssessmentPeriod();
      const type = await createTestAssessmentType();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      // Create invitation directly in database
      const invitation = await insertTestInvitation({
        managerId: manager.id,
        templateId: template.id,
        periodId: period.id,
        email: `used-test-${Date.now()}@example.com`,
        firstName: 'Used',
        lastName: 'Test',
        status: 'pending',
        token: 'test-token-used-' + Date.now(),
        invitedAt: new Date().toISOString(),
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: 0,
        lastReminderSent: null,
      });

      // First acceptance
      const userData1 = {
        email: invitation.email,
        firstName: 'First',
        lastName: 'User',
        password: 'securepassword123'
      };

      const result1 = await InvitationsService.acceptInvitation(invitation.id, userData1);
      expect(result1.success).toBe(true);

      // Second acceptance should fail
      const userData2 = {
        email: invitation.email,
        firstName: 'Second',
        lastName: 'User',
        password: 'securepassword123'
      };

      const result2 = await InvitationsService.acceptInvitation(invitation.id, userData2);

      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Invitation has already been used or expired');
    });

    it('should return error for email mismatch', async () => {
      // Create test data directly
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-mismatch@example.com`,
        role: 'manager' 
      });
      const period = await createTestAssessmentPeriod();
      const type = await createTestAssessmentType();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      // Create invitation directly in database
      const invitation = await insertTestInvitation({
        managerId: manager.id,
        templateId: template.id,
        periodId: period.id,
        email: `mismatch-test-${Date.now()}@example.com`,
        firstName: 'Mismatch',
        lastName: 'Test',
        status: 'pending',
        token: 'test-token-mismatch-' + Date.now(),
        invitedAt: new Date().toISOString(),
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: 0,
        lastReminderSent: null,
      });

      const userData = {
        email: 'different@example.com', // Different email
        firstName: 'Test',
        lastName: 'User',
        password: 'securepassword123'
      };

      const result = await InvitationsService.acceptInvitation(invitation.id, userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email does not match invitation');
    });

    it('should return error for existing user account', async () => {
      // Create test data directly
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-existing@example.com`,
        role: 'manager' 
      });
      const period = await createTestAssessmentPeriod();
      const type = await createTestAssessmentType();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      // Create invitation directly in database
      const invitation = await insertTestInvitation({
        managerId: manager.id,
        templateId: template.id,
        periodId: period.id,
        email: `existing-test-${Date.now()}@example.com`,
        firstName: 'Existing',
        lastName: 'Test',
        status: 'pending',
        token: 'test-token-existing-' + Date.now(),
        invitedAt: new Date().toISOString(),
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: 0,
        lastReminderSent: null,
      });

      // Create user with same email first
      const existingUser = await createTestUser({
        email: invitation.email,
        role: 'user'
      });

      const userData = {
        email: invitation.email,
        firstName: 'Test',
        lastName: 'User',
        password: 'securepassword123'
      };

      const result = await InvitationsService.acceptInvitation(invitation.id, userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User account already exists with this email');
    });

    it('should handle case-insensitive email matching', async () => {
      // Create test data directly
      const manager = await createTestUser({ 
        email: `manager-${Date.now()}-case@example.com`,
        role: 'manager' 
      });
      const period = await createTestAssessmentPeriod();
      const type = await createTestAssessmentType();
      const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

      // Create invitation directly in database
      const invitation = await insertTestInvitation({
        managerId: manager.id,
        templateId: template.id,
        periodId: period.id,
        email: `case-test-${Date.now()}@example.com`,
        firstName: 'Case',
        lastName: 'Test',
        status: 'pending',
        token: 'test-token-case-' + Date.now(),
        invitedAt: new Date().toISOString(),
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: 0,
        lastReminderSent: null,
      });

      // Try to accept with uppercase email
      const userData = {
        email: invitation.email.toUpperCase(), // Uppercase version
        firstName: 'Test',
        lastName: 'User',
        password: 'securepassword123'
      };

      const result = await InvitationsService.acceptInvitation(invitation.id, userData);

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();

      // Verify user was created with lowercase email
      const [createdUser] = await db.select().from(users).where(eq(users.id, result.userId!));
      expect(createdUser.email).toBe(invitation.email.toLowerCase()); // Should be lowercase
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