import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from './route';
import { ManagerRelationshipsService } from '@/lib/services/manager-relationships';

// Mock the service
jest.mock('@/lib/services/manager-relationships');
jest.mock('@/lib/logger');

const mockManagerRelationshipsService = ManagerRelationshipsService as jest.Mocked<typeof ManagerRelationshipsService>;

describe('/api/manager-relationships/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return relationship by ID successfully', async () => {
      const mockRelationship = {
        id: 1,
        managerId: 'manager1',
        subordinateId: 'subordinate1',
        periodId: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockManagerRelationshipsService.getRelationshipById.mockResolvedValue(mockRelationship);

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/1');
      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRelationship);
      expect(mockManagerRelationshipsService.getRelationshipById).toHaveBeenCalledWith(1);
    });

    it('should handle invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager-relationships/invalid');
      const response = await GET(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid relationship ID');
    });

    it('should handle relationship not found', async () => {
      mockManagerRelationshipsService.getRelationshipById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/999');
      const response = await GET(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Relationship not found');
    });

    it('should handle service errors', async () => {
      mockManagerRelationshipsService.getRelationshipById.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/1');
      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch manager relationship');
    });
  });

  describe('PUT', () => {
    it('should update relationship successfully', async () => {
      const mockUpdatedRelationship = {
        id: 1,
        managerId: 'manager2',
        subordinateId: 'subordinate1',
        periodId: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockManagerRelationshipsService.updateRelationship.mockResolvedValue(mockUpdatedRelationship);

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/1', {
        method: 'PUT',
        body: JSON.stringify({ managerId: 'manager2' })
      });
      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedRelationship);
      expect(mockManagerRelationshipsService.updateRelationship).toHaveBeenCalledWith(1, { managerId: 'manager2' });
    });

    it('should handle invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager-relationships/invalid', {
        method: 'PUT',
        body: JSON.stringify({ managerId: 'manager2' })
      });
      const response = await PUT(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid relationship ID');
    });

    it('should handle service errors', async () => {
      mockManagerRelationshipsService.updateRelationship.mockRejectedValue(new Error('Validation error'));

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/1', {
        method: 'PUT',
        body: JSON.stringify({ managerId: 'manager2' })
      });
      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to update manager relationship');
    });
  });

  describe('DELETE', () => {
    it('should delete relationship successfully', async () => {
      mockManagerRelationshipsService.deleteRelationship.mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/1', {
        method: 'DELETE'
      });
      const response = await DELETE(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Manager relationship deleted successfully');
      expect(mockManagerRelationshipsService.deleteRelationship).toHaveBeenCalledWith(1);
    });

    it('should handle invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager-relationships/invalid', {
        method: 'DELETE'
      });
      const response = await DELETE(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid relationship ID');
    });

    it('should handle service errors', async () => {
      mockManagerRelationshipsService.deleteRelationship.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/manager-relationships/1', {
        method: 'DELETE'
      });
      const response = await DELETE(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to delete manager relationship');
    });
  });
}); 