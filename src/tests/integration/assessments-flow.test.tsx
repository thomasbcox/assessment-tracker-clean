import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/[id]/assessments/route';
import AssessmentsPage from '@/app/dashboard/assessments/page';
import { sessionManager } from '@/lib/session';

// Mock the session manager
jest.mock('@/lib/session', () => ({
  sessionManager: {
    getUser: jest.fn(),
  },
}));

// Mock the dashboard layout
jest.mock('@/components/dashboard/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;

describe('Assessments Integration Flow', () => {
  const mockUser = {
    id: 'integration-test-user',
    email: 'integration-test@example.com',
    firstName: 'Integration',
    lastName: 'Test',
    role: 'manager',
  };

  const mockAssessments = [
    {
      id: '1',
      title: 'Leadership Assessment',
      description: 'Leadership skills evaluation',
      status: 'completed' as const,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      assignedTo: 'integration-test@example.com',
      dueDate: '2024-03-31',
      periodName: 'Q1 2024',
      templateId: 1,
    },
    {
      id: '2',
      title: 'Team Assessment',
      description: 'Team collaboration evaluation',
      status: 'active' as const,
      createdAt: '2024-01-16T09:00:00Z',
      updatedAt: '2024-01-16T09:00:00Z',
      assignedTo: 'integration-test@example.com',
      dueDate: '2024-03-31',
      periodName: 'Q1 2024',
      templateId: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('API Integration', () => {
    it('should return proper assessment data structure from API', async () => {
      // Mock the database response
      const mockDbResponse = [
        {
          id: 1,
          userId: 'integration-test-user',
          periodId: 1,
          templateId: 1,
          status: 'completed',
          completedAt: '2024-01-20T14:30:00Z',
          createdAt: '2024-01-15T10:00:00Z',
          periodName: 'Q1 2024',
          periodStartDate: '2024-01-01',
          periodEndDate: '2024-03-31',
          userEmail: 'integration-test@example.com',
          userFirstName: 'Integration',
          userLastName: 'Test',
          templateName: 'Leadership Assessment',
          templateDescription: 'Leadership skills evaluation',
        },
      ];

      // Mock the database
      const mockDb = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue(mockDbResponse),
              }),
            }),
          }),
        }),
      };

      // Mock the database module
      jest.doMock('@/lib/db', () => ({
        db: mockDb,
        assessmentInstances: { id: 'id', userId: 'userId', periodId: 'periodId', templateId: 'templateId', status: 'status', completedAt: 'completedAt', createdAt: 'createdAt' },
        assessmentPeriods: { id: 'id', name: 'name', startDate: 'startDate', endDate: 'endDate' },
        users: { id: 'id', email: 'email', firstName: 'firstName', lastName: 'lastName' },
        assessmentTemplates: { id: 'id', name: 'name', description: 'description' },
      }));

      const request = new NextRequest('http://localhost:3000/api/users/integration-test-user/assessments');
      const response = await GET(request, { params: Promise.resolve({ id: 'integration-test-user' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual({
        id: '1',
        title: 'Leadership Assessment',
        description: 'Leadership skills evaluation',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        assignedTo: 'integration-test@example.com',
        dueDate: '2024-03-31',
        periodName: 'Q1 2024',
        templateId: 1,
      });
    });
  });

  describe('UI Integration', () => {
    it('should fetch and display assessments from API', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssessments,
      });

      render(<AssessmentsPage />);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/integration-test-user/assessments');
      });

      // Verify UI displays data
      await waitFor(() => {
        expect(screen.getByText('Assessments')).toBeInTheDocument();
        expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
        expect(screen.getByText('Team Assessment')).toBeInTheDocument();
        expect(screen.getByText('Leadership skills evaluation')).toBeInTheDocument();
        expect(screen.getByText('Team collaboration evaluation')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully in UI', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AssessmentsPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch assessments:', 'Internal Server Error');
      });

      consoleSpy.mockRestore();
    });

    it('should filter assessments correctly in UI', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssessments,
      });

      render(<AssessmentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
        expect(screen.getByText('Team Assessment')).toBeInTheDocument();
      });

      // Filter by completed status
      fireEvent.click(screen.getByText('Completed'));

      await waitFor(() => {
        expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
        expect(screen.queryByText('Team Assessment')).not.toBeInTheDocument();
      });

      // Filter by active status
      fireEvent.click(screen.getByText('Active'));

      await waitFor(() => {
        expect(screen.queryByText('Leadership Assessment')).not.toBeInTheDocument();
        expect(screen.getByText('Team Assessment')).toBeInTheDocument();
      });
    });

    it('should show correct status badges with proper styling', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssessments,
      });

      render(<AssessmentsPage />);

      await waitFor(() => {
        const completedBadge = screen.getByText('completed');
        const activeBadge = screen.getByText('active');

        expect(completedBadge).toHaveClass('bg-brand-dark-teal');
        expect(activeBadge).toHaveClass('bg-brand-vibrant-teal');
      });
    });

    it('should display assessment metadata correctly', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAssessments[0]],
      });

      render(<AssessmentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Period: Q1 2024')).toBeInTheDocument();
        expect(screen.getByText('Due: 3/31/2024')).toBeInTheDocument();
        expect(screen.getByText('Created: 1/15/2024')).toBeInTheDocument();
      });
    });

    it('should handle empty assessment list', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<AssessmentsPage />);

      await waitFor(() => {
        expect(screen.getByText('No assessments found')).toBeInTheDocument();
        expect(screen.getByText('Create your first assessment to get started')).toBeInTheDocument();
      });
    });

    it('should show authentication required for unauthenticated users', () => {
      mockSessionManager.getUser.mockReturnValue(null);

      render(<AssessmentsPage />);

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access assessments.')).toBeInTheDocument();
      expect(screen.getByText('Go to Login')).toBeInTheDocument();
    });
  });

  describe('End-to-End Flow', () => {
    it('should handle complete user journey from authentication to assessment viewing', async () => {
      // Simulate user authentication
      mockSessionManager.getUser.mockReturnValue(mockUser);

      // Simulate successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssessments,
      });

      render(<AssessmentsPage />);

      // Verify loading state
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();

      // Verify API call is made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/integration-test-user/assessments');
      });

      // Verify assessments are displayed
      await waitFor(() => {
        expect(screen.getByText('Assessments')).toBeInTheDocument();
        expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
        expect(screen.getByText('Team Assessment')).toBeInTheDocument();
      });

      // Verify assessment details are shown
      expect(screen.getByText('Leadership skills evaluation')).toBeInTheDocument();
      expect(screen.getByText('Team collaboration evaluation')).toBeInTheDocument();
      expect(screen.getByText('Period: Q1 2024')).toBeInTheDocument();

      // Verify status badges
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();

      // Verify action buttons are present
      expect(screen.getAllByText('View Details')).toHaveLength(2);
      expect(screen.getAllByText('Edit')).toHaveLength(2);
    });

    it('should handle network failures gracefully', async () => {
      mockSessionManager.getUser.mockReturnValue(mockUser);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AssessmentsPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching assessments:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
}); 