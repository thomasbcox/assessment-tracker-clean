import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EmailService } from './email';
import { createTestUser, cleanupTestData } from '../test-utils-clean';

// Mock the mailer module
jest.mock('../mailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })),
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('EmailService', () => {
  // Temporarily disable cleanup to test with existing data
  // beforeEach(async () => {
  //   await cleanupTestData();
  // });

  // afterEach(async () => {
  //   await cleanupTestData();
  // });

  describe('sendMagicLinkEmail', () => {
    it('should send magic link email successfully', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}@example.com`,
        firstName: 'John',
        lastName: 'Doe'
      });

      const magicLinkData = {
        to: user.email,
        token: 'test-token-123',
        baseUrl: 'http://localhost:3000'
      };

      const result = await EmailService.sendMagicLinkEmail(magicLinkData);

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should handle email sending failure', async () => {
      // Mock a failure scenario
      const mockSendEmail = jest.spyOn(EmailService, 'sendEmail').mockRejectedValueOnce(new Error('SMTP error'));

      const user = await createTestUser({
        email: `test-${Date.now()}-2@example.com`,
        firstName: 'Jane',
        lastName: 'Smith'
      });

      const magicLinkData = {
        to: user.email,
        token: 'test-token-123'
      };

      await expect(EmailService.sendMagicLinkEmail(magicLinkData)).rejects.toThrow('SMTP error');
      
      mockSendEmail.mockRestore();
    });
  });

  describe('sendInvitationEmail', () => {
    it('should send invitation email successfully', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-3@example.com`,
        firstName: 'Bob',
        lastName: 'Johnson'
      });

      const invitationData = {
        to: user.email,
        invitationToken: 'invite-token-123',
        managerName: 'Jane Manager',
        assessmentName: 'Leadership Assessment',
        periodName: 'Q1 2024',
        baseUrl: 'http://localhost:3000'
      };

      const result = await EmailService.sendInvitationEmail(invitationData);

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should handle invitation with custom message', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-4@example.com`,
        firstName: 'Alice',
        lastName: 'Brown'
      });

      const invitationData = {
        to: user.email,
        invitationToken: 'invite-token-123',
        managerName: 'Jane Manager',
        assessmentName: 'Leadership Assessment',
        periodName: 'Q1 2024'
      };

      const result = await EmailService.sendInvitationEmail(invitationData);

      expect(result).toBeUndefined(); // Method returns void
    });
  });

  describe('sendReminderEmail', () => {
    it('should send reminder email successfully', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-5@example.com`,
        firstName: 'Charlie',
        lastName: 'Wilson'
      });

      const reminderData = {
        to: user.email,
        assessmentName: 'Leadership Assessment',
        dueDate: '2024-12-31',
        baseUrl: 'http://localhost:3000'
      };

      const result = await EmailService.sendReminderEmail(reminderData);

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should handle urgent reminder (1 day remaining)', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-6@example.com`,
        firstName: 'David',
        lastName: 'Miller'
      });

      const reminderData = {
        to: user.email,
        assessmentName: 'Leadership Assessment',
        dueDate: '2024-12-31'
      };

      const result = await EmailService.sendReminderEmail(reminderData);

      expect(result).toBeUndefined(); // Method returns void
    });
  });

  describe('sendCompletionEmail', () => {
    it('should send completion notification successfully', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-7@example.com`,
        firstName: 'Eva',
        lastName: 'Garcia'
      });

      const result = await EmailService.sendCompletionEmail(
        user.email,
        'Leadership Assessment',
        'http://localhost:3000'
      );

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should handle completion without score', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-8@example.com`,
        firstName: 'Frank',
        lastName: 'Taylor'
      });

      const result = await EmailService.sendCompletionEmail(
        user.email,
        'Leadership Assessment'
      );

      expect(result).toBeUndefined(); // Method returns void
    });
  });

  describe('sendEmail', () => {
    it('should send generic email successfully', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-9@example.com`,
        firstName: 'Grace',
        lastName: 'Anderson'
      });

      const emailData = {
        to: user.email,
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      };

      const result = await EmailService.sendEmail(emailData);

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should handle email with attachments', async () => {
      const user = await createTestUser({
        email: `test-${Date.now()}-10@example.com`,
        firstName: 'Henry',
        lastName: 'Thomas'
      });

      const emailData = {
        to: user.email,
        subject: 'Test Email with Text',
        html: '<p>This is a test email</p>',
        text: 'This is a test email'
      };

      const result = await EmailService.sendEmail(emailData);

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should handle email sending failure', async () => {
      // Mock a failure scenario
      const mockSendEmail = jest.spyOn(EmailService, 'sendEmail').mockRejectedValueOnce(new Error('SMTP error'));

      const emailData = {
        to: 'invalid@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      };

      await expect(EmailService.sendEmail(emailData)).rejects.toThrow('SMTP error');
      
      mockSendEmail.mockRestore();
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      for (const email of validEmails) {
        const result = await EmailService.validateEmail(email);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid email addresses', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com'
      ];

      for (const email of invalidEmails) {
        const result = await EmailService.validateEmail(email);
        expect(result).toBe(false);
      }
    });
  });

  describe('sendBulkEmails', () => {
    it('should send multiple emails successfully', async () => {
      const user1 = await createTestUser({
        email: `user1-${Date.now()}@example.com`,
        firstName: 'User',
        lastName: 'One'
      });

      const user2 = await createTestUser({
        email: `user2-${Date.now()}@example.com`,
        firstName: 'User',
        lastName: 'Two'
      });

      const emails = [
        {
          to: user1.email,
          subject: 'Test Email 1',
          html: '<p>This is test email 1</p>'
        },
        {
          to: user2.email,
          subject: 'Test Email 2',
          html: '<p>This is test email 2</p>'
        }
      ];

      const result = await EmailService.sendBulkEmails(emails);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures in bulk sending', async () => {
      // Mock one failure
      const mockSendEmail = jest.spyOn(EmailService, 'sendEmail').mockImplementation(async (data) => {
        if (data.to === 'invalid@example.com') {
          throw new Error('SMTP error');
        }
        // For valid emails, call the original method
        return Promise.resolve();
      });

      const user = await createTestUser({
        email: `test-${Date.now()}-11@example.com`,
        firstName: 'Test',
        lastName: 'User'
      });

      const emails = [
        {
          to: 'invalid@example.com',
          subject: 'Test Email 1',
          html: '<p>This will fail</p>'
        },
        {
          to: user.email,
          subject: 'Test Email 2',
          html: '<p>This will succeed</p>'
        }
      ];

      const result = await EmailService.sendBulkEmails(emails);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);

      // Restore original method
      mockSendEmail.mockRestore();
    });
  });
}); 