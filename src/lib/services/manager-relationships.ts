import { db, managerRelationships, users, assessmentPeriods } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface ManagerRelationshipData {
  managerId: string;
  subordinateId: string;
  periodId: number;
}

export interface ManagerRelationship {
  id: number;
  managerId: string;
  subordinateId: string;
  periodId: number;
  createdAt: string;
}

export class ManagerRelationshipsService {
  static async createRelationship(data: ManagerRelationshipData): Promise<ManagerRelationship> {
    try {
      // Validate required fields
      if (!data.managerId || !data.subordinateId || !data.periodId) {
        throw new Error('Manager ID, subordinate ID, and period ID are required');
      }

      // Validate manager exists
      const [manager] = await db.select().from(users).where(eq(users.id, data.managerId)).limit(1);
      if (!manager) throw new Error('Manager not found');

      // Validate subordinate exists
      const [subordinate] = await db.select().from(users).where(eq(users.id, data.subordinateId)).limit(1);
      if (!subordinate) throw new Error('Subordinate not found');

      // Validate period exists
      const [period] = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.id, data.periodId)).limit(1);
      if (!period) throw new Error('Assessment period not found');

      // Prevent self-relationship
      if (data.managerId === data.subordinateId) {
        throw new Error('Manager cannot be their own subordinate');
      }

      // Check for existing relationship for this period
      const existing = await db.select().from(managerRelationships)
        .where(and(
          eq(managerRelationships.subordinateId, data.subordinateId),
          eq(managerRelationships.periodId, data.periodId)
        ))
        .limit(1);
      if (existing.length > 0) throw new Error('Subordinate already has a manager for this period');

      const [relationship] = await db.insert(managerRelationships).values({
        managerId: data.managerId,
        subordinateId: data.subordinateId,
        periodId: data.periodId,
      }).returning();

      return { ...relationship, createdAt: relationship.createdAt || '' };
    } catch (error) {
      logger.dbError('create manager relationship', error as Error, data);
      throw error;
    }
  }

  static async getRelationshipById(id: number): Promise<ManagerRelationship | null> {
    try {
      const [relationship] = await db.select().from(managerRelationships).where(eq(managerRelationships.id, id)).limit(1);
      if (!relationship) return null;
      return { ...relationship, createdAt: relationship.createdAt || '' };
    } catch (error) {
      logger.dbError('fetch manager relationship by id', error as Error, { id });
      throw error;
    }
  }

  static async getSubordinatesByManager(managerId: string, periodId?: number): Promise<ManagerRelationship[]> {
    try {
      let query = db.select().from(managerRelationships).where(eq(managerRelationships.managerId, managerId));
      
      if (periodId) {
        query = query.where(and(
          eq(managerRelationships.managerId, managerId),
          eq(managerRelationships.periodId, periodId)
        ));
      }

      const relationships = await query.orderBy(managerRelationships.createdAt);
      return relationships.map(relationship => ({ ...relationship, createdAt: relationship.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch subordinates by manager', error as Error, { managerId, periodId });
      throw error;
    }
  }

  static async getManagerBySubordinate(subordinateId: string, periodId?: number): Promise<ManagerRelationship | null> {
    try {
      let query = db.select().from(managerRelationships).where(eq(managerRelationships.subordinateId, subordinateId));
      
      if (periodId) {
        query = query.where(and(
          eq(managerRelationships.subordinateId, subordinateId),
          eq(managerRelationships.periodId, periodId)
        ));
      }

      const [relationship] = await query.limit(1);
      if (!relationship) return null;
      return { ...relationship, createdAt: relationship.createdAt || '' };
    } catch (error) {
      logger.dbError('fetch manager by subordinate', error as Error, { subordinateId, periodId });
      throw error;
    }
  }

  static async getRelationshipsByPeriod(periodId: number): Promise<ManagerRelationship[]> {
    try {
      const relationships = await db.select().from(managerRelationships)
        .where(eq(managerRelationships.periodId, periodId))
        .orderBy(managerRelationships.createdAt);
      
      return relationships.map(relationship => ({ ...relationship, createdAt: relationship.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch relationships by period', error as Error, { periodId });
      throw error;
    }
  }

  static async updateRelationship(id: number, data: Partial<ManagerRelationshipData>): Promise<ManagerRelationship> {
    try {
      const existing = await this.getRelationshipById(id);
      if (!existing) throw new Error('Manager relationship not found');

      // Validate new manager if being updated
      if (data.managerId) {
        const [manager] = await db.select().from(users).where(eq(users.id, data.managerId)).limit(1);
        if (!manager) throw new Error('New manager not found');
      }

      // Validate new subordinate if being updated
      if (data.subordinateId) {
        const [subordinate] = await db.select().from(users).where(eq(users.id, data.subordinateId)).limit(1);
        if (!subordinate) throw new Error('New subordinate not found');
      }

      // Validate new period if being updated
      if (data.periodId) {
        const [period] = await db.select().from(assessmentPeriods).where(eq(assessmentPeriods.id, data.periodId)).limit(1);
        if (!period) throw new Error('New assessment period not found');
      }

      // Check for conflicts if subordinate or period is being updated
      if (data.subordinateId || data.periodId) {
        const newSubordinateId = data.subordinateId || existing.subordinateId;
        const newPeriodId = data.periodId || existing.periodId;
        
        const conflict = await db.select().from(managerRelationships)
          .where(and(
            eq(managerRelationships.subordinateId, newSubordinateId),
            eq(managerRelationships.periodId, newPeriodId),
            eq(managerRelationships.id, id).not()
          ))
          .limit(1);
        if (conflict.length > 0) throw new Error('Subordinate already has a manager for this period');
      }

      const [updated] = await db.update(managerRelationships)
        .set({
          ...(data.managerId && { managerId: data.managerId }),
          ...(data.subordinateId && { subordinateId: data.subordinateId }),
          ...(data.periodId && { periodId: data.periodId }),
        })
        .where(eq(managerRelationships.id, id))
        .returning();

      if (!updated) throw new Error('Failed to update manager relationship');
      return { ...updated, createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update manager relationship', error as Error, { id, data });
      throw error;
    }
  }

  static async deleteRelationship(id: number): Promise<void> {
    try {
      await db.delete(managerRelationships).where(eq(managerRelationships.id, id));
    } catch (error) {
      logger.dbError('delete manager relationship', error as Error, { id });
      throw error;
    }
  }

  static async deleteRelationshipsByPeriod(periodId: number): Promise<void> {
    try {
      await db.delete(managerRelationships).where(eq(managerRelationships.periodId, periodId));
    } catch (error) {
      logger.dbError('delete relationships by period', error as Error, { periodId });
      throw error;
    }
  }

  static async getRelationshipHierarchy(managerId: string, periodId: number): Promise<{
    manager: ManagerRelationship | null;
    subordinates: ManagerRelationship[];
  }> {
    try {
      // Get manager's manager
      const manager = await this.getManagerBySubordinate(managerId, periodId);
      
      // Get manager's subordinates
      const subordinates = await this.getSubordinatesByManager(managerId, periodId);

      return { manager, subordinates };
    } catch (error) {
      logger.dbError('get relationship hierarchy', error as Error, { managerId, periodId });
      throw error;
    }
  }
} 