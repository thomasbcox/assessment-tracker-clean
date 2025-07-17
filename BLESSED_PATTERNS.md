# Blessed Patterns

This document outlines the blessed patterns and best practices for the Assessment Tracker project.

## Environment-Aware Utilities

### Pattern: Dynamic Environment Checking

**Problem:** Utilities that check `process.env.NODE_ENV` at instantiation time cannot be properly tested because the environment cannot be changed after the utility is created.

**Solution:** Always check the environment dynamically in each method call, not at instantiation.

### Example: Logger Implementation

#### ❌ Bad Pattern (Static Environment Check)
```typescript
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'; // Static check
  
  debug(message: string) {
    if (this.isDevelopment) { // Uses cached value
      console.log(message);
    }
  }
}
```

#### ✅ Blessed Pattern (Dynamic Environment Check)
```typescript
class Logger {
  // BLESSED PATTERN: Check environment dynamically, not at instantiation
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
  
  debug(message: string) {
    // BLESSED PATTERN: Check environment dynamically
    if (this.isDevelopment) { // Fresh check each time
      console.log(message);
    }
  }
}
```

### Benefits of Dynamic Environment Checking

1. **Testable:** Tests can change `process.env.NODE_ENV` and see immediate effects
2. **Flexible:** Runtime environment changes are respected
3. **Reliable:** No stale cached environment values
4. **Clear:** Intent is explicit in the code

### Testing Environment-Aware Utilities

```typescript
describe('Environment-Aware Utility', () => {
  beforeEach(() => {
    // Reset to known state
    (process.env as any).NODE_ENV = 'test';
  });

  it('should behave differently in development', () => {
    (process.env as any).NODE_ENV = 'development';
    // Test development behavior
  });

  it('should behave differently in production', () => {
    (process.env as any).NODE_ENV = 'production';
    // Test production behavior
  });
});
```

### When to Use This Pattern

- **Logging utilities** that should log differently per environment
- **Feature flags** that depend on environment
- **Debug utilities** that should only work in development
- **Performance monitoring** that should be disabled in tests
- **Any utility** that needs to behave differently based on `NODE_ENV`

### Related Patterns

- **Logger Test Policy:** Use output capture, not mocking
- **Environment Variables:** Use `(process.env as any).NODE_ENV` in tests to avoid TypeScript errors
- **Test Isolation:** Always reset environment state between tests

## Other Blessed Patterns

### Logger Testing

**Policy:** Never mock console or logger in tests. Always capture and assert on real output.

**Rationale:** Tests should verify actual runtime behavior, not mocked behavior.

**Implementation:** See `src/lib/logger.test.ts` for the blessed approach.

### Database Testing

**Policy:** Use real SQLite database with test data builder, never mock the database in service tests.

**Rationale:** Ensures true integration coverage and catches schema/constraint issues early.

**Implementation:** See `src/lib/test-data-builder-simple.ts` for the blessed approach.

### API Route Testing

**Policy:** Test API routes directly using Next.js Request/Response objects.

**Rationale:** Tests the actual request/response flow as it will run in production.

**Implementation:** See API route test files for examples.

## Contributing

When adding new utilities or modifying existing ones:

1. **Follow the blessed patterns** outlined in this document
2. **Add tests** that verify the patterns work correctly
3. **Update this document** if you discover new patterns
4. **Use ESLint rules** to enforce patterns where possible

## Enforcement

- **ESLint Rules:** Custom rules enforce logger testing and database testing policies
- **Code Review:** All PRs are reviewed for compliance with blessed patterns
- **Documentation:** This document serves as the authoritative guide
- **Examples:** Reference implementations show the correct approach 