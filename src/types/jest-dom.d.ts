import '@testing-library/jest-dom';

declare module '@jest/expect' {
  interface Matchers<R extends void | Promise<void>> {
    toBeInTheDocument(): R;
    toHaveClass(className: string, ...classNames: string[]): R;
    toHaveAttribute(attr: string, value?: string): R;
    toBeDisabled(): R;
    toBeRequired(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveValue(value: string | string[] | number): R;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
    toHaveFormValues(expectedValues: Record<string, any>): R;
    toHaveAccessibleName(name: string | RegExp): R;
    toHaveAccessibleDescription(description: string | RegExp): R;
  }
} 