import { createTransporter } from '@/lib/mailer';
import { logger } from '@/lib/logger';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MagicLinkEmailData {
  to: string;
  token: string;
  baseUrl?: string;
}

export interface InvitationEmailData {
  to: string;
  invitationToken: string;
  managerName: string;
  assessmentName: string;
  periodName: string;
  baseUrl?: string;
}

export interface ReminderEmailData {
  to: string;
  assessmentName: string;
  dueDate: string;
  baseUrl?: string;
}

export class EmailService {
  static async sendEmail(data: EmailData): Promise<void> {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@assessment-tracker.com',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || this.stripHtml(data.html),
      };

      await transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to: data.to, subject: data.subject });
    } catch (error) {
      logger.error('Failed to send email', { to: data.to, subject: data.subject }, error as Error);
      throw error;
    }
  }

  static async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<void> {
    try {
      const baseUrl = data.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/auth/verify?token=${data.token}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Assessment Tracker - Login Link</h2>
          <p>You requested a login link for the Assessment Tracker system.</p>
          <p>Click the button below to log in:</p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Login to Assessment Tracker
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${loginUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't request this login link, please ignore this email.</p>
        </div>
      `;

      await this.sendEmail({
        to: data.to,
        subject: 'Assessment Tracker - Login Link',
        html,
      });
    } catch (error) {
      logger.error('Failed to send magic link email', { to: data.to }, error as Error);
      throw error;
    }
  }

  static async sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    try {
      const baseUrl = data.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const invitationUrl = `${baseUrl}/invitations/accept?token=${data.invitationToken}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Assessment Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited by <strong>${data.managerName}</strong> to complete an assessment.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Assessment:</strong> ${data.assessmentName}</p>
            <p><strong>Period:</strong> ${data.periodName}</p>
          </div>
          <p>Click the button below to accept the invitation and begin your assessment:</p>
          <a href="${invitationUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Accept Invitation
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          <p><strong>This invitation will expire in 7 days.</strong></p>
        </div>
      `;

      await this.sendEmail({
        to: data.to,
        subject: `Assessment Invitation - ${data.assessmentName}`,
        html,
      });
    } catch (error) {
      logger.error('Failed to send invitation email', { to: data.to }, error as Error);
      throw error;
    }
  }

  static async sendReminderEmail(data: ReminderEmailData): Promise<void> {
    try {
      const baseUrl = data.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const dashboardUrl = `${baseUrl}/dashboard`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Assessment Reminder</h2>
          <p>Hello,</p>
          <p>This is a friendly reminder that you have a pending assessment that needs to be completed.</p>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Assessment:</strong> ${data.assessmentName}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
          </div>
          <p>Please log in to complete your assessment:</p>
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Go to Dashboard
          </a>
          <p>Thank you for your participation!</p>
        </div>
      `;

      await this.sendEmail({
        to: data.to,
        subject: `Assessment Reminder - ${data.assessmentName}`,
        html,
      });
    } catch (error) {
      logger.error('Failed to send reminder email', { to: data.to }, error as Error);
      throw error;
    }
  }

  static async sendCompletionEmail(to: string, assessmentName: string, baseUrl?: string): Promise<void> {
    try {
      const dashboardUrl = `${baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Assessment Completed</h2>
          <p>Hello,</p>
          <p>Thank you for completing your assessment!</p>
          <div style="background-color: #d4edda; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p><strong>Assessment:</strong> ${assessmentName}</p>
            <p><strong>Status:</strong> Completed</p>
          </div>
          <p>You can view your assessment history and results in your dashboard:</p>
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            View Dashboard
          </a>
          <p>Thank you for your participation!</p>
        </div>
      `;

      await this.sendEmail({
        to,
        subject: `Assessment Completed - ${assessmentName}`,
        html,
      });
    } catch (error) {
      logger.error('Failed to send completion email', { to }, error as Error);
      throw error;
    }
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  static async sendBulkEmails(emails: EmailData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        success++;
      } catch (error) {
        failed++;
        logger.error('Failed to send bulk email', { to: email.to }, error as Error);
      }
    }

    logger.info('Bulk email sending completed', { success, failed });
    return { success, failed };
  }

  static async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
} 