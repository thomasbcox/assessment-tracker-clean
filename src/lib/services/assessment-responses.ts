import { db, assessmentResponses, assessmentQuestions, assessmentInstances } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface AssessmentResponseData {
  instanceId: number;
  questionId: number;
  score: number;
}

export interface AssessmentResponse {
  id: number;
  instanceId: number;
  questionId: number;
  score: number;
  createdAt: string;
}

export class AssessmentResponsesService {
  static async createResponse(data: AssessmentResponseData): Promise<AssessmentResponse> {
    try {
      // Validate score is between 1-7
      if (data.score < 1 || data.score > 7) {
        throw new Error('Score must be between 1 and 7');
      }

      // Validate assessment instance exists
      const [instance] = await db.select().from(assessmentInstances).where(eq(assessmentInstances.id, data.instanceId)).limit(1);
      if (!instance) throw new Error('Assessment instance not found');

      // Validate question exists
      const [question] = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.id, data.questionId)).limit(1);
      if (!question) throw new Error('Assessment question not found');

      // Check for existing response for this instance/question
      const existing = await db.select().from(assessmentResponses)
        .where(and(
          eq(assessmentResponses.instanceId, data.instanceId),
          eq(assessmentResponses.questionId, data.questionId)
        ))
        .limit(1);
      if (existing.length > 0) throw new Error('Response already exists for this question');

      const [response] = await db.insert(assessmentResponses).values({
        instanceId: data.instanceId,
        questionId: data.questionId,
        score: data.score,
      }).returning();

      return { ...response, createdAt: response.createdAt || '' };
    } catch (error) {
      logger.dbError('create assessment response', error as Error, data);
      throw error;
    }
  }

  static async getResponsesByInstance(instanceId: number): Promise<AssessmentResponse[]> {
    try {
      const responses = await db.select().from(assessmentResponses).where(eq(assessmentResponses.instanceId, instanceId));
      return responses.map(response => ({ ...response, createdAt: response.createdAt || '' }));
    } catch (error) {
      logger.dbError('fetch responses by instance', error as Error, { instanceId });
      throw error;
    }
  }

  static async updateResponse(id: number, score: number): Promise<AssessmentResponse> {
    try {
      if (score < 1 || score > 7) {
        throw new Error('Score must be between 1 and 7');
      }

      const [updated] = await db.update(assessmentResponses)
        .set({ score })
        .where(eq(assessmentResponses.id, id))
        .returning();
      if (!updated) throw new Error('Assessment response not found');
      return { ...updated, createdAt: updated.createdAt || '' };
    } catch (error) {
      logger.dbError('update assessment response', error as Error, { id, score });
      throw error;
    }
  }

  static async deleteResponse(id: number): Promise<void> {
    try {
      await db.delete(assessmentResponses).where(eq(assessmentResponses.id, id));
    } catch (error) {
      logger.dbError('delete assessment response', error as Error, { id });
      throw error;
    }
  }

  static async validateInstanceCompletion(instanceId: number): Promise<{ isComplete: boolean; missingQuestions: number[] }> {
    try {
      // Get all questions for the instance's template
      const [instance] = await db.select().from(assessmentInstances).where(eq(assessmentInstances.id, instanceId)).limit(1);
      if (!instance) throw new Error('Assessment instance not found');

      const questions = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.templateId, instance.templateId));
      const responses = await this.getResponsesByInstance(instanceId);

      const questionIds = questions.map(q => q.id);
      const responseQuestionIds = responses.map(r => r.questionId);
      const missingQuestions = questionIds.filter(id => !responseQuestionIds.includes(id));

      return {
        isComplete: missingQuestions.length === 0,
        missingQuestions
      };
    } catch (error) {
      logger.dbError('validate instance completion', error as Error, { instanceId });
      throw error;
    }
  }
}

// Export individual functions for API endpoints
export const createResponse = AssessmentResponsesService.createResponse;
export const getResponsesByInstance = AssessmentResponsesService.getResponsesByInstance;
export const updateResponse = AssessmentResponsesService.updateResponse;
export const deleteResponse = AssessmentResponsesService.deleteResponse;
export const validateInstanceCompletion = AssessmentResponsesService.validateInstanceCompletion; 