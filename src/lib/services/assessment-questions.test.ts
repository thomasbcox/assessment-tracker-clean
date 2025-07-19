import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
// import { cleanup } from '../test-utils-clean';
import { AssessmentQuestionsService } from './assessment-questions';
import { getActiveAssessmentTypes } from './assessment-types';
import { AssessmentCategoriesService } from './assessment-categories';
import { AssessmentTemplatesService } from './assessment-templates';

// Helper function to create unique question text
const createUniqueQuestionText = (baseText: string = 'Test Question') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseText} ${timestamp}-${random}`;
};

// Helper function to get or create a unique assessment type
const getOrCreateAssessmentType = async (baseName: string = 'Test Type') => {
  const timestamp = Date.now();
  const uniqueName = `${baseName} ${timestamp}`;
  
  // Try to get existing types first
  const existingTypes = await getActiveAssessmentTypes();
  if (existingTypes.length > 0) {
    return existingTypes[0]; // Use the first available type
  }
  
  // If no types exist, we'll need to create one
  const { createAssessmentType } = await import('./assessment-types');
  return await createAssessmentType({ name: uniqueName });
};

// Helper function to get or create a unique category
const getOrCreateCategory = async (assessmentTypeId: number, baseName: string = 'Test Category') => {
  const timestamp = Date.now();
  const uniqueName = `${baseName} ${timestamp}`;
  
  // Try to get existing categories first
  const existingCategories = await AssessmentCategoriesService.getActiveCategories();
  if (existingCategories.length > 0) {
    return existingCategories[0]; // Use the first available category
  }
  
  // If no categories exist, we'll need to create one
  return await AssessmentCategoriesService.createCategory({
    assessmentTypeId,
    name: uniqueName,
    displayOrder: 1
  });
};

// Helper function to get or create a unique template
const getOrCreateTemplate = async (assessmentTypeId: number, baseName: string = 'Test Template') => {
  const timestamp = Date.now();
  const uniqueName = `${baseName} ${timestamp}`;
  const uniqueVersion = `1.${timestamp}`;
  
  // Try to get existing templates first
  const existingTemplates = await AssessmentTemplatesService.getAllTemplates();
  if (existingTemplates.length > 0) {
    return existingTemplates[0]; // Use the first available template
  }
  
  // If no templates exist, we'll need to create one
  return await AssessmentTemplatesService.createTemplate({
    assessmentTypeId: assessmentTypeId.toString(),
    name: uniqueName,
    version: uniqueVersion
  });
};

describe('Assessment Questions Service', () => {
  // Temporarily disable cleanup to avoid foreign key constraint issues
  // beforeEach(async () => {
  //   await cleanup();
  // });

  // afterEach(async () => {
  //   await cleanup();
  // });

  describe('createQuestion', () => {
    it('should create a question with valid data', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      const question = await AssessmentQuestionsService.createQuestion(questionData);

      expect(question).toBeDefined();
      expect(question.questionText).toBe(questionData.questionText);
      expect(question.templateId).toBe(questionData.templateId);
      expect(question.categoryId).toBe(questionData.categoryId);
      expect(question.displayOrder).toBe(questionData.displayOrder);
    });

    it('should throw error for missing required fields', async () => {
      const questionData = {
        templateId: 1,
        // Missing categoryId, questionText, displayOrder
      };

      await expect(AssessmentQuestionsService.createQuestion(questionData as any)).rejects.toThrow();
    });

    it('should throw error for non-existent template', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);

      const questionData = {
        templateId: 999999,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      await expect(AssessmentQuestionsService.createQuestion(questionData)).rejects.toThrow();
    });

    it('should throw error for non-existent category', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: 999999,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      await expect(AssessmentQuestionsService.createQuestion(questionData)).rejects.toThrow();
    });
  });

  describe('getQuestionById', () => {
    it('should return question by ID', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      const createdQuestion = await AssessmentQuestionsService.createQuestion(questionData);
      const question = await AssessmentQuestionsService.getQuestionById(createdQuestion.id);

      expect(question).toBeDefined();
      expect(question?.id).toBe(createdQuestion.id);
      expect(question?.questionText).toBe(questionData.questionText);
    });

    it('should return null for non-existent question', async () => {
      const question = await AssessmentQuestionsService.getQuestionById(999);

      expect(question).toBeNull();
    });
  });

  describe('getQuestionsByTemplate', () => {
    it('should return questions for specific template', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      await AssessmentQuestionsService.createQuestion(questionData);

      const questions = await AssessmentQuestionsService.getQuestionsByTemplate(template.id);

      expect(questions.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no questions exist', async () => {
      // Use a very high ID that definitely doesn't exist
      const questions = await AssessmentQuestionsService.getQuestionsByTemplate(999999);
      expect(questions).toHaveLength(0);
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions for specific category', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      await AssessmentQuestionsService.createQuestion(questionData);

      const questions = await AssessmentQuestionsService.getQuestionsByCategory(category.id);

      expect(questions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateQuestion', () => {
    it('should update question with valid data', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      const createdQuestion = await AssessmentQuestionsService.createQuestion(questionData);

      const updateData = {
        questionText: createUniqueQuestionText('Updated Question'),
        displayOrder: 2
      };

      const updatedQuestion = await AssessmentQuestionsService.updateQuestion(createdQuestion.id, updateData);

      expect(updatedQuestion.questionText).toBe(updateData.questionText);
      expect(updatedQuestion.displayOrder).toBe(updateData.displayOrder);
    });

    it('should throw error for non-existent question', async () => {
      await expect(AssessmentQuestionsService.updateQuestion(999, { questionText: 'Test' })).rejects.toThrow();
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      const createdQuestion = await AssessmentQuestionsService.createQuestion(questionData);
      await AssessmentQuestionsService.deleteQuestion(createdQuestion.id);

      const question = await AssessmentQuestionsService.getQuestionById(createdQuestion.id);
      expect(question).toBeNull();
    });
  });

  describe('deactivateQuestion', () => {
    it('should deactivate question', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText(),
        displayOrder: 1
      };

      const createdQuestion = await AssessmentQuestionsService.createQuestion(questionData);
      const deactivatedQuestion = await AssessmentQuestionsService.deactivateQuestion(createdQuestion.id);

      expect(deactivatedQuestion.isActive).toBe(0);
    });

    it('should throw error for non-existent question', async () => {
      await expect(AssessmentQuestionsService.deactivateQuestion(999)).rejects.toThrow();
    });
  });

  describe('reorderQuestions', () => {
    it('should reorder questions correctly', async () => {
      const assessmentType = await getOrCreateAssessmentType();
      const category = await getOrCreateCategory(assessmentType.id);
      const template = await getOrCreateTemplate(assessmentType.id);

      const question1 = await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText('Question 1'),
        displayOrder: 1
      });

      const question2 = await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: createUniqueQuestionText('Question 2'),
        displayOrder: 2
      });

      await AssessmentQuestionsService.reorderQuestions(template.id, [
        { id: question2.id, displayOrder: 1 },
        { id: question1.id, displayOrder: 2 }
      ]);

      const updatedQuestion1 = await AssessmentQuestionsService.getQuestionById(question1.id);
      const updatedQuestion2 = await AssessmentQuestionsService.getQuestionById(question2.id);

      expect(updatedQuestion1?.displayOrder).toBe(2);
      expect(updatedQuestion2?.displayOrder).toBe(1);
    });
  });


}); 