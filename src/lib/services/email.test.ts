import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EmailService } from './email';

// Mock the mailer
jest.mock('../mailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn()
  })
}));

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('EmailService', () => {
  const mockTransporter = {
    sendMail: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { createTransporter } = require('../mailer');
    createTransporter.mockReturnValue(mockTransporter);
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
        text: 'This is a test email'
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id'
      });

      await EmailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });
    });

    it('should generate text from html when text is not provided', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id'
      });

      await EmailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: 'This is a test email'
      });
    });

    it('should handle email sending failure', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      };

      const error = new Error('SMTP error');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(EmailService.sendEmail(emailData)).rejects.toThrow('SMTP error');
    });
  });

  describe('sendMagicLinkEmail', () => {
    it('should send magic link email successfully', async () => {
      const magicLinkData = {
        to: 'test@example.com',
        token: 'magic-token-123',
        baseUrl: 'http://localhost:3000'
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'magic-link-message-id'
      });

      await EmailService.sendMagicLinkEmail(magicLinkData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: magicLinkData.to,
        subject: 'Assessment Tracker - Login Link',
        html: expect.stringContaining('Login to Assessment Tracker'),
        text: expect.stringContaining('Login to Assessment Tracker')
      });
    });
  });

  describe('sendInvitationEmail', () => {
    it('should send invitation email successfully', async () => {
      const invitationData = {
        to: 'test@example.com',
        invitationToken: 'invitation-token-123',
        managerName: 'John Manager',
        assessmentName: 'Leadership Assessment',
        periodName: 'Q1 2024',
        baseUrl: 'http://localhost:3000'
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'invitation-message-id'
      });

      await EmailService.sendInvitationEmail(invitationData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: invitationData.to,
        subject: 'Assessment Invitation - Leadership Assessment',
        html: expect.stringContaining('Accept Invitation'),
        text: expect.stringContaining('Accept Invitation')
      });
    });
  });

  describe('sendReminderEmail', () => {
    it('should send reminder email successfully', async () => {
      const reminderData = {
        to: 'test@example.com',
        assessmentName: 'Leadership Assessment',
        dueDate: '2024-12-31',
        baseUrl: 'http://localhost:3000'
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'reminder-message-id'
      });

      await EmailService.sendReminderEmail(reminderData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: reminderData.to,
        subject: 'Assessment Reminder - Leadership Assessment',
        html: expect.stringContaining('Go to Dashboard'),
        text: expect.stringContaining('Go to Dashboard')
      });
    });
  });

  describe('sendCompletionEmail', () => {
    it('should send completion email successfully', async () => {
      const to = 'test@example.com';
      const assessmentName = 'Leadership Assessment';
      const baseUrl = 'http://localhost:3000';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'completion-message-id'
      });

      await EmailService.sendCompletionEmail(to, assessmentName, baseUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to,
        subject: 'Assessment Completed - Leadership Assessment',
        html: expect.stringContaining('View Dashboard'),
        text: expect.stringContaining('View Dashboard')
      });
    });
  });

  describe('sendBulkEmails', () => {
    it('should send bulk emails successfully', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Email 1',
          html: '<p>Email 1</p>'
        },
        {
          to: 'user2@example.com',
          subject: 'Email 2',
          html: '<p>Email 2</p>'
        }
      ];

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'bulk-message-id'
      });

      const result = await EmailService.sendBulkEmails(emails);

      expect(result).toEqual({ success: 2, failed: 0 });
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk emails', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Email 1',
          html: '<p>Email 1</p>'
        },
        {
          to: 'user2@example.com',
          subject: 'Email 2',
          html: '<p>Email 2</p>'
        }
      ];

      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'success-message-id' })
        .mockRejectedValueOnce(new Error('SMTP error'));

      const result = await EmailService.sendBulkEmails(emails);

      expect(result).toEqual({ success: 1, failed: 1 });
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email addresses', async () => {
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
        'user@.com',
        ''
      ];

      for (const email of invalidEmails) {
        const result = await EmailService.validateEmail(email);
        expect(result).toBe(false);
      }
    });
  });
}); 