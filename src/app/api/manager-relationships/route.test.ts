import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { createRelationship, getAllRelationships } from '@/lib/services/manager-relationships';
import { logger } from '@/lib/logger';

// Mock the service functions
jest.mock('@/lib/services/manager-relationships');
jest.mock('@/lib/logger');

const mockCreateRelationship = createRelationship as jest.MockedFunction<typeof createRelationship>;
const mockGetAllRelationships = getAllRelationships as jest.MockedFunction<typeof getAllRelationships>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('/api/manager-relationships', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all manager relationships successfully', async () => {
      const mockRelationships = [
        {
          id: 1,
          managerId: 'manager1',
          subordinateId: 'subordinate1',
          periodId: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          managerId: 'manager2',
          subordinateId: 'subordinate2',
          periodId: 1,
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      mockGetAllRelationships.mockResolvedValue(mockRelationships);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRelationships);
      expect(mockGetAllRelationships).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockGetAllRelationships.mockRejectedValue(error);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch manager relationships' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch manager relationships',
        error
      );
    });
  });

  describe('POST', () => {
    it('should create manager relationship successfully', async () => {
      const mockRelationship = {
        id: 1,
        managerId: 'manager1',
        subordinateId: 'subordinate1',
        periodId: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const requestData = {
        managerId: 'manager1',
        subordinateId: 'subordinate1',
        periodId: 1
      };

      mockCreateRelationship.mockResolvedValue(mockRelationship);

      const request = new NextRequest('http://localhost:3000/api/manager-relationships', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockRelationship);
      expect(mockCreateRelationship).toHaveBeenCalledWith(requestData);
    });

    it('should handle validation errors from service', async () => {
      const error = new Error('Subordinate already has a manager for this period');
      mockCreateRelationship.mockRejectedValue(error);

      const requestData = {
        managerId: 'manager1',
        subordinateId: 'subordinate1',
        periodId: 1
      };

      const request = new NextRequest('http://localhost:3000/api/manager-relationships', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create manager relationship' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create manager relationship',
        error
      );
    });

    it('should handle self-relationship error', async () => {
      const error = new Error('Manager cannot be their own subordinate');
      mockCreateRelationship.mockRejectedValue(error);

      const requestData = {
        managerId: 'user1',
        subordinateId: 'user1',
        periodId: 1
      };

      const request = new NextRequest('http://localhost:3000/api/manager-relationships', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create manager relationship' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create manager relationship',
        error
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager-relationships', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create manager relationship' });
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockCreateRelationship.mockRejectedValue(error);

      const requestData = {
        managerId: 'manager1',
        subordinateId: 'subordinate1',
        periodId: 1
      };

      const request = new NextRequest('http://localhost:3000/api/manager-relationships', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create manager relationship' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create manager relationship',
        error
      );
    });
  });
}); 