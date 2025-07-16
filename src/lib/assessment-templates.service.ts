import { db, assessmentTemplates, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';
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