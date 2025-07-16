import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Card className="custom-card">Content</Card>);
      expect(screen.getByText('Content').parentElement).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('should render card header with children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);
      expect(screen.getByText('Header')).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('should render card title with children', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render card description with children', () => {
      render(<CardDescription>Card description</CardDescription>);
      expect(screen.getByText('Card description')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CardDescription className="custom-description">Description</CardDescription>);
      expect(screen.getByText('Description')).toHaveClass('custom-description');
    });
  });

  describe('CardContent', () => {
    it('should render card content with children', () => {
      render(<CardContent>Card content</CardContent>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      expect(screen.getByText('Content')).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer with children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);
      expect(screen.getByText('Footer')).toHaveClass('custom-footer');
    });
  });

  describe('Card Composition', () => {
    it('should render complete card structure', () => {
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

    it('should maintain proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Test Title');
    });
  });
}); 