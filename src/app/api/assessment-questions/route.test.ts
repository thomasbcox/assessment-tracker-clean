import { NextRequest } from 'next/server';
import { db, assessmentQuestions, assessmentTemplates, assessmentCategories, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    dbError: jest.fn(),
  },
}));

// Import the actual route handlers
import { GET, POST } from '../assessment-templates/[id]/questions/route';
import { PUT, DELETE } from './[id]/route';

describe('Assessment Questions API', () => {
  let testTypeId: number;
  let testTemplateId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(assessmentQuestions);
    await db.delete(assessmentTemplates);
    await db.delete(assessmentCategories);
    await db.delete(assessmentTypes);

    // Create test data
    const [type] = await db.insert(assessmentTypes).values({
      name: 'Question API Test Type',
      description: 'For testing question API',
      purpose: 'Testing',
    }).returning();
    testTypeId = type.id;

    const [template] = await db.insert(assessmentTemplates).values({
      assessmentTypeId: testTypeId,
      name: 'Question API Test Template',
      version: 'v1.0',
      description: 'For testing questions',
    }).returning();
    testTemplateId = template.id;

    const [category] = await db.insert(assessmentCategories).values({
      assessmentTypeId: testTypeId,
      name: 'Question API Test Category',
      description: 'For testing questions',
      displayOrder: 1,
    }).returning();
    testCategoryId = category.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assessmentQuestions);
    await db.delete(assessmentTemplates);
    await db.delete(assessmentCategories);
    await db.delete(assessmentTypes);
  });

  describe('GET /api/assessment-templates/[id]/questions', () => {
    it('should return questions for a specific template', async () => {
      // Create test questions
      const testQuestions = [
        {
          templateId: testTemplateId,
          categoryId: testCategoryId,
          questionText: 'What is your favorite color?',
          displayOrder: 1,
        },
        {
          templateId: testTemplateId,
          categoryId: testCategoryId,
          questionText: 'How satisfied are you?',
          displayOrder: 2,
        },
      ];

      await db.insert(assessmentQuestions).values(testQuestions);

      // Create mock request with template ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-templates/' + testTemplateId + '/questions');
      const params = Promise.resolve({ id: testTemplateId.toString() });

      // Call the API
      const response = await GET(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      
      // Check that questions are ordered by display order
      expect(data[0].displayOrder).toBeLessThanOrEqual(data[1].displayOrder);
      
      // Check that all returned questions belong to the template
      data.forEach((question: any) => {
        expect(question.templateId).toBe(testTemplateId);
        expect(question.categoryName).toBeDefined();
      });
    });

    it('should return empty array when no questions exist for template', async () => {
      // Clear all questions
      await db.delete(assessmentQuestions);

      // Create mock request with template ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-templates/' + testTemplateId + '/questions');
      const params = Promise.resolve({ id: testTemplateId.toString() });

      // Call the API
      const response = await GET(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('POST /api/assessment-templates/[id]/questions', () => {
    it('should create a new question with valid data', async () => {
      const newQuestion = {
        categoryId: testCategoryId.toString(),
        questionText: 'New test question?',
        displayOrder: '3',
      };

      // Create mock request with JSON body and template ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-templates/' + testTemplateId + '/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestion),
      });
      const params = Promise.resolve({ id: testTemplateId.toString() });

      // Call the API
      const response = await POST(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.questionText).toBe(newQuestion.questionText);
      expect(data.displayOrder).toBe(parseInt(newQuestion.displayOrder));
      expect(data.templateId).toBe(testTemplateId);
      expect(data.categoryId).toBe(testCategoryId);
      expect(data.id).toBeDefined();
    });

    it('should return 400 error for missing required fields', async () => {
      const invalidQuestion = {
        questionText: 'Invalid question',
        // Missing categoryId, displayOrder
      };

      // Create mock request with JSON body and template ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-templates/' + testTemplateId + '/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidQuestion),
      });
      const params = Promise.resolve({ id: testTemplateId.toString() });

      // Call the API
      const response = await POST(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('PUT /api/assessment-questions/[id]', () => {
    let testQuestionId: number;

    beforeEach(async () => {
      // Create a test question for updating
      const [question] = await db.insert(assessmentQuestions).values({
        templateId: testTemplateId,
        categoryId: testCategoryId,
        questionText: 'Question to update',
        displayOrder: 1,
      }).returning();
      testQuestionId = question.id;
    });

    it('should update an existing question', async () => {
      const updatedQuestion = {
        categoryId: testCategoryId.toString(),
        questionText: 'Updated question text',
        displayOrder: '5',
      };

      // Create mock request with JSON body and question ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-questions/' + testQuestionId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuestion),
      });
      const params = Promise.resolve({ id: testQuestionId.toString() });

      // Call the API
      const response = await PUT(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.questionText).toBe(updatedQuestion.questionText);
      expect(data.displayOrder).toBe(parseInt(updatedQuestion.displayOrder));
      expect(data.id).toBe(testQuestionId);
    });

    it('should return 400 error for missing required fields', async () => {
      const invalidUpdate = {
        questionText: 'Updated without required fields',
        // Missing categoryId, displayOrder
      };

      // Create mock request with JSON body and question ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-questions/' + testQuestionId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdate),
      });
      const params = Promise.resolve({ id: testQuestionId.toString() });

      // Call the API
      const response = await PUT(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 404 error for non-existent question', async () => {
      const nonExistentUpdate = {
        categoryId: testCategoryId.toString(),
        questionText: 'Non-existent question',
        displayOrder: '1',
      };

      // Create mock request with JSON body and non-existent question ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-questions/99999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nonExistentUpdate),
      });
      const params = Promise.resolve({ id: '99999' });

      // Call the API
      const response = await PUT(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Question not found');
    });
  });

  describe('DELETE /api/assessment-questions/[id]', () => {
    let testQuestionId: number;

    beforeEach(async () => {
      // Create a test question for deleting
      const [question] = await db.insert(assessmentQuestions).values({
        templateId: testTemplateId,
        categoryId: testCategoryId,
        questionText: 'Question to delete',
        displayOrder: 1,
      }).returning();
      testQuestionId = question.id;
    });

    it('should delete an existing question', async () => {
      // Create mock request with question ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-questions/' + testQuestionId, {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: testQuestionId.toString() });

      // Call the API
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify the question is actually deleted
      const remainingQuestion = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.id, testQuestionId))
        .limit(1);

      expect(remainingQuestion).toHaveLength(0);
    });

    it('should return 404 error for non-existent question', async () => {
      // Create mock request with non-existent question ID in params
      const request = new NextRequest('http://localhost:3000/api/assessment-questions/99999', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: '99999' });

      // Call the API
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Question not found');
    });
  });
}); 