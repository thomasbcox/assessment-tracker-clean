import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import ProfilePage from './page';
import { sessionManager } from '@/lib/session';
import { useToast } from '@/components/ui/toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));
jest.mock('@/lib/session');
jest.mock('@/components/ui/toast');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock fetch
global.fetch = jest.fn();

describe('ProfilePage', () => {
  const mockUser = {
    id: 'user1',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockToast = {
    addToast: jest.fn(),
    toasts: [],
    removeToast: jest.fn()
  };

  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUsePathname.mockReturnValue('/dashboard/profile');
    mockUseToast.mockReturnValue(mockToast);
    mockSessionManager.getUser.mockReturnValue(mockUser);
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render profile page with user data', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('should enable editing when Edit Profile button is clicked', () => {
    render(<ProfilePage />);

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should save profile changes successfully', async () => {
    const updatedUser = { ...mockUser, firstName: 'Jane', lastName: 'Smith' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedUser
    });

    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Update form data
    fireEvent.change(screen.getByDisplayValue('John'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByDisplayValue('Doe'), { target: { value: 'Smith' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'user1@example.com'
        })
      });
    });

    expect(mockToast.addToast).toHaveBeenCalledWith({
      message: 'Profile updated successfully',
      type: 'success'
    });
  });

  it('should handle validation errors for missing required fields', async () => {
    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Clear required fields
    fireEvent.change(screen.getByDisplayValue('John'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('Doe'), { target: { value: '' } });

    // Try to save
    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockToast.addToast).toHaveBeenCalledWith({
      message: 'First name and last name are required',
      type: 'error'
    });
  });

  it('should handle validation errors for invalid email', async () => {
    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Enter invalid email
    fireEvent.change(screen.getByDisplayValue('user1@example.com'), { 
      target: { value: 'invalid-email' } 
    });

    // Try to save
    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockToast.addToast).toHaveBeenCalledWith({
      message: 'Please enter a valid email address',
      type: 'error'
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to update user' })
    });

    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockToast.addToast).toHaveBeenCalledWith({
        message: 'Failed to update user',
        type: 'error'
      });
    });
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockToast.addToast).toHaveBeenCalledWith({
        message: 'An error occurred while updating your profile',
        type: 'error'
      });
    });
  });

  it('should cancel editing and reset form data', () => {
    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Change form data
    fireEvent.change(screen.getByDisplayValue('John'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByDisplayValue('Doe'), { target: { value: 'Smith' } });

    // Cancel editing
    fireEvent.click(screen.getByText('Cancel'));

    // Form should be reset to original values
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('should show loading state when saving', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockUser
      }), 100))
    );

    render(<ProfilePage />);

    // Enable editing
    fireEvent.click(screen.getByText('Edit Profile'));

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    // Should show saving state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('should handle user not found', () => {
    mockSessionManager.getUser.mockReturnValue(null);

    render(<ProfilePage />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please log in to access the dashboard.')).toBeInTheDocument();
    expect(screen.getByText('Go to Login')).toBeInTheDocument();
  });

  it('should show member since date when available', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Member Since')).toBeInTheDocument();
    // Check that a date is displayed (format may vary by locale)
    const memberSinceElement = screen.getByText('Member Since').closest('div');
    expect(memberSinceElement).toHaveTextContent(/\d+\/\d+\/\d+/);
  });

  it('should show last login when available', () => {
    const userWithLastLogin = {
      ...mockUser,
      lastLogin: '2024-01-15T10:30:00Z'
    };
    mockSessionManager.getUser.mockReturnValue(userWithLastLogin);

    render(<ProfilePage />);

    expect(screen.getByText('Last Login')).toBeInTheDocument();
    // Check that a date/time is displayed (format may vary by locale)
    const lastLoginElement = screen.getByText('Last Login').closest('div');
    expect(lastLoginElement).toHaveTextContent(/\d+\/\d+\/\d+/);
  });
}); 