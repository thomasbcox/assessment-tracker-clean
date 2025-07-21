import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { createInstance, getAllInstances } from '@/lib/services/assessment-instances';
import { logger } from '@/lib/logger';

// Mock the service functions
jest.mock('@/lib/services/assessment-instances');
jest.mock('@/lib/logger');

const mockCreateInstance = createInstance as jest.MockedFunction<typeof createInstance>;
const mockGetAllInstances = getAllInstances as jest.MockedFunction<typeof getAllInstances>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('/api/assessment-instances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all assessment instances successfully', async () => {
      const mockInstances = [
        {
          id: 1,
          userId: 'user1',
          periodId: 1,
          templateId: 1,
          status: 'pending',
          completedAt: null,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          userId: 'user2',
          periodId: 1,
          templateId: 1,
          status: 'completed',
          completedAt: '2024-01-02T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockGetAllInstances.mockResolvedValue(mockInstances);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockInstances);
      expect(mockGetAllInstances).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockGetAllInstances.mockRejectedValue(error);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch assessment instances' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch assessment instances',
        error
      );
    });
  });

  describe('POST', () => {
    it('should create assessment instance successfully', async () => {
      const mockInstance = {
        id: 1,
        userId: 'user1',
        periodId: 1,
        templateId: 1,
        status: 'pending',
        completedAt: null,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const requestData = {
        userId: 'user1',
        periodId: 1,
        templateId: 1,
        status: 'pending'
      };

      mockCreateInstance.mockResolvedValue(mockInstance);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockInstance);
      expect(mockCreateInstance).toHaveBeenCalledWith(requestData);
    });

    it('should handle validation errors from service', async () => {
      const error = new Error('Assessment instance already exists');
      mockCreateInstance.mockRejectedValue(error);

      const requestData = {
        userId: 'user1',
        periodId: 1,
        templateId: 1,
        status: 'pending'
      };

      const request = new NextRequest('http://localhost:3000/api/assessment-instances', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create assessment instance' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create assessment instance',
        error
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment-instances', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create assessment instance' });
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockCreateInstance.mockRejectedValue(error);

      const requestData = {
        userId: 'user1',
        periodId: 1,
        templateId: 1,
        status: 'pending'
      };

      const request = new NextRequest('http://localhost:3000/api/assessment-instances', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to create assessment instance' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create assessment instance',
        error
      );
    });
  });
}); 