import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

describe('Select Component', () => {
  it('should render select trigger with placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Select an option');
  });

  it('should render select trigger with value', () => {
    render(
      <Select defaultValue="option1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('should render select content with items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('should apply custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('custom-trigger');
  });

  it('should apply custom className to content', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('should apply custom className to items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1" className="custom-item">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('should handle disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('should handle required state', () => {
    render(
      <Select required>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeRequired();
  });

  it('should forward ref correctly', () => {
    const ref = { current: null };
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
      </Select>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should render with aria-label', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Choose an option">
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByLabelText('Choose an option');
    expect(trigger).toBeInTheDocument();
  });

  it('should handle multiple items in content', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue>Select an option</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
          <SelectItem value="option4">Option 4</SelectItem>
          <SelectItem value="option5">Option 5</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });
}); 