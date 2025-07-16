import { render, screen } from '@testing-library/react';
import DashboardPage from './page';

// Mock the session manager
const mockGetUser = jest.fn();
jest.mock('@/lib/session', () => ({
  sessionManager: {
    getUser: mockGetUser,
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockGetUser.mockReturnValue(null);
    
    render(<DashboardPage />);
    
    // Should show loading or redirect message
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render dashboard content for authenticated user', () => {
    mockGetUser.mockReturnValue({
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    });
    
    render(<DashboardPage />);
    
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  it('should show admin features for admin users', () => {
    mockGetUser.mockReturnValue({
      id: 'admin-user',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    
    render(<DashboardPage />);
    
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });
}); 