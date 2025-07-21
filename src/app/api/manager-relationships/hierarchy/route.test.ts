import { NextRequest } from 'next/server';
import { GET } from './route';
import { getRelationshipHierarchy } from '@/lib/services/manager-relationships';
import { logger } from '@/lib/logger';

// Mock the service functions
jest.mock('@/lib/services/manager-relationships');
jest.mock('@/lib/logger');

const mockGetRelationshipHierarchy = getRelationshipHierarchy as jest.MockedFunction<typeof getRelationshipHierarchy>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('/api/manager-relationships/hierarchy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return relationship hierarchy successfully', async () => {
      const mockHierarchy = {
        manager: {
          id: 1,
          managerId: 'top-manager',
          subordinateId: 'manager1',
          periodId: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        subordinates: [
          {
            id: 2,
            managerId: 'manager1',
            subordinateId: 'subordinate1',
            periodId: 1,
            createdAt: '2024-01-02T00:00:00Z'
          },
          {
            id: 3,
            managerId: 'manager1',
            subordinateId: 'subordinate2',
            periodId: 1,
            createdAt: '2024-01-03T00:00:00Z'
          }
        ]
      };

      mockGetRelationshipHierarchy.mockResolvedValue(mockHierarchy);

      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=manager1&periodId=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockHierarchy);
      expect(mockGetRelationshipHierarchy).toHaveBeenCalledWith('manager1', 1);
    });

    it('should return hierarchy with no manager (top level)', async () => {
      const mockHierarchy = {
        manager: null,
        subordinates: [
          {
            id: 1,
            managerId: 'manager1',
            subordinateId: 'subordinate1',
            periodId: 1,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      };

      mockGetRelationshipHierarchy.mockResolvedValue(mockHierarchy);

      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=manager1&periodId=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockHierarchy);
      expect(data.manager).toBeNull();
      expect(data.subordinates).toHaveLength(1);
    });

    it('should return hierarchy with no subordinates', async () => {
      const mockHierarchy = {
        manager: {
          id: 1,
          managerId: 'top-manager',
          subordinateId: 'manager1',
          periodId: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        subordinates: []
      };

      mockGetRelationshipHierarchy.mockResolvedValue(mockHierarchy);

      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=manager1&periodId=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockHierarchy);
      expect(data.subordinates).toHaveLength(0);
    });

    it('should handle missing managerId parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?periodId=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Manager ID and period ID are required' });
      expect(mockGetRelationshipHierarchy).not.toHaveBeenCalled();
    });

    it('should handle missing periodId parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=manager1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Manager ID and period ID are required' });
      expect(mockGetRelationshipHierarchy).not.toHaveBeenCalled();
    });

    it('should handle invalid periodId parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=manager1&periodId=invalid'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Manager ID and period ID are required' });
      expect(mockGetRelationshipHierarchy).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockGetRelationshipHierarchy.mockRejectedValue(error);

      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=manager1&periodId=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch relationship hierarchy' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch relationship hierarchy',
        error
      );
    });

    it('should handle manager not found', async () => {
      const error = new Error('Manager not found');
      mockGetRelationshipHierarchy.mockRejectedValue(error);

      const request = new NextRequest(
        'http://localhost:3000/api/manager-relationships/hierarchy?managerId=nonexistent&periodId=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch relationship hierarchy' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch relationship hierarchy',
        error
      );
    });
  });
}); 