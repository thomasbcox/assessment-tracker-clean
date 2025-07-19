import { render, screen } from '@testing-library/react';
import { useSession } from '@/hooks/useSession';
import AssessmentPage from './page';

// Mock the hooks and modules
jest.mock('@/hooks/useSession');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useParams: jest.fn(() => ({
    id: '1',
  })),
}));

jest.mock('@/components/dashboard/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('AssessmentPage', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner when session is loading', () => {
    mockUseSession.mockReturnValue({
      session: null,
      loading: true,
    });

    render(<AssessmentPage />);
    
    // Should show loading spinner (look for the spinner element with the specific class)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('redirects to login when no session', () => {
    mockUseSession.mockReturnValue({
      session: null,
      loading: false,
    });

    const mockPush = jest.fn();
    const mockUseRouter = require('next/navigation').useRouter as jest.Mock;
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });

    render(<AssessmentPage />);
    
    // Should redirect to login page
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows loading state when session exists but data is loading', () => {
    mockUseSession.mockReturnValue({
      session: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
        expiresAt: Date.now() + 3600000,
        token: 'test-token',
      },
      loading: false,
    });

    // Mock fetch to return empty data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<AssessmentPage />);
    
    // Should show loading spinner initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
}); 