import { db, assessmentQuestions, assessmentCategories, assessmentTemplates } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface AssessmentQuestionData {
  templateId: number;
  categoryId: number;
  questionText: string;
  displayOrder: number;
}

export interface AssessmentQuestion {
  id: number;
  templateId: number;
  categoryId: number;
  questionText: string;
  displayOrder: number;
  isActive: number;
  createdAt: string;
}

export class AssessmentQuestionsService {
  static async createQuestion(data: AssessmentQuestionData): Promise<AssessmentQuestion> {
    try {
      // Validate required fields
      if (!data.templateId || !data.categoryId || !data.questionText || data.displayOrder === undefined) {
        throw new Error('Template ID, category ID, question text, and display order are required');
      }

      // Validate template exists
      const [template] = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, data.templateId)).limit(1);
      if (!template) throw new Error('Assessment template not found');

      // Validate category exists
      const [category] = await db.select().from(assessmentCategories).where(eq(assessmentCategories.id, data.categoryId)).limit(1);
      if (!category) throw new Error('Assessment category not found');

      // Check for duplicate question text within the same template
      const existing = await db.select().from(assessmentQuestions)
        .where(and(
          eq(assessmentQuestions.templateId, data.templateId),
          eq(assessmentQuestions.questionText, data.questionText)
        ))
        .limit(1);
      if (existing.length > 0) throw new Error('Question with this text already exists in this template');

      const [question] = await db.insert(assessmentQuestions).values({
        templateId: data.templateId,
        categoryId: data.categoryId,
        questionText: data.questionText,
        displayOrder: data.displayOrder,
        isActive: 1,
      }).returning();

      return { ...question, createdAt: question.createdAt || '' };
    } catch (error) {
      logger.dbError('create assessment question', error as Error, data);
      throw error;
    }
  }

  static async getQuestionById(id: number): Promise<AssessmentQuestion | null> {
    try {
      const [question] = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.id, id)).limit(1);
      if (!question) return null;
      return { ...question, createdAt: question.createdAt || '' };
    } catch (error) {
      logger.dbError('fetch assessment question by id', error as Error, { id });
      throw error;
    }
  }

  static async getQuestionsByTemplate(templateId: number): Promise<AssessmentQuestion[]> {
    try {
      const questions = await db.select()
        .from(assessmentQuestions)
        .where(and(
          eq(assessmentQuestions.templateId, templateId),
          eq(assessmentQuestions.isActive, 1)
        ))
        .orderBy(assessmentQuestions.displayOrder);
      
      return questions.map(question => ({ ...question, createdAt: question.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch questions by template', error as Error, { templateId });
      throw error;
    }
  }

  static async getQuestionsByCategory(categoryId: number): Promise<AssessmentQuestion[]> {
    try {
      const questions = await db.select()
        .from(assessmentQuestions)
        .where(and(
          eq(assessmentQuestions.categoryId, categoryId),
          eq(assessmentQuestions.isActive, 1)
        ))
        .orderBy(assessmentQuestions.displayOrder);
      
      return questions.map(question => ({ ...question, createdAt: question.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch questions by category', error as Error, { categoryId });
      throw error;
    }
  }

  static async updateQuestion(id: number, data: Partial<AssessmentQuestionData>): Promise<AssessmentQuestion> {
    try {
      const existing = await this.getQuestionById(id);
      if (!existing) throw new Error('Assessment question not found');

      // Check for duplicate question text if text is being updated
      if (data.questionText) {
        const duplicate = await db.select().from(assessmentQuestions)
          .where(and(
            eq(assessmentQuestions.templateId, existing.templateId),
            eq(assessmentQuestions.questionText, data.questionText),
            eq(assessmentQuestions.id, id).not()
          ))
          .limit(1);
        if (duplicate.length > 0) throw new Error('Question with this text already exists in this template');
      }

      const [updated] = await db.update(assessmentQuestions)
        .set({
          ...(data.templateId && { templateId: data.templateId }),
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.questionText && { questionText: data.questionText }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        })
        .where(eq(assessmentQuestions.id, id))
        .returning();

      if (!updated) throw new Error('Failed to update assessment question');
      return { ...updated, createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update assessment question', error as Error, { id, data });
      throw error;
    }
  }

  static async deleteQuestion(id: number): Promise<void> {
    try {
      await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, id));
    } catch (error) {
      logger.dbError('delete assessment question', error as Error, { id });
      throw error;
    }
  }

  static async deactivateQuestion(id: number): Promise<AssessmentQuestion> {
    try {
      const [deactivated] = await db.update(assessmentQuestions)
        .set({ isActive: 0 })
        .where(eq(assessmentQuestions.id, id))
        .returning();

      if (!deactivated) throw new Error('Assessment question not found');
      return { ...deactivated, createdAt: deactivated.createdAt || '' };
    } catch (error) {
      logger.dbError('deactivate assessment question', error as Error, { id });
      throw error;
    }
  }

  static async reorderQuestions(templateId: number, questionOrders: { id: number; displayOrder: number }[]): Promise<AssessmentQuestion[]> {
    try {
      // Update each question's display order
      for (const { id, displayOrder } of questionOrders) {
        await db.update(assessmentQuestions)
          .set({ displayOrder })
          .where(eq(assessmentQuestions.id, id));
      }

      // Return updated questions
      return await this.getQuestionsByTemplate(templateId);
    } catch (error) {
      logger.dbError('reorder assessment questions', error as Error, { templateId, questionOrders });
      throw error;
    }
  }

  static async duplicateQuestions(sourceTemplateId: number, targetTemplateId: number): Promise<AssessmentQuestion[]> {
    try {
      // Get all questions from source template
      const sourceQuestions = await this.getQuestionsByTemplate(sourceTemplateId);
      
      // Create new questions in target template
      const newQuestions: AssessmentQuestion[] = [];
      for (const question of sourceQuestions) {
        const [newQuestion] = await db.insert(assessmentQuestions).values({
          templateId: targetTemplateId,
          categoryId: question.categoryId,
          questionText: question.questionText,
          displayOrder: question.displayOrder,
          isActive: 1,
        }).returning();
        newQuestions.push({ ...newQuestion, createdAt: newQuestion.createdAt || '' });
      }

      return newQuestions;
    } catch (error) {
      logger.dbError('duplicate assessment questions', error as Error, { sourceTemplateId, targetTemplateId });
      throw error;
    }
  }
} 