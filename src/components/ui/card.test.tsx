import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card', () => {
  it('should render card with content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  it('should render card with custom className', () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    );

    const card = screen.getByText('Content').closest('[class*="custom-card"]');
    expect(card).toHaveClass('custom-card');
  });

  it('should render card header with title and description', () => {
    render(
      <CardHeader>
        <CardTitle>Header Title</CardTitle>
        <CardDescription>Header Description</CardDescription>
      </CardHeader>
    );

    expect(screen.getByText('Header Title')).toBeInTheDocument();
    expect(screen.getByText('Header Description')).toBeInTheDocument();
  });

  it('should render card content', () => {
    render(<CardContent>Card Content</CardContent>);

    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should render card footer', () => {
    render(<CardFooter>Card Footer</CardFooter>);

    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
}); 