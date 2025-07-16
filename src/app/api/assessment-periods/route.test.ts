import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { db, assessmentPeriods } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    dbError: jest.fn(),
  },
}));

describe('Assessment Periods API', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(assessmentPeriods);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assessmentPeriods);
  });

  describe('GET /api/assessment-periods', () => {
    it('should return all assessment periods ordered by start date', async () => {
      // Create test periods
      const testPeriods = [
        {
          name: 'Q2 2024',
          startDate: '2024-04-01',
          endDate: '2024-06-30',
          isActive: 0,
        },
        {
          name: 'Q1 2024',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          isActive: 1,
        },
      ];

      await db.insert(assessmentPeriods).values(testPeriods);

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-periods');

      // Call the API
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      
      // Check that periods are ordered by start date (descending)
      expect(new Date(data[0].startDate).getTime()).toBeGreaterThanOrEqual(new Date(data[1].startDate).getTime());
      
      // Check that returned periods match our test data
      const returnedNames = data.map((period: any) => period.name);
      expect(returnedNames).toContain('Q1 2024');
      expect(returnedNames).toContain('Q2 2024');
    });

    it('should return empty array when no periods exist', async () => {
      // Clear all periods
      await db.delete(assessmentPeriods);

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/assessment-periods');

      // Call the API
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('POST /api/assessment-periods', () => {
    it('should create a new period with valid data', async () => {
      const newPeriod = {
        name: 'Q3 2024 Test',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        isActive: '0',
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPeriod),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.name).toBe(newPeriod.name);
      expect(data.startDate).toBe(newPeriod.startDate);
      expect(data.endDate).toBe(newPeriod.endDate);
      expect(data.isActive).toBe(parseInt(newPeriod.isActive));
      expect(data.id).toBeDefined();
    });

    it('should return 400 error for missing required fields', async () => {
      const invalidPeriod = {
        name: 'Invalid Period',
        // Missing startDate, endDate
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPeriod),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 error for missing name', async () => {
      const invalidPeriod = {
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: '0',
        // Missing name
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPeriod),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 error for missing startDate', async () => {
      const invalidPeriod = {
        name: 'Missing Start Date',
        endDate: '2024-03-31',
        isActive: '0',
        // Missing startDate
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPeriod),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 error for missing endDate', async () => {
      const invalidPeriod = {
        name: 'Missing End Date',
        startDate: '2024-01-01',
        isActive: '0',
        // Missing endDate
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPeriod),
      });

      // Call the API
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should enforce unique name constraint', async () => {
      // Create first period
      const period1 = {
        name: 'Duplicate Period',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: '0',
      };

      const request1 = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(period1),
      });

      await POST(request1);

      // Try to create duplicate period
      const period2 = {
        name: 'Duplicate Period', // Same name
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isActive: '0',
      };

      const request2 = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(period2),
      });

      const response = await POST(request2);

      // Should return 500 due to database constraint violation
      expect(response.status).toBe(500);
    });

    it('should handle invalid date formats gracefully', async () => {
      const invalidPeriod = {
        name: 'Invalid Date Period',
        startDate: 'invalid-date',
        endDate: '2024-03-31',
        isActive: '0',
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPeriod),
      });

      // Call the API
      const response = await POST(request);

      // Should return 500 due to database constraint violation or validation error
      expect(response.status).toBe(500);
    });

    it('should handle end date before start date gracefully', async () => {
      const invalidPeriod = {
        name: 'Invalid Date Range',
        startDate: '2024-03-31',
        endDate: '2024-01-01', // End date before start date
        isActive: '0',
      };

      // Create mock request with JSON body
      const request = new NextRequest('http://localhost:3000/api/assessment-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPeriod),
      });

      // Call the API
      const response = await POST(request);

      // Should return 500 due to database constraint violation or validation error
      expect(response.status).toBe(500);
    });
  });
}); 