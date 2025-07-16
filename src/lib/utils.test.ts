import { cn } from './utils';

describe('Utility Functions', () => {
  describe('cn function (class name utility)', () => {
    it('should combine class names correctly', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toBe('base-class conditional-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'valid-class', '');
      expect(result).toBe('base-class valid-class');
    });

    it('should handle objects with boolean values', () => {
      const result = cn('base-class', {
        'conditional-true': true,
        'conditional-false': false,
        'conditional-undefined': undefined,
      });
      expect(result).toBe('base-class conditional-true');
    });

    it('should handle arrays', () => {
      const result = cn('base-class', ['array-class1', 'array-class2']);
      expect(result).toBe('base-class array-class1 array-class2');
    });

    it('should handle nested arrays', () => {
      const result = cn('base-class', [['nested1', 'nested2'], 'outer']);
      expect(result).toBe('base-class nested1 nested2 outer');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        'string-class',
        true && 'conditional-class',
        { 'object-class': true, 'hidden-class': false },
        ['array-class1', 'array-class2'],
        undefined,
        null,
        ''
      );
      expect(result).toBe('base-class string-class conditional-class object-class array-class1 array-class2');
    });

    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle single argument', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('should handle complex conditional logic', () => {
      const isActive = true;
      const isDisabled = false;
      const theme = 'dark';
      
      const result = cn(
        'base-button',
        isActive && 'active',
        isDisabled && 'disabled',
        theme === 'dark' && 'dark-theme'
      );
      
      expect(result).toBe('base-button active dark-theme');
    });

    it('should handle Tailwind CSS classes correctly', () => {
      const result = cn(
        'flex items-center justify-center',
        'px-4 py-2 rounded-md',
        'bg-blue-500 hover:bg-blue-600',
        'text-white font-medium'
      );
      
      expect(result).toBe('flex items-center justify-center px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium');
    });

    it('should handle conflicting classes gracefully', () => {
      const result = cn('text-red-500', 'text-blue-500', 'text-green-500');
      expect(result).toBe('text-green-500'); // tailwind-merge keeps the last conflicting class
    });

    // Enhanced tests for tailwind-merge functionality
    it('should merge conflicting Tailwind classes correctly', () => {
      const result = cn('text-red-500', 'text-blue-500');
      // tailwind-merge should resolve conflicts by keeping the last one
      expect(result).toBe('text-blue-500');
    });

    it('should handle responsive and state variants', () => {
      const result = cn(
        'text-sm',
        'md:text-base',
        'lg:text-lg',
        'hover:text-blue-500',
        'focus:text-blue-600',
        'active:text-blue-700'
      );
      expect(result).toBe('text-sm md:text-base lg:text-lg hover:text-blue-500 focus:text-blue-600 active:text-blue-700');
    });

    it('should handle complex conditional objects', () => {
      const isPrimary = true;
      const isLarge = false;
      const isDisabled = false;
      
      const result = cn('base-button', {
        'bg-blue-500 text-white': isPrimary,
        'bg-gray-500 text-gray-300': !isPrimary,
        'px-6 py-3 text-lg': isLarge,
        'px-4 py-2 text-base': !isLarge,
        'opacity-50 cursor-not-allowed': isDisabled,
        'hover:bg-blue-600 active:bg-blue-700': isPrimary && !isDisabled,
      });
      
      expect(result).toBe('base-button bg-blue-500 text-white px-4 py-2 text-base hover:bg-blue-600 active:bg-blue-700');
    });

    it('should handle function calls that return classes', () => {
      const getSizeClass = (size: 'sm' | 'md' | 'lg') => {
        switch (size) {
          case 'sm': return 'px-2 py-1 text-sm';
          case 'md': return 'px-4 py-2 text-base';
          case 'lg': return 'px-6 py-3 text-lg';
        }
      };
      
      const result = cn('button', getSizeClass('md'), 'rounded-md');
      expect(result).toBe('button px-4 py-2 text-base rounded-md');
    });

    it('should handle deeply nested arrays and objects', () => {
      const result = cn(
        'base',
        [
          'array1',
          ['nested1', 'nested2'],
          { 'obj1': true, 'obj2': false }
        ],
        {
          'obj3': true,
          'obj4': [true, false, true]
        }
      );
      expect(result).toBe('base array1 nested1 nested2 obj1 obj3 obj4');
    });

    it('should handle whitespace in class names', () => {
      const result = cn('  class1  ', '  class2  ', '  class3  ');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle special characters in class names', () => {
      const result = cn('class-with-dashes', 'class_with_underscores', 'class.with.dots');
      expect(result).toBe('class-with-dashes class_with_underscores class.with.dots');
    });

    it('should handle numeric class names', () => {
      const result = cn('w-1/2', 'w-1/3', 'w-1/4');
      expect(result).toBe('w-1/4'); // tailwind-merge keeps the last conflicting width class
    });

    it('should handle empty objects and arrays', () => {
      const result = cn('base', {}, [], { '': true }, []);
      expect(result).toBe('base');
    });

    it('should handle all falsy values', () => {
      const result = cn(
        'base',
        false,
        0,
        '',
        null,
        undefined,
        NaN,
        'valid'
      );
      expect(result).toBe('base valid');
    });

    it('should handle complex real-world scenarios', () => {
      const isLoading = true;
      const isError = false;
      
      const result = cn(
        'inline-flex items-center justify-center',
        'font-medium rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': true,
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': false,
          'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': false,
        },
        {
          'px-3 py-1.5 text-sm': false,
          'px-4 py-2 text-base': true,
          'px-6 py-3 text-lg': false,
        },
        isLoading && 'animate-spin',
        isError && 'border-red-500'
      );
      
      expect(result).toContain('inline-flex items-center justify-center');
      expect(result).toContain('bg-blue-600 text-white hover:bg-blue-700');
      expect(result).toContain('px-4 py-2 text-base');
      expect(result).toContain('animate-spin');
      expect(result).not.toContain('border-red-500');
    });
  });
}); 