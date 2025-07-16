import { db, assessmentPeriods } from '@/lib/db';
import { eq, desc, asc, lt, gt, or, and, not } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface AssessmentPeriodData {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: number;
}

export interface AssessmentPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: number;
  createdAt: string;
}

export class AssessmentPeriodsService {
  static async createPeriod(data: AssessmentPeriodData): Promise<AssessmentPeriod> {
    try {
      // Validate required fields
      if (!data.name || !data.startDate || !data.endDate) {
        throw new Error('Name, start date, and end date are required');
      }

      // Check for duplicate name
      const existing = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.name, data.name)).limit(1);
      if (existing.length > 0) throw new Error('Period with this name already exists');

      // Validate date range
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (startDate >= endDate) throw new Error('End date must be after start date');

      // Check for overlapping periods
      const overlapping = await db.select().from(assessmentPeriods)
        .where(
          or(
            and(
              lt(assessmentPeriods.startDate, data.endDate),
              gt(assessmentPeriods.endDate, data.startDate)
            )
          )
        );
      if (overlapping.length > 0) throw new Error('Period overlaps with existing periods');

      // If this period is active, deactivate others
      if (data.isActive === 1) {
        await db.update(assessmentPeriods).set({ isActive: 0 }).where(eq(assessmentPeriods.isActive, 1));
      }

      const [period] = await db.insert(assessmentPeriods).values({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive || 0,
      }).returning();

      return { ...period, createdAt: period.createdAt || '', isActive: period.isActive || 0 };
    } catch (error) {
      logger.dbError('create assessment period', error as Error, data);
      throw error;
    }
  }

  static async getPeriodById(id: number): Promise<AssessmentPeriod | null> {
    try {
      const [period] = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.id, id)).limit(1);
      if (!period) return null;
      return { ...period, createdAt: period.createdAt || '', isActive: period.isActive || 0 };
    } catch (error) {
      logger.dbError('fetch assessment period by id', error as Error, { id });
      throw error;
    }
  }

  static async getAllPeriods(): Promise<AssessmentPeriod[]> {
    try {
      const periods = await db.select().from(assessmentPeriods).orderBy(assessmentPeriods.startDate);
      return periods.map(period => ({ ...period, createdAt: period.createdAt || '', isActive: period.isActive || 0 }));
    } catch (error) {
      logger.dbError('fetch all assessment periods', error as Error);
      throw error;
    }
  }

  static async getActivePeriod(): Promise<AssessmentPeriod | null> {
    try {
      const [period] = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.isActive, 1)).limit(1);
      if (!period) return null;
      return { ...period, createdAt: period.createdAt || '', isActive: period.isActive || 0 };
    } catch (error) {
      logger.dbError('fetch active assessment period', error as Error);
      throw error;
    }
  }

  static async updatePeriod(id: number, data: Partial<AssessmentPeriodData>): Promise<AssessmentPeriod> {
    try {
      const existing = await this.getPeriodById(id);
      if (!existing) throw new Error('Assessment period not found');

      // Validate date range if dates are being updated
      if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (startDate >= endDate) throw new Error('End date must be after start date');
      }

      // Check for overlapping periods if dates are being updated
      if (data.startDate || data.endDate) {
        const startDate = data.startDate || existing.startDate;
        const endDate = data.endDate || existing.endDate;
        const overlapping = await db.select().from(assessmentPeriods)
          .where(
            and(
              or(
                and(
                  lt(assessmentPeriods.startDate, endDate),
                  gt(assessmentPeriods.endDate, startDate)
                )
              ),
              eq(assessmentPeriods.id, id).not()
            )
          );
        if (overlapping.length > 0) throw new Error('Period overlaps with existing periods');
      }

      // If this period is being made active, deactivate others
      if (data.isActive === 1) {
        await db.update(assessmentPeriods).set({ isActive: 0 }).where(eq(assessmentPeriods.isActive, 1));
      }

      const [updated] = await db.update(assessmentPeriods)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.endDate && { endDate: data.endDate }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        })
        .where(eq(assessmentPeriods.id, id))
        .returning();

      if (!updated) throw new Error('Failed to update assessment period');
      return { ...updated, createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update assessment period', error as Error, { id, data });
      throw error;
    }
  }

  static async deletePeriod(id: number): Promise<void> {
    try {
      await db.delete(assessmentPeriods).where(eq(assessmentPeriods.id, id));
    } catch (error) {
      logger.dbError('delete assessment period', error as Error, { id });
      throw error;
    }
  }

  static async setActivePeriod(id: number): Promise<AssessmentPeriod> {
    try {
      // Deactivate all periods
      await db.update(assessmentPeriods).set({ isActive: 0 });
      
      // Activate the specified period
      const [activated] = await db.update(assessmentPeriods)
        .set({ isActive: 1 })
        .where(eq(assessmentPeriods.id, id))
        .returning();

      if (!activated) throw new Error('Assessment period not found');
      return { ...activated, createdAt: activated.createdAt || '' };
    } catch (error) {
      logger.dbError('set active assessment period', error as Error, { id });
      throw error;
    }
  }
} 