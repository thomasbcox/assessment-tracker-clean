import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialogProvider, useConfirmDialog } from './confirm-dialog';

// Test component that uses the confirm dialog hook
function TestConfirmComponent() {
  const { showConfirm } = useConfirmDialog();

  const handleBasicConfirm = async () => {
    const result = await showConfirm({
      title: 'Basic Confirm',
      message: 'Are you sure?'
    });
    // In a real component, you would handle the result
    console.log('Basic confirm result:', result);
  };

  const handleDangerConfirm = async () => {
    const result = await showConfirm({
      title: 'Danger Confirm',
      message: 'This action cannot be undone',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    console.log('Danger confirm result:', result);
  };

  const handleWarningConfirm = async () => {
    const result = await showConfirm({
      title: 'Warning Confirm',
      message: 'This might have consequences',
      confirmText: 'Proceed',
      cancelText: 'Go Back',
      variant: 'warning'
    });
    console.log('Warning confirm result:', result);
  };

  const handleInfoConfirm = async () => {
    const result = await showConfirm({
      title: 'Info Confirm',
      message: 'Please confirm this action',
      confirmText: 'OK',
      cancelText: 'Cancel',
      variant: 'info'
    });
    console.log('Info confirm result:', result);
  };

  return (
    <div>
      <button onClick={handleBasicConfirm}>Show Basic Confirm</button>
      <button onClick={handleDangerConfirm}>Show Danger Confirm</button>
      <button onClick={handleWarningConfirm}>Show Warning Confirm</button>
      <button onClick={handleInfoConfirm}>Show Info Confirm</button>
    </div>
  );
}

// Wrapper component for testing
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ConfirmDialogProvider>{children}</ConfirmDialogProvider>;
}

describe('Confirm Dialog Component', () => {
  describe('ConfirmDialogProvider', () => {
    it('renders children without crashing', () => {
      render(
        <TestWrapper>
          <div data-testid="test-child">Test Child</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('provides confirm dialog context to children', () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      expect(screen.getByText('Show Basic Confirm')).toBeInTheDocument();
    });
  });

  describe('useConfirmDialog hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConfirmComponent />);
      }).toThrow('useConfirmDialog must be used within a ConfirmDialogProvider');

      consoleSpy.mockRestore();
    });

    it('shows dialog when showConfirm is called', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Basic Confirm')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      });
    });

    it('returns true when confirm button is clicked', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Basic Confirm')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Basic confirm result:', true);
      });

      consoleSpy.mockRestore();
    });

    it('returns false when cancel button is clicked', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Basic Confirm')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Basic confirm result:', false);
      });

      consoleSpy.mockRestore();
    });

    it('hides dialog after button click', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Basic Confirm')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.queryByText('Basic Confirm')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog variants', () => {
    it('renders danger variant with correct styling', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Danger Confirm'));

      await waitFor(() => {
        const title = screen.getByText('Danger Confirm');
        expect(title).toHaveClass('text-red-600');
        
        const confirmButton = screen.getByText('Delete');
        expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700');
      });
    });

    it('renders warning variant with correct styling', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Warning Confirm'));

      await waitFor(() => {
        const title = screen.getByText('Warning Confirm');
        expect(title).toHaveClass('text-yellow-600');
        
        const confirmButton = screen.getByText('Proceed');
        expect(confirmButton).toHaveClass('bg-yellow-600', 'hover:bg-yellow-700');
      });
    });

    it('renders info variant with correct styling', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Info Confirm'));

      await waitFor(() => {
        const title = screen.getByText('Info Confirm');
        expect(title).toHaveClass('text-gray-900');
        
        const confirmButton = screen.getByText('OK');
        expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
      });
    });
  });

  describe('Dialog icons', () => {
    it('shows warning icon for danger variant', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Danger Confirm'));

      await waitFor(() => {
        const icon = screen.getByText('Danger Confirm').querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('w-5', 'h-5', 'text-red-600');
      });
    });

    it('shows warning icon for warning variant', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Warning Confirm'));

      await waitFor(() => {
        const icon = screen.getByText('Warning Confirm').querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('w-5', 'h-5', 'text-yellow-600');
      });
    });

    it('does not show icon for info variant', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Info Confirm'));

      await waitFor(() => {
        const title = screen.getByText('Info Confirm');
        const icon = title.querySelector('svg');
        expect(icon).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom button text', () => {
    it('uses custom confirm and cancel text', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Danger Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('uses default text when not provided', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Confirm')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog positioning and layout', () => {
    it('renders modal overlay with backdrop', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        const card = screen.getByText('Basic Confirm').closest('div')?.parentElement;
        const modalContainer = card?.parentElement;
        
        expect(modalContainer).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
      });
    });

    it('renders card with correct styling', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        const card = screen.getByText('Basic Confirm').closest('div')?.parentElement;
        expect(card).toHaveClass('w-full', 'max-w-md');
      });
    });

    it('renders buttons with correct layout', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm');
        const cancelButton = screen.getByText('Cancel');
        
        expect(confirmButton).toHaveClass('flex-1', 'sm:flex-none');
        expect(cancelButton).toHaveClass('flex-1', 'sm:flex-none');
      });
    });
  });

  describe('Accessibility', () => {
    it('renders buttons with proper roles', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        
        expect(confirmButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();
      });
    });

    it('renders title and description with proper semantics', async () => {
      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Show Basic Confirm'));

      await waitFor(() => {
        const title = screen.getByText('Basic Confirm');
        const description = screen.getByText('Are you sure?');
        
        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();
      });
    });
  });

  describe('Multiple dialogs', () => {
    it('handles multiple dialog calls correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TestConfirmComponent />
        </TestWrapper>
      );

      // Show first dialog
      fireEvent.click(screen.getByText('Show Basic Confirm'));
      await waitFor(() => {
        expect(screen.getByText('Basic Confirm')).toBeInTheDocument();
      });

      // Confirm first dialog
      fireEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.queryByText('Basic Confirm')).not.toBeInTheDocument();
      });

      // Show second dialog
      fireEvent.click(screen.getByText('Show Danger Confirm'));
      await waitFor(() => {
        expect(screen.getByText('Danger Confirm')).toBeInTheDocument();
      });

      // Cancel second dialog
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Danger Confirm')).not.toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Basic confirm result:', true);
      expect(consoleSpy).toHaveBeenCalledWith('Danger confirm result:', false);

      consoleSpy.mockRestore();
    });
  });
}); 