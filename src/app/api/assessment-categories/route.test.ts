import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { db, assessmentCategories, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    dbError: jest.fn(),
  },
}));

describe('Assessment Categories API', () => {
  let testTypeId: number;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(assessmentCategories);
    await db.delete(assessmentTypes);

    // Create a test assessment type
    const [type] = await db.insert(assessmentTypes).values({
      name: 'API Test Type',
      description: 'For testing API',
      purpose: 'Testing',
    }).returning();
    testTypeId = type.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assessmentCategories);
    await db.delete(assessmentTypes);
  });

  describe('GET /api/assessment-categories', () => {
    it('should return all active categories ordered by display order', async () => {
      // Create test categories
      const testCategories = [
        {
          assessmentTypeId: testTypeId,
          name: 'Category 2',
          description: 'Second category',
          displayOrder: 2,
        },
        {
          assessmentTypeId: testTypeId,
          name: 'Category 1',
          description: 'First category',
          displayOrder: 1,
        },
      ];

      await db.insert(assessmentCategories).values(testCategories);

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-categories');

      // Call the API
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      
      // Check that categories are ordered by display order
      expect(data[0].displayOrder).toBeLessThanOrEqual(data[1].displayOrder);
      
      // Check that all returned categories are active
      data.forEach((category: any) => {
        expect(category.isActive).toBe(1);
      });
    });

    it('should return empty array when no categories exist', async () => {
      // Clear all categories
      await db.delete(assessmentCategories);

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-categories');

      // Call the API
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('POST /api/assessment-categories', () => {
    it('should create a new category with valid data', async () => {
      const newCategory = {
        assessmentTypeId: testTypeId.toString(),
        name: 'New Test Category',
        description: 'A new test category',
        displayOrder: '3',
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.name).toBe(newCategory.name);
      expect(data.description).toBe(newCategory.description);
      expect(data.displayOrder).toBe(parseInt(newCategory.displayOrder));
      expect(data.assessmentTypeId).toBe(testTypeId);
      expect(data.id).toBeDefined();
    });

    it('should return 400 error for missing required fields', async () => {
      const invalidCategory = {
        name: 'Invalid Category',
        // Missing assessmentTypeId and displayOrder
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCategory),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 error for missing assessmentTypeId', async () => {
      const invalidCategory = {
        name: 'Invalid Category',
        description: 'Missing assessment type ID',
        displayOrder: '1',
        // Missing assessmentTypeId
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCategory),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 error for missing name', async () => {
      const invalidCategory = {
        assessmentTypeId: testTypeId.toString(),
        description: 'Missing name',
        displayOrder: '1',
        // Missing name
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCategory),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 error for missing displayOrder', async () => {
      const invalidCategory = {
        assessmentTypeId: testTypeId.toString(),
        name: 'Missing Display Order',
        description: 'Missing display order',
        // Missing displayOrder
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCategory),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should handle invalid assessmentTypeId gracefully', async () => {
      const invalidCategory = {
        assessmentTypeId: '99999', // Non-existent type ID
        name: 'Invalid Type Category',
        description: 'Should fail',
        displayOrder: '1',
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCategory),
      });

      // Call the API
      const response = await POST(request);

      // Should either return 400 or 500 depending on how foreign key constraints are handled
      expect([400, 500]).toContain(response.status);
    });
  });
}); 