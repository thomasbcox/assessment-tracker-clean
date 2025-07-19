import { db, assessmentInstances, users, assessmentPeriods, assessmentTemplates, assessmentTypes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface AssessmentInstanceData {
  userId: string;
  periodId: number;
  templateId: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'archived';
  completedAt?: string | null;
}

export interface AssessmentInstance {
  id: number;
  userId: string;
  periodId: number;
  templateId: number;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

export interface AssessmentInstanceWithDetails extends AssessmentInstance {
  periodName: string;
  templateName: string;
  templateVersion: string;
  assessmentTypeName: string;
}

export class AssessmentInstancesService {
  static async createInstance(data: AssessmentInstanceData): Promise<AssessmentInstance> {
    try {
      // Validate user, period, and template exist
      const [user] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
      if (!user) throw new Error('User not found');
      const [period] = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.id, data.periodId)).limit(1);
      if (!period) throw new Error('Assessment period not found');
      const [template] = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, data.templateId)).limit(1);
      if (!template) throw new Error('Assessment template not found');

      // Prevent duplicate instance for user/period/template
      const existing = await db.select().from(assessmentInstances)
        .where(and(
          eq(assessmentInstances.userId, data.userId),
          eq(assessmentInstances.periodId, data.periodId),
          eq(assessmentInstances.templateId, data.templateId)
        ))
        .limit(1);
      if (existing.length > 0) throw new Error('Assessment instance already exists');

      const [instance] = await db.insert(assessmentInstances).values({
        userId: data.userId,
        periodId: data.periodId,
        templateId: data.templateId,
        status: data.status || 'pending',
        completedAt: data.completedAt || null,
      }).returning();
      // Ensure status and createdAt are always strings
      return { ...instance, status: instance.status || 'pending', createdAt: instance.createdAt || '' };
    } catch (error) {
      logger.dbError('create assessment instance', error as Error, data);
      throw error;
    }
  }

  static async getInstanceById(id: number): Promise<AssessmentInstance | null> {
    try {
      const [instance] = await db.select().from(assessmentInstances).where(eq(assessmentInstances.id, id)).limit(1);
      if (!instance) return null;
      return { ...instance, status: instance.status || 'pending', createdAt: instance.createdAt || '' };
    } catch (error) {
      logger.dbError('fetch assessment instance by id', error as Error, { id });
      throw error;
    }
  }

  static async getAssessmentInstance(id: number): Promise<AssessmentInstanceWithDetails> {
    try {
      const [instance] = await db
        .select({
          id: assessmentInstances.id,
          userId: assessmentInstances.userId,
          periodId: assessmentInstances.periodId,
          templateId: assessmentInstances.templateId,
          status: assessmentInstances.status,
          startedAt: assessmentInstances.startedAt,
          completedAt: assessmentInstances.completedAt,
          createdAt: assessmentInstances.createdAt,
          periodName: assessmentPeriods.name,
          templateName: assessmentTemplates.name,
          templateVersion: assessmentTemplates.version,
          assessmentTypeName: assessmentTypes.name,
        })
        .from(assessmentInstances)
        .innerJoin(assessmentPeriods, eq(assessmentInstances.periodId, assessmentPeriods.id))
        .innerJoin(assessmentTemplates, eq(assessmentInstances.templateId, assessmentTemplates.id))
        .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
        .where(eq(assessmentInstances.id, id))
        .limit(1);

      if (!instance) throw new Error('Assessment instance not found');
      
      return {
        ...instance,
        status: instance.status || 'pending',
        createdAt: instance.createdAt || '',
      };
    } catch (error) {
      logger.dbError('fetch assessment instance with details', error as Error, { id });
      throw error;
    }
  }

  static async updateAssessmentInstance(id: number, data: Partial<AssessmentInstanceData>): Promise<AssessmentInstance> {
    try {
      const updateData: any = {};
      
      if (data.status !== undefined) {
        updateData.status = data.status;
      }
      if (data.completedAt !== undefined) {
        updateData.completedAt = data.completedAt;
      }
      if (data.status === 'in_progress' && !data.completedAt) {
        updateData.startedAt = new Date().toISOString();
      }
      if (data.status === 'completed' && !data.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }

      const [updated] = await db.update(assessmentInstances)
        .set(updateData)
        .where(eq(assessmentInstances.id, id))
        .returning();
        
      if (!updated) throw new Error('Assessment instance not found');
      
      return { ...updated, status: updated.status || 'pending', createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update assessment instance', error as Error, { id, data });
      throw error;
    }
  }

  static async getInstancesByUser(userId: string): Promise<AssessmentInstance[]> {
    try {
      const results = await db.select().from(assessmentInstances).where(eq(assessmentInstances.userId, userId));
      return results.map(instance => ({ ...instance, status: instance.status || 'pending', createdAt: instance.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch assessment instances by user', error as Error, { userId });
      throw error;
    }
  }

  static async updateInstanceStatus(id: number, status: 'pending' | 'in_progress' | 'completed' | 'archived', completedAt?: string): Promise<AssessmentInstance> {
    try {
      const [updated] = await db.update(assessmentInstances)
        .set({ status, completedAt: completedAt || null })
        .where(eq(assessmentInstances.id, id))
        .returning();
      if (!updated) throw new Error('Assessment instance not found');
      return { ...updated, status: updated.status || 'pending', createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update assessment instance status', error as Error, { id, status });
      throw error;
    }
  }

  static async deleteInstance(id: number): Promise<void> {
    try {
      await db.delete(assessmentInstances).where(eq(assessmentInstances.id, id));
    } catch (error) {
      logger.dbError('delete assessment instance', error as Error, { id });
      throw error;
    }
  }

  static async getInstancesByPeriod(periodId: number): Promise<AssessmentInstance[]> {
    try {
      const results = await db.select().from(assessmentInstances).where(eq(assessmentInstances.periodId, periodId));
      return results.map(instance => ({ ...instance, status: instance.status || 'pending', createdAt: instance.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch assessment instances by period', error as Error, { periodId });
      throw error;
    }
  }

  static async getInstancesByTemplate(templateId: number): Promise<AssessmentInstance[]> {
    try {
      const results = await db.select().from(assessmentInstances).where(eq(assessmentInstances.templateId, templateId));
      return results.map(instance => ({ ...instance, status: instance.status || 'pending', createdAt: instance.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch assessment instances by template', error as Error, { templateId });
      throw error;
    }
  }
} 

// Export individual functions for API endpoints
export const createInstance = AssessmentInstancesService.createInstance;
export const getInstanceById = AssessmentInstancesService.getInstanceById;
export const getAssessmentInstance = AssessmentInstancesService.getAssessmentInstance;
export const updateAssessmentInstance = AssessmentInstancesService.updateAssessmentInstance;
export const getInstancesByUser = AssessmentInstancesService.getInstancesByUser;
export const getInstancesByPeriod = AssessmentInstancesService.getInstancesByPeriod;
export const getInstancesByTemplate = AssessmentInstancesService.getInstancesByTemplate;
export const updateInstanceStatus = AssessmentInstancesService.updateInstanceStatus;
export const deleteInstance = AssessmentInstancesService.deleteInstance; 