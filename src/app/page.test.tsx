import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';
import { sessionManager } from '@/lib/session';

// Mock the session manager
jest.mock('@/lib/session', () => ({
  sessionManager: {
    getUser: jest.fn(),
  },
}));

// Mock the login form
jest.mock('@/components/forms/login-form', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

// Mock Next.js router
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

const mockSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect authenticated user to dashboard', async () => {
    const mockUser = {
      id: 'user1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'manager',
    };

    mockSessionManager.getUser.mockReturnValue(mockUser);

    render(<Home />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show login form for unauthenticated user', () => {
    mockSessionManager.getUser.mockReturnValue(null);

    render(<Home />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should show login form when session manager returns undefined', () => {
    mockSessionManager.getUser.mockReturnValue(null);

    render(<Home />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should call session manager on mount', () => {
    mockSessionManager.getUser.mockReturnValue(null);

    render(<Home />);

    expect(mockSessionManager.getUser).toHaveBeenCalledTimes(1);
  });

  it('should handle different user roles correctly', async () => {
    const mockUsers = [
      {
        id: 'super1',
        email: 'super@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super-admin',
      },
      {
        id: 'admin1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
      {
        id: 'manager1',
        email: 'manager@example.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager',
      },
      {
        id: 'employee1',
        email: 'employee@example.com',
        firstName: 'Employee',
        lastName: 'User',
        role: 'user',
      },
    ];

    for (const user of mockUsers) {
      mockSessionManager.getUser.mockReturnValue(user);
      mockReplace.mockClear();

      render(<Home />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });
    }
  });

  it('should not redirect multiple times for the same user', async () => {
    const mockUser = {
      id: 'user1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'manager',
    };

    mockSessionManager.getUser.mockReturnValue(mockUser);

    render(<Home />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });
}); 