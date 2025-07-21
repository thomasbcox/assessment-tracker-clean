import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from './route';
import { getAssessmentInstance, updateAssessmentInstance, deleteInstance } from '@/lib/services/assessment-instances';
import { logger } from '@/lib/logger';

// Mock the service functions
jest.mock('@/lib/services/assessment-instances');
jest.mock('@/lib/logger');

const mockGetAssessmentInstance = getAssessmentInstance as jest.MockedFunction<typeof getAssessmentInstance>;
const mockUpdateAssessmentInstance = updateAssessmentInstance as jest.MockedFunction<typeof updateAssessmentInstance>;
const mockDeleteInstance = deleteInstance as jest.MockedFunction<typeof deleteInstance>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('/api/assessment-instances/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return assessment instance with details successfully', async () => {
      const mockInstance = {
        id: 1,
        userId: 'user1',
        periodId: 1,
        templateId: 1,
        status: 'pending',
        completedAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        periodName: 'Q1 2024',
        templateName: 'Leadership Assessment',
        templateVersion: '1.0',
        assessmentTypeName: 'Leadership'
      };

      mockGetAssessmentInstance.mockResolvedValue(mockInstance);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/1');
      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockInstance);
      expect(mockGetAssessmentInstance).toHaveBeenCalledWith(1);
    });

    it('should handle invalid ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment-instances/invalid');
      const response = await GET(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid assessment instance ID' });
      expect(mockGetAssessmentInstance).not.toHaveBeenCalled();
    });

    it('should handle instance not found', async () => {
      const error = new Error('Assessment instance not found');
      mockGetAssessmentInstance.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/999');
      const response = await GET(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Failed to fetch assessment instance' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch assessment instance',
        error
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockGetAssessmentInstance.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/1');
      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Failed to fetch assessment instance' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch assessment instance',
        error
      );
    });
  });

  describe('PUT', () => {
    it('should update assessment instance successfully', async () => {
      const mockInstance = {
        id: 1,
        userId: 'user1',
        periodId: 1,
        templateId: 1,
        status: 'completed',
        completedAt: '2024-01-02T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z'
      };

      const updateData = {
        status: 'completed',
        completedAt: '2024-01-02T00:00:00Z'
      };

      mockUpdateAssessmentInstance.mockResolvedValue(mockInstance);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockInstance);
      expect(mockUpdateAssessmentInstance).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle invalid ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment-instances/invalid', {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });

      const response = await PUT(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid assessment instance ID' });
      expect(mockUpdateAssessmentInstance).not.toHaveBeenCalled();
    });

    it('should handle validation errors from service', async () => {
      const error = new Error('Invalid status value');
      mockUpdateAssessmentInstance.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'invalid' })
      });

      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to update assessment instance' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update assessment instance',
        error
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment-instances/1', {
        method: 'PUT',
        body: 'invalid json'
      });

      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to update assessment instance' });
    });
  });

  describe('DELETE', () => {
    it('should delete assessment instance successfully', async () => {
      mockDeleteInstance.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/1', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Assessment instance deleted successfully' });
      expect(mockDeleteInstance).toHaveBeenCalledWith(1);
    });

    it('should handle invalid ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment-instances/invalid', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid assessment instance ID' });
      expect(mockDeleteInstance).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Instance not found');
      mockDeleteInstance.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/assessment-instances/999', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to delete assessment instance' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete assessment instance',
        error
      );
    });
  });
}); 