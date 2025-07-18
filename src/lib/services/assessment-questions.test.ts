import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanup } from '../test-utils-clean';
import { AssessmentQuestionsService } from './assessment-questions';
import { createAssessmentType } from './assessment-types';
import { AssessmentCategoriesService } from './assessment-categories';
import { AssessmentTemplatesService } from './assessment-templates';

describe('Assessment Questions Service', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('createQuestion', () => {
    it('should create a question with valid data', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: 'What is your favorite color?',
        displayOrder: 1
      };

      const question = await AssessmentQuestionsService.createQuestion(questionData);

      expect(question).toBeDefined();
      expect(question.questionText).toBe(questionData.questionText);
      expect(question.templateId).toBe(questionData.templateId);
      expect(question.categoryId).toBe(questionData.categoryId);
      expect(question.displayOrder).toBe(questionData.displayOrder);
      expect(question.isActive).toBe(1);
    });

    it('should throw error for missing required fields', async () => {
      const questionData = {
        questionText: 'Test question'
        // Missing templateId, categoryId, displayOrder
      };

      await expect(AssessmentQuestionsService.createQuestion(questionData as any)).rejects.toThrow();
    });

    it('should throw error for non-existent template', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      
      const questionData = {
        templateId: 999,
        categoryId: category.id,
        questionText: 'Test question',
        displayOrder: 1
      };

      await expect(AssessmentQuestionsService.createQuestion(questionData)).rejects.toThrow();
    });

    it('should throw error for non-existent category', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questionData = {
        templateId: template.id,
        categoryId: 999,
        questionText: 'Test question',
        displayOrder: 1
      };

      await expect(AssessmentQuestionsService.createQuestion(questionData)).rejects.toThrow();
    });
  });

  describe('getQuestionById', () => {
    it('should return question by ID', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Test question',
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
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Question 1',
        displayOrder: 1
      });
      await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Question 2',
        displayOrder: 2
      });

      const questions = await AssessmentQuestionsService.getQuestionsByTemplate(template.id);

      expect(questions).toHaveLength(2);
      expect(questions.some(q => q.questionText === 'Question 1')).toBe(true);
      expect(questions.some(q => q.questionText === 'Question 2')).toBe(true);
    });

    it('should return empty array when no questions exist', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questions = await AssessmentQuestionsService.getQuestionsByTemplate(template.id);

      expect(questions).toHaveLength(0);
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions for specific category', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Category Question 1',
        displayOrder: 1
      });

      const questions = await AssessmentQuestionsService.getQuestionsByCategory(category.id);

      expect(questions).toHaveLength(1);
      expect(questions[0].questionText).toBe('Category Question 1');
    });
  });

  describe('updateQuestion', () => {
    it('should update question with valid data', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Original question',
        displayOrder: 1
      };

      const createdQuestion = await AssessmentQuestionsService.createQuestion(questionData);

      const updateData = {
        questionText: 'Updated question',
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
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Test question',
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
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const questionData = {
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Test question',
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
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      const category = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      });
      const template = await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      });
      
      const question1 = await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Question 1',
        displayOrder: 1
      });
      const question2 = await AssessmentQuestionsService.createQuestion({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Question 2',
        displayOrder: 2
      });

      const questionOrders = [
        { id: question1.id, displayOrder: 3 },
        { id: question2.id, displayOrder: 1 }
      ];

      const reorderedQuestions = await AssessmentQuestionsService.reorderQuestions(template.id, questionOrders);

      expect(reorderedQuestions).toHaveLength(2);
      expect(reorderedQuestions.find(q => q.id === question1.id)?.displayOrder).toBe(3);
      expect(reorderedQuestions.find(q => q.id === question2.id)?.displayOrder).toBe(1);
    });
  });
}); 