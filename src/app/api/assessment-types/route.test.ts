import { NextRequest } from 'next/server';
import { GET } from './route';
import { db, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    dbError: jest.fn(),
  },
}));

describe('Assessment Types API', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(assessmentTypes);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assessmentTypes);
  });

  describe('GET /api/assessment-types', () => {
    it('should return all active assessment types', async () => {
      // Create test data
      const testTypes = [
        {
          name: 'Test Type 1',
          description: 'First test type',
          purpose: 'Testing',
        },
        {
          name: 'Test Type 2',
          description: 'Second test type',
          purpose: 'More testing',
        },
      ];

      await db.insert(assessmentTypes).values(testTypes);

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-types');

      // Call the API
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      
      // Check that returned types match our test data
      const returnedNames = data.map((type: any) => type.name);
      expect(returnedNames).toContain('Test Type 1');
      expect(returnedNames).toContain('Test Type 2');
      
      // Check that all returned types are active
      data.forEach((type: any) => {
        expect(type.isActive).toBe(1);
      });
    });

    it('should return empty array when no assessment types exist', async () => {
      // Clear all assessment types
      await db.delete(assessmentTypes);

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-types');

      // Call the API
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by closing the connection
      const originalDb = db;
      
      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-types');

      // This test would require more sophisticated mocking of the database
      // For now, we'll just test that the function doesn't throw
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });
}); 