import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge Component', () => {
  it('should render with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'px-2.5', 'py-0.5', 'text-xs', 'font-medium', 'bg-primary', 'text-primary-foreground');
  });

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('should render with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-foreground', 'border', 'border-input');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('should render with children content', () => {
    render(
      <Badge>
        <span>Icon</span>
        Badge with Icon
      </Badge>
    );
    
    const badge = screen.getByText('Badge with Icon');
    const icon = screen.getByText('Icon');
    
    expect(badge).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it('should forward ref correctly', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Ref Badge</Badge>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should handle empty content', () => {
    render(<Badge></Badge>);
    
    const badge = screen.getByRole('generic');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('');
  });

  it('should render with different content types', () => {
    render(
      <Badge>
        <strong>Bold</strong> and <em>italic</em> text
      </Badge>
    );
    
    const badge = screen.getByText(/Bold and italic text/);
    const boldText = screen.getByText('Bold');
    const italicText = screen.getByText('italic');
    
    expect(badge).toBeInTheDocument();
    expect(boldText.tagName).toBe('STRONG');
    expect(italicText.tagName).toBe('EM');
  });
}); 