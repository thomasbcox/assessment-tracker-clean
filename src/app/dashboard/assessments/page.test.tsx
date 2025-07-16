import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssessmentsPage from './page';
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

describe('AssessmentsPage', () => {
  const mockUser = {
    id: 'user1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
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
      assignedTo: 'user@example.com',
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
      assignedTo: 'user@example.com',
      dueDate: '2024-03-31',
      periodName: 'Q1 2024',
      templateId: 2,
    },
    {
      id: '3',
      title: 'Strategic Assessment',
      description: 'Strategic thinking evaluation',
      status: 'pending' as const,
      createdAt: '2024-01-17T11:00:00Z',
      updatedAt: '2024-01-17T11:00:00Z',
      assignedTo: 'user@example.com',
      dueDate: '2024-03-31',
      periodName: 'Q1 2024',
      templateId: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should show loading state initially', () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AssessmentsPage />);

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should fetch and display assessments for authenticated user', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessments,
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user1/assessments');
    });

    await waitFor(() => {
      expect(screen.getByText('Assessments')).toBeInTheDocument();
      expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
      expect(screen.getByText('Team Assessment')).toBeInTheDocument();
      expect(screen.getByText('Strategic Assessment')).toBeInTheDocument();
    });
  });

  it('should show authentication required message for unauthenticated user', () => {
    mockSessionManager.getUser.mockReturnValue(null);

    render(<AssessmentsPage />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please log in to access assessments.')).toBeInTheDocument();
    expect(screen.getByText('Go to Login')).toBeInTheDocument();
  });

  it('should handle API error gracefully', async () => {
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

  it('should handle network error gracefully', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching assessments:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should filter assessments by status', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessments,
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
      expect(screen.getByText('Team Assessment')).toBeInTheDocument();
      expect(screen.getByText('Strategic Assessment')).toBeInTheDocument();
    });

    // Click on "Completed" filter
    fireEvent.click(screen.getByText('Completed'));

    await waitFor(() => {
      expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Team Assessment')).not.toBeInTheDocument();
      expect(screen.queryByText('Strategic Assessment')).not.toBeInTheDocument();
    });

    // Click on "Active" filter
    fireEvent.click(screen.getByText('Active'));

    await waitFor(() => {
      expect(screen.queryByText('Leadership Assessment')).not.toBeInTheDocument();
      expect(screen.getByText('Team Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Strategic Assessment')).not.toBeInTheDocument();
    });
  });

  it('should show empty state when no assessments match filter', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessments,
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
    });

    // Click on "Archived" filter (no archived assessments)
    fireEvent.click(screen.getByText('Archived'));

    await waitFor(() => {
      expect(screen.getByText('No assessments found')).toBeInTheDocument();
      expect(screen.getByText('No archived assessments found')).toBeInTheDocument();
    });
  });

  it('should show empty state when user has no assessments', async () => {
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

  it('should display assessment details correctly', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAssessments[0]],
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Leadership Assessment')).toBeInTheDocument();
      expect(screen.getByText('Leadership skills evaluation')).toBeInTheDocument();
      expect(screen.getByText('Period: Q1 2024')).toBeInTheDocument();
      expect(screen.getByText('Due: 3/31/2024')).toBeInTheDocument();
      expect(screen.getByText('Created: 1/15/2024')).toBeInTheDocument();
    });
  });

  it('should show correct status badges with proper colors', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessments,
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      const completedBadge = screen.getByText('completed');
      const activeBadge = screen.getByText('active');
      const pendingBadge = screen.getByText('pending');

      expect(completedBadge).toHaveClass('bg-brand-dark-teal');
      expect(activeBadge).toHaveClass('bg-brand-vibrant-teal');
      expect(pendingBadge).toHaveClass('bg-yellow-500');
    });
  });

  it('should show create assessment modal when button is clicked', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessments,
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Assessment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Assessment'));

    await waitFor(() => {
      expect(screen.getByText('Create Assessment')).toBeInTheDocument(); // Modal title
      expect(screen.getByLabelText('Assessment Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
    });
  });

  it('should close create assessment modal when cancel is clicked', async () => {
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssessments,
    });

    render(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Assessment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Assessment'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Assessment Title')).not.toBeInTheDocument();
    });
  });
}); 