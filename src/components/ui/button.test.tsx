import { describe, it, expect, vi } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Custom Button' });
      expect(button).toHaveClass('custom-class');
    });

    it('should render disabled button', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button>Default Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Default Button' });
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Secondary Button' });
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900', 'hover:bg-gray-200');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Destructive Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Destructive Button' });
      expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Outline Button' });
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-gray-50', 'hover:bg-gray-100', 'text-gray-700');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Ghost Button' });
      expect(button).toHaveClass('hover:bg-gray-100', 'text-gray-700');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Link Button' });
      expect(button).toHaveClass('text-blue-600', 'underline-offset-4', 'hover:underline');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button>Default Size</Button>);
      
      const button = screen.getByRole('button', { name: 'Default Size' });
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('should render sm size', () => {
      render(<Button size="sm">Small Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Small Button' });
      expect(button).toHaveClass('h-9', 'rounded-md', 'px-3');
    });

    it('should render lg size', () => {
      render(<Button size="lg">Large Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Large Button' });
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-8');
    });

    it('should render icon size', () => {
      render(<Button size="icon">Icon Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Icon Button' });
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Clickable Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Clickable Button' });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Disabled Button' });
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should support custom aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Custom label' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Children', () => {
    it('should render text children', () => {
      render(<Button>Simple Text</Button>);
      
      const button = screen.getByRole('button', { name: 'Simple Text' });
      expect(button).toHaveTextContent('Simple Text');
    });

    it('should render complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('IconText');
    });

    it('should render empty children', () => {
      render(<Button></Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });
  });
}); 