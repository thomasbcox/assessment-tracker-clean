import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LoginForm } from './login-form';

// Mock fetch
global.fetch = jest.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Assessment Tracker')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Login Link' })).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Login Link' });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should submit form with valid email', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Send Login Link' });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Check your email for a login link!')).toBeInTheDocument();
    });
  });

  it('should show error message on API error', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User not found' }),
    } as Response);

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Send Login Link' });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: async () => ({ success: true }),
    } as Response), 100)));

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Send Login Link' });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
}); 