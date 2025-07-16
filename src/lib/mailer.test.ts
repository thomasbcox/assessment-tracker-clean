import { sendMail, createTransporter } from './mailer.js';
import nodemailer from 'nodemailer';

// Mock nodemailer at the module boundary
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('Mailer Utility', () => {
  let mockSendMail: jest.MockedFunction<any>;
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail = jest.fn();
    mockTransporter = { sendMail: mockSendMail };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  describe('sendMail', () => {
    it('should send email with correct configuration', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
      const emailOptions = {
        from: 'noreply@example.com',
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };
      await sendMail(emailOptions, mockTransporter);
      expect(mockSendMail).toHaveBeenCalledWith(emailOptions);
    });

    it('should handle email sending errors gracefully', async () => {
      const mockError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(mockError);
      const emailOptions = {
        from: 'noreply@example.com',
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };
      await expect(sendMail(emailOptions, mockTransporter)).rejects.toThrow('SMTP connection failed');
      expect(mockSendMail).toHaveBeenCalledWith(emailOptions);
    });

    it('should support HTML email content', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
      const emailOptions = {
        from: 'noreply@example.com',
        to: 'test@example.com',
        subject: 'Test HTML Email',
        html: '<h1>Test Email</h1><p>This is a test email with HTML</p>',
      };
      await sendMail(emailOptions, mockTransporter);
      expect(mockSendMail).toHaveBeenCalledWith(emailOptions);
    });

    it('should support multiple recipients', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
      const emailOptions = {
        from: 'noreply@example.com',
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Multiple Recipients',
        text: 'This email has multiple recipients',
      };
      await sendMail(emailOptions, mockTransporter);
      expect(mockSendMail).toHaveBeenCalledWith(emailOptions);
    });

    it('should use default transporter when none provided', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
      const emailOptions = {
        from: 'noreply@example.com',
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };
      await sendMail(emailOptions); // no transporter injected
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledWith(emailOptions);
    });
  });

  describe('transporter configuration', () => {
    it('should be configured for Mailtrap', () => {
      createTransporter();
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.mailtrap.io',
        port: 587,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });
    });
  });
}); 