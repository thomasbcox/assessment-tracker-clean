import { db, invitations, users, assessmentInstances, managerRelationships, assessmentTemplates, assessmentPeriods } from '@/lib/db';
import { eq, and, lt } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export interface InvitationData {
  managerId: string;
  templateId: number;
  periodId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  invitedRole: string;
  dueDate?: string;
}

export interface Invitation {
  id: number;
  managerId: string;
  templateId: number;
  periodId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  token: string;
  invitedAt: string;
  acceptedAt: string | null;
  expiresAt: string;
  reminderCount: number;
  lastReminderSent: string | null;
  invitedRole: string;
  dueDate: string | null;
}

export class InvitationsService {
  static async createInvitation(data: InvitationData): Promise<Invitation> {
    try {
      // Validate required fields
      if (!data.managerId || !data.templateId || !data.periodId || !data.email) {
        throw new Error('Manager ID, template ID, period ID, and email are required');
      }

      // Validate manager exists
      const [manager] = await db.select().from(users).where(eq(users.id, data.managerId)).limit(1);
      if (!manager) throw new Error('Manager not found');

      // Validate template exists
      const [template] = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, data.templateId)).limit(1);
      if (!template) throw new Error('Assessment template not found');

      // Validate period exists
      const [period] = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.id, data.periodId)).limit(1);
      if (!period) throw new Error('Assessment period not found');

      // Check for existing invitation for same manager/template/period/email
      const existing = await db.select().from(invitations)
        .where(and(
          eq(invitations.managerId, data.managerId),
          eq(invitations.templateId, data.templateId),
          eq(invitations.periodId, data.periodId),
          eq(invitations.email, data.email)
        ))
        .limit(1);
      if (existing.length > 0) throw new Error('Invitation already exists for this combination');

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const [invitation] = await db.insert(invitations).values({
        managerId: data.managerId,
        templateId: data.templateId,
        periodId: data.periodId,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        status: 'pending',
        token,
        invitedAt: new Date().toISOString(),
        acceptedAt: null,
        expiresAt,
        reminderCount: 0,
        lastReminderSent: null,
        invitedRole: data.invitedRole,
        dueDate: data.dueDate || null,
      }).returning();

      const { reminderCount, ...rest } = invitation;
      return { ...rest, invitedAt: invitation.invitedAt || '', status: invitation.status || 'pending', reminderCount: Number(reminderCount ?? 0) };
    } catch (error) {
      logger.dbError('create invitation', error as Error, data);
      throw error;
    }
  }

  static async getInvitationById(id: number): Promise<Invitation | null> {
    try {
      const [invitation] = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
      if (!invitation) return null;
      const { reminderCount: rc1, ...rest1 } = invitation;
      return { ...rest1, invitedAt: invitation.invitedAt || '', status: invitation.status || 'pending', reminderCount: Number(rc1 ?? 0) };
    } catch (error) {
      logger.dbError('fetch invitation by id', error as Error, { id });
      throw error;
    }
  }

  static async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
      if (!invitation) return null;
      const { reminderCount: rc2, ...rest2 } = invitation;
      return { ...rest2, invitedAt: invitation.invitedAt || '', status: invitation.status || 'pending', reminderCount: Number(rc2 ?? 0) };
    } catch (error) {
      logger.dbError('fetch invitation by token', error as Error, { token });
      throw error;
    }
  }

  static async getInvitationsByManager(managerId: string): Promise<Invitation[]> {
    try {
      const invitationRows = await db.select().from(invitations)
        .where(eq(invitations.managerId, managerId))
        .orderBy(invitations.invitedAt);
      return invitationRows.map((invitation: any) => {
        const { reminderCount, ...rest } = invitation;
        return { ...rest, invitedAt: invitation.invitedAt || '', status: invitation.status || 'pending', reminderCount: Number(reminderCount ?? 0) };
      });
    } catch (error) {
      logger.dbError('fetch invitations by manager', error as Error, { managerId });
      throw error;
    }
  }

  static async getInvitationsByEmail(email: string): Promise<Invitation[]> {
    try {
      const invitationRows = await db.select().from(invitations)
        .where(eq(invitations.email, email))
        .orderBy(invitations.invitedAt);
      return invitationRows.map((invitation: any) => {
        const { reminderCount, ...rest } = invitation;
        return { ...rest, invitedAt: invitation.invitedAt || '', status: invitation.status || 'pending', reminderCount: Number(reminderCount ?? 0) };
      });
    } catch (error) {
      logger.dbError('fetch invitations by email', error as Error, { email });
      throw error;
    }
  }

  static async acceptInvitation(invitationId: number, userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<{ success: boolean; userId?: string; assessmentInstanceId?: number; error?: string }> {
    try {
      const result = await db.transaction(async (tx) => {
        // Get invitation
        const invitationArr = await tx
          .select()
          .from(invitations)
          .where(eq(invitations.id, invitationId))
          .limit(1);
        if (!invitationArr || invitationArr.length === 0) {
          throw new Error('Invitation not found');
        }
        const inv = invitationArr[0];
        if (inv.status !== 'pending') {
          throw new Error('Invitation has already been used or expired');
        }
        if (inv.email.toLowerCase() !== userData.email.toLowerCase()) {
          throw new Error('Email does not match invitation');
        }
        // Check if user already exists
        const existingUser = await tx
          .select()
          .from(users)
          .where(eq(users.email, userData.email.toLowerCase()))
          .limit(1);
        if (existingUser.length > 0) {
          throw new Error('User account already exists with this email');
        }
        // Create user account
        const userId = crypto.randomUUID();
        const [newUser] = await tx
          .insert(users)
          .values({
            id: userId,
            email: userData.email.toLowerCase(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: inv.invitedRole || 'user',
            isActive: 1,
            createdAt: new Date().toISOString(),
          })
          .returning();
        // Create assessment instance if template is specified
        let assessmentInstanceId: number | undefined;
        if (inv.templateId) {
          const [assessmentInstance] = await tx
            .insert(assessmentInstances)
            .values({
              userId: userId,
              periodId: inv.periodId,
              templateId: inv.templateId,
              status: 'pending',
              dueDate: inv.dueDate || null,
              createdAt: new Date().toISOString(),
            })
            .returning();
          assessmentInstanceId = assessmentInstance.id;
        }
        // Create manager relationship
        if (inv.managerId) {
          await tx
            .insert(managerRelationships)
            .values({
              managerId: inv.managerId,
              subordinateId: userId,
              periodId: inv.periodId,
              createdAt: new Date().toISOString(),
            });
        }
        // Update invitation status
        await tx
          .update(invitations)
          .set({
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
          })
          .where(eq(invitations.id, invitationId));
        return {
          success: true,
          userId,
          assessmentInstanceId,
        };
      });
      return result;
    } catch (error) {
      logger.error('Error accepting invitation', { error, invitationId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async declineInvitation(token: string): Promise<Invitation> {
    try {
      const invitation = await this.getInvitationByToken(token);
      if (!invitation) throw new Error('Invitation not found');

      if (invitation.status !== 'pending') {
        throw new Error('Invitation has already been processed');
      }

      const [declined] = await db.update(invitations)
        .set({ status: 'declined' })
        .where(eq(invitations.token, token))
        .returning();

      if (!declined) throw new Error('Failed to decline invitation');
      const { reminderCount: rc4, ...rest4 } = declined;
      return { ...rest4, invitedAt: declined.invitedAt || '', status: declined.status || 'pending', reminderCount: Number(rc4 ?? 0) };
    } catch (error) {
      logger.dbError('decline invitation', error as Error, { token });
      throw error;
    }
  }

  static async updateInvitationStatus(id: number, status: 'pending' | 'accepted' | 'declined' | 'expired'): Promise<Invitation> {
    try {
      const [updated] = await db.update(invitations)
        .set({ status })
        .where(eq(invitations.id, id))
        .returning();

      if (!updated) throw new Error('Invitation not found');
      const { reminderCount: rc5, ...rest5 } = updated;
      return { ...rest5, invitedAt: updated.invitedAt || '', status: updated.status || 'pending', reminderCount: Number(rc5 ?? 0) };
    } catch (error) {
      logger.dbError('update invitation status', error as Error, { id, status });
      throw error;
    }
  }

  static async sendReminder(id: number): Promise<Invitation> {
    try {
      const invitation = await this.getInvitationById(id);
      if (!invitation) throw new Error('Invitation not found');

      if (invitation.status !== 'pending') {
        throw new Error('Cannot send reminder for non-pending invitation');
      }

      const [updated] = await db.update(invitations)
        .set({
          reminderCount: invitation.reminderCount + 1,
          lastReminderSent: new Date().toISOString(),
        })
        .where(eq(invitations.id, id))
        .returning();

      if (!updated) throw new Error('Failed to update invitation reminder');
      const { reminderCount: rc6, ...rest6 } = updated;
      return { ...rest6, invitedAt: updated.invitedAt || '', status: updated.status || 'pending', reminderCount: Number(rc6 ?? 0) };
    } catch (error) {
      logger.dbError('send invitation reminder', error as Error, { id });
      throw error;
    }
  }

  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      await db.update(invitations)
        .set({ status: 'expired' })
        .where(and(
          eq(invitations.status, 'pending'),
          lt(invitations.expiresAt, new Date().toISOString())
        ));
    } catch (error) {
      logger.dbError('cleanup expired invitations', error as Error);
      throw error;
    }
  }

  static async deleteInvitation(id: number): Promise<void> {
    try {
      await db.delete(invitations).where(eq(invitations.id, id));
    } catch (error) {
      logger.dbError('delete invitation', error as Error, { id });
      throw error;
    }
  }
} 