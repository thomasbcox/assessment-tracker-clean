import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge Component', () => {
  it('should render with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold', 'bg-primary', 'text-primary-foreground');
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
    expect(badge).toHaveClass('text-foreground');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom Badge</Badge>);
    
    const badge = screen.getByText('Custom Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('custom-badge');
  });

  it('should handle empty content', () => {
    render(<Badge data-testid="empty-badge"></Badge>);
    
    const badge = screen.getByTestId('empty-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('');
  });

  it('should render with different content types', () => {
    render(
      <Badge data-testid="complex-badge">
        <strong>Bold</strong> and <em>italic</em> text
      </Badge>
    );
    
    const badge = screen.getByTestId('complex-badge');
    const boldText = screen.getByText('Bold');
    const italicText = screen.getByText('italic');
    
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Bold and italic text');
    expect(boldText).toBeInTheDocument();
    expect(italicText).toBeInTheDocument();
    expect(boldText.tagName).toBe('STRONG');
    expect(italicText.tagName).toBe('EM');
  });

  it('should forward ref correctly', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Ref Badge</Badge>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should handle all HTML attributes', () => {
    render(
      <Badge 
        id="test-badge"
        data-testid="test-badge"
        aria-label="Test badge"
        title="Test badge tooltip"
      >
        Attribute Badge
      </Badge>
    );
    
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('id', 'test-badge');
    expect(badge).toHaveAttribute('aria-label', 'Test badge');
    expect(badge).toHaveAttribute('title', 'Test badge tooltip');
  });
}); 