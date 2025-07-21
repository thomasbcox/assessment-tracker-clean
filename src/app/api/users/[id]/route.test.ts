import { NextRequest } from 'next/server';
import { PUT } from './route';
import { updateUser } from '@/lib/services/users';
import { logger } from '@/lib/logger';

// Mock the service functions
jest.mock('@/lib/services/users');
jest.mock('@/lib/logger');

const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('/api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should update user with firstName and lastName successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const updateData = {
        firstName: 'John',
        lastName: 'Doe'
      };

      mockUpdateUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(mockUpdateUser).toHaveBeenCalledWith('user1', updateData);
    });

    it('should update user with firstName, lastName, and email successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: 'newemail@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newemail@example.com'
      };

      mockUpdateUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(mockUpdateUser).toHaveBeenCalledWith('user1', updateData);
    });

    it('should handle missing firstName', async () => {
      const updateData = {
        lastName: 'Doe',
        email: 'user1@example.com'
      };

      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'First name and last name are required' });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should handle missing lastName', async () => {
      const updateData = {
        firstName: 'John',
        email: 'user1@example.com'
      };

      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'First name and last name are required' });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('User not found');
      mockUpdateUser.mockRejectedValue(error);

      const updateData = {
        firstName: 'John',
        lastName: 'Doe'
      };

      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update user' });
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: 'invalid json'
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update user' });
    });

    it('should handle validation errors from service', async () => {
      const error = new Error('Invalid email format');
      mockUpdateUser.mockRejectedValue(error);

      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email'
      };

      const request = new NextRequest('http://localhost:3000/api/users/user1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { id: 'user1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update user' });
    });
  });
}); 