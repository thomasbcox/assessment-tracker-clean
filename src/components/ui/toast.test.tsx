import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from './toast';

// Test component that uses the toast hook
function TestToastComponent() {
  const { addToast, removeToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast({ message: 'Success message', type: 'success' })}>
        Add Success Toast
      </button>
      <button onClick={() => addToast({ message: 'Error message', type: 'error' })}>
        Add Error Toast
      </button>
      <button onClick={() => addToast({ message: 'Info message', type: 'info' })}>
        Add Info Toast
      </button>
      <button onClick={() => addToast({ message: 'Warning message', type: 'warning' })}>
        Add Warning Toast
      </button>
      <button onClick={() => addToast({ message: 'Custom duration', type: 'success', duration: 1000 })}>
        Add Custom Duration Toast
      </button>
      <button onClick={() => removeToast('test-id')}>
        Remove Toast
      </button>
    </div>
  );
}

// Wrapper component for testing
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('renders children without crashing', () => {
      render(
        <TestWrapper>
          <div data-testid="test-child">Test Child</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('provides toast context to children', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      expect(screen.getByText('Add Success Toast')).toBeInTheDocument();
    });
  });

  describe('useToast hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestToastComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });

    it('adds toast when addToast is called', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('adds multiple toasts', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      fireEvent.click(screen.getByText('Add Error Toast'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('removes toast when removeToast is called', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      expect(screen.getByText('Success message')).toBeInTheDocument();

      // Find and click the close button (it has no accessible name, so we find it by its SVG content)
      const toastContainer = screen.getByText('Success message').closest('div')?.parentElement;
      const closeButton = toastContainer?.querySelector('button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  describe('Toast styling', () => {
    it('applies correct styles for success toast', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      const toast = screen.getByText('Success message').closest('div')?.parentElement?.parentElement;
      
      expect(toast).toHaveClass('bg-green-50', 'border-green-400', 'text-green-800');
    });

    it('applies correct styles for error toast', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Error Toast'));
      const toast = screen.getByText('Error message').closest('div')?.parentElement?.parentElement;
      
      expect(toast).toHaveClass('bg-red-50', 'border-red-400', 'text-red-800');
    });

    it('applies correct styles for info toast', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Info Toast'));
      const toast = screen.getByText('Info message').closest('div')?.parentElement?.parentElement;
      
      expect(toast).toHaveClass('bg-blue-50', 'border-blue-400', 'text-blue-800');
    });

    it('applies correct styles for warning toast', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Warning Toast'));
      const toast = screen.getByText('Warning message').closest('div')?.parentElement?.parentElement;
      
      expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
    });
  });

  describe('Toast auto-removal', () => {
    it('auto-removes toast after default duration', async () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      expect(screen.getByText('Success message')).toBeInTheDocument();

      // Fast-forward time by default duration (5000ms)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });

    it('auto-removes toast after custom duration', async () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Custom Duration Toast'));
      expect(screen.getByText('Custom duration')).toBeInTheDocument();

      // Fast-forward time by custom duration (1000ms)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
      });
    });

    it('does not auto-remove toast before duration expires', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      expect(screen.getByText('Success message')).toBeInTheDocument();

      // Fast-forward time by less than duration (3000ms)
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  describe('Toast positioning and layout', () => {
    it('renders toast container with correct positioning', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      
      const toastContainer = screen.getByText('Success message').closest('div')?.parentElement?.parentElement;
      const parentContainer = toastContainer?.parentElement;
      
      expect(parentContainer).toHaveClass('fixed', 'top-4', 'right-4', 'z-95');
    });

    it('renders close button with correct accessibility', () => {
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Success Toast'));
      
      const toastContainer = screen.getByText('Success message').closest('div')?.parentElement;
      const closeButton = toastContainer?.querySelector('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('text-gray-400', 'hover:text-gray-600');
    });
  });

  describe('Toast ID generation', () => {
    it('generates unique IDs for each toast', () => {
      const { rerender } = render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      // Mock Math.random to return predictable values
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValueOnce(0.1); // This will generate a specific ID
      mockRandom.mockReturnValueOnce(0.2); // This will generate a different ID

      fireEvent.click(screen.getByText('Add Success Toast'));
      fireEvent.click(screen.getByText('Add Error Toast'));

      // Both toasts should be present with different IDs
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();

      mockRandom.mockRestore();
    });
  });
}); 