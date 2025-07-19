import { db, assessmentTemplates, assessmentTypes } from '@/lib/db';
import { eq, ne } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface CreateTemplateData {
  assessmentTypeId: string;
  name: string;
  version: string;
  description?: string;
}

export interface TemplateWithTypeName {
  id: number;
  assessmentTypeId: number;
  assessmentTypeName: string;
  name: string;
  version: string;
  description: string | null;
  isActive: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export class AssessmentTemplatesService {
  static async getAllTemplates(): Promise<TemplateWithTypeName[]> {
    try {
      const templates = await db
        .select({
          id: assessmentTemplates.id,
          assessmentTypeId: assessmentTemplates.assessmentTypeId,
          name: assessmentTemplates.name,
          version: assessmentTemplates.version,
          description: assessmentTemplates.description,
          isActive: assessmentTemplates.isActive,
          createdAt: assessmentTemplates.createdAt,
          updatedAt: assessmentTemplates.updatedAt,
          assessmentTypeName: assessmentTypes.name,
        })
        .from(assessmentTemplates)
        .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
        .where(eq(assessmentTemplates.isActive, 1));

      return templates;
    } catch (error) {
      logger.dbError('fetch assessment templates', error as Error);
      throw new Error('Failed to fetch assessment templates');
    }
  }

  static async getTemplateById(id: string): Promise<TemplateWithTypeName | null> {
    try {
      const [template] = await db
        .select({
          id: assessmentTemplates.id,
          assessmentTypeId: assessmentTemplates.assessmentTypeId,
          name: assessmentTemplates.name,
          version: assessmentTemplates.version,
          description: assessmentTemplates.description,
          isActive: assessmentTemplates.isActive,
          createdAt: assessmentTemplates.createdAt,
          updatedAt: assessmentTemplates.updatedAt,
          assessmentTypeName: assessmentTypes.name,
        })
        .from(assessmentTemplates)
        .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
        .where(eq(assessmentTemplates.id, parseInt(id)))
        .limit(1);

      return template || null;
    } catch (error) {
      logger.dbError('fetch assessment template by id', error as Error, { templateId: id });
      throw new Error('Failed to fetch assessment template');
    }
  }

  static async updateTemplate(id: string, data: Partial<CreateTemplateData>): Promise<TemplateWithTypeName> {
    try {
      // Check if template exists
      const existingTemplate = await this.getTemplateById(id);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // Validate assessment type if provided
      if (data.assessmentTypeId) {
        const assessmentType = await db
          .select()
          .from(assessmentTypes)
          .where(eq(assessmentTypes.id, parseInt(data.assessmentTypeId)))
          .limit(1);

        if (assessmentType.length === 0) {
          throw new Error('Invalid assessment type ID');
        }
      }

      // Check for duplicate name-version combination if name or version is being updated
      if (data.name || data.version) {
        const newName = data.name || existingTemplate.name;
        const newVersion = data.version || existingTemplate.version;
        
        const duplicateTemplate = await db
          .select()
          .from(assessmentTemplates)
          .where(
            eq(assessmentTemplates.name, newName) && 
            eq(assessmentTemplates.version, newVersion) &&
            ne(assessmentTemplates.id, parseInt(id))
          )
          .limit(1);

        if (duplicateTemplate.length > 0) {
          throw new Error('Template with this name and version already exists');
        }
      }

      // Update the template
      const [updatedTemplate] = await db
        .update(assessmentTemplates)
        .set({
          ...(data.assessmentTypeId && { assessmentTypeId: parseInt(data.assessmentTypeId) }),
          ...(data.name && { name: data.name }),
          ...(data.version && { version: data.version }),
          ...(data.description !== undefined && { description: data.description }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(assessmentTemplates.id, parseInt(id)))
        .returning();

      // Return updated template with type name
      const templateWithType = await this.getTemplateById(id);
      if (!templateWithType) {
        throw new Error('Failed to fetch updated template');
      }

      return templateWithType;
    } catch (error) {
      logger.dbError('update assessment template', error as Error, { templateId: id });
      throw error;
    }
  }

  static async deactivateTemplate(id: string): Promise<TemplateWithTypeName> {
    try {
      const [deactivatedTemplate] = await db
        .update(assessmentTemplates)
        .set({ 
          isActive: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(assessmentTemplates.id, parseInt(id)))
        .returning();

      if (!deactivatedTemplate) {
        throw new Error('Template not found');
      }

      // Return deactivated template with type name
      const templateWithType = await this.getTemplateById(id);
      if (!templateWithType) {
        throw new Error('Failed to fetch deactivated template');
      }

      return templateWithType;
    } catch (error) {
      logger.dbError('deactivate assessment template', error as Error, { templateId: id });
      throw error;
    }
  }

  static async getTemplatesByType(typeId: string): Promise<TemplateWithTypeName[]> {
    try {
      const templates = await db
        .select({
          id: assessmentTemplates.id,
          assessmentTypeId: assessmentTemplates.assessmentTypeId,
          name: assessmentTemplates.name,
          version: assessmentTemplates.version,
          description: assessmentTemplates.description,
          isActive: assessmentTemplates.isActive,
          createdAt: assessmentTemplates.createdAt,
          updatedAt: assessmentTemplates.updatedAt,
          assessmentTypeName: assessmentTypes.name,
        })
        .from(assessmentTemplates)
        .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
        .where(
          eq(assessmentTemplates.assessmentTypeId, parseInt(typeId)) &&
          eq(assessmentTemplates.isActive, 1)
        );

      return templates;
    } catch (error) {
      logger.dbError('fetch templates by type', error as Error, { typeId });
      throw new Error('Failed to fetch templates by type');
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, parseInt(id)));
    } catch (error) {
      logger.dbError('delete assessment template', error as Error, { templateId: id });
      throw error;
    }
  }

  static async createTemplate(data: CreateTemplateData): Promise<TemplateWithTypeName> {
    try {
      // Validate required fields
      if (!data.assessmentTypeId || !data.name || !data.version) {
        throw new Error('Missing required fields');
      }

      // Validate assessment type exists
      const assessmentType = await db
        .select()
        .from(assessmentTypes)
        .where(eq(assessmentTypes.id, parseInt(data.assessmentTypeId)))
        .limit(1);

      if (assessmentType.length === 0) {
        throw new Error('Invalid assessment type ID');
      }

      // Check for duplicate name-version combination
      const existingTemplate = await db
        .select()
        .from(assessmentTemplates)
        .where(
          eq(assessmentTemplates.name, data.name) && 
          eq(assessmentTemplates.version, data.version)
        )
        .limit(1);

      if (existingTemplate.length > 0) {
        throw new Error('Template with this name and version already exists');
      }

      // Create the template
      const [newTemplate] = await db
        .insert(assessmentTemplates)
        .values({
          assessmentTypeId: parseInt(data.assessmentTypeId),
          name: data.name,
          version: data.version,
          description: data.description || null,
          isActive: 1,
        })
        .returning();

      // Return with assessment type name
      const templateWithType = await db
        .select({
          id: assessmentTemplates.id,
          assessmentTypeId: assessmentTemplates.assessmentTypeId,
          name: assessmentTemplates.name,
          version: assessmentTemplates.version,
          description: assessmentTemplates.description,
          isActive: assessmentTemplates.isActive,
          createdAt: assessmentTemplates.createdAt,
          updatedAt: assessmentTemplates.updatedAt,
          assessmentTypeName: assessmentTypes.name,
        })
        .from(assessmentTemplates)
        .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
        .where(eq(assessmentTemplates.id, newTemplate.id))
        .limit(1);

      return templateWithType[0];
    } catch (error) {
      logger.dbError('create assessment template', error as Error);
      throw error;
    }
  }
} 