# Testing Guide

This document outlines the testing strategy and patterns used in the Assessment Tracker project.

## Testing Philosophy

We follow a **clean, simple, and predictable** approach to testing:

- **Simple Factory Functions**: Use pure functions to create test data
- **No Hidden State**: Each test is independent and stateless
- **Clear Separation of Concerns**: Separate data creation from database operations
- **Composition Over Inheritance**: Build complex scenarios from simple pieces

## Test Patterns

### Simple Entity Creation

```typescript
// Create with defaults
const user = await createTestUser();

// Create with overrides
const manager = await createTestUser({
  email: 'manager@example.com',
  role: 'manager',
  firstName: 'John',
  lastName: 'Doe'
});
```

### Multiple Entities

```typescript
// Create multiple users at once
const users = await createMultipleUsers([
  { email: 'user1@example.com', role: 'user' },
  { email: 'user2@example.com', role: 'manager' }
]);
```

### Complex Relationships

```typescript
// Create complete assessment setup
const setup = await createTestAssessmentSetup({
  type: { name: 'Team Assessment' },
  period: { name: 'Q1 2024', isActive: 1 },
  template: { name: 'Leadership Template' },
  category: { name: 'Leadership' }
});

// Create user with assessment
const result = await createTestUserWithAssessment({
  user: { email: 'employee@example.com' },
  assessmentSetup: { type: { name: 'Performance Review' } },
  instance: { status: 'in_progress' }
});
```

## Available Test Utilities

### Basic Entity Creation
- `createTestUser(overrides)` - Create a user
- `createTestAssessmentType(overrides)` - Create an assessment type
- `createTestAssessmentPeriod(overrides)` - Create an assessment period

### Complex Scenarios
- `createTestAssessmentSetup(overrides)` - Create type, period, template, category
- `createTestUserWithAssessment(overrides)` - Create user with assessment instance
- `createMultipleUsers(configs)` - Create multiple users

### Cleanup
- `cleanup()` - Clean all test data
- `withCleanup(testFn)` - Run test with automatic cleanup

## Test Structure

### Basic Test Structure

```typescript
describe('User Management', () => {
  beforeEach(async () => {
    await cleanup(); // Clean slate for each test
  });

  afterEach(async () => {
    await cleanup(); // Ensure cleanup even if test fails
  });

  it('should create a user', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      role: 'user'
    });

    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('user');
  });
});
```

### Integration Tests

```typescript
describe('Assessment Workflow', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should create complete assessment workflow', async () => {
    // Create assessment setup
    const setup = await createTestAssessmentSetup({
      type: { name: 'Performance Review' },
      period: { name: 'Q1 2024', isActive: 1 }
    });

    // Create user with assessment
    const result = await createTestUserWithAssessment({
      user: { email: 'employee@example.com' },
      assessmentSetup: { type: { name: 'Performance Review' } },
      instance: { status: 'pending' }
    });

    // Verify relationships
    expect(result.instance.userId).toBe(result.user.id);
    expect(result.instance.periodId).toBe(result.period.id);
    expect(result.instance.templateId).toBe(result.template.id);
  });
});
```

## Database Testing

### Real Database Testing

All database tests use a real SQLite database:

- **No mocking** of the database or ORM
- **Real transactions** and foreign key constraints
- **Proper cleanup** between tests
- **Type safety** with Drizzle ORM

### Database Cleanup

```typescript
// Automatic cleanup in test lifecycle
beforeEach(async () => {
  await cleanup(); // Clean all tables
});

afterEach(async () => {
  await cleanup(); // Ensure cleanup even if test fails
});
```

## Service Layer Testing

### Service Layer Test Policy

- All service layer tests must use a real in-memory SQLite database
- **Mocking the database or ORM in service layer tests is strictly forbidden**
- Use the clean test utilities for creating test data
- Test real business logic with real database operations

### Example Service Test

```typescript
describe('UserService', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user' as const
    };

    const user = await userService.createUser(userData);

    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.role).toBe(userData.role);
  });
});
```

## Component Testing

### React Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { createTestUser } from '../lib/test-utils-clean';

describe('UserProfile', () => {
  it('should display user information', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    });

    render(<UserProfile user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
```

## Logger Testing

### Logger Test Policy

Logger tests must:
- Capture and assert on real console output (no mocking of console or logger)
- Verify environment-specific output (development, test, production)
- Comply with the custom ESLint rule: `no-logger-mocking-in-tests`

### Example Logger Test

```typescript
describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log messages in development', () => {
    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });
});
```

## Best Practices

### ✅ DO

- Use simple factory functions for test data
- Keep tests independent and stateless
- Use proper cleanup in beforeEach/afterEach
- Test real business logic with real database operations
- Write clear, descriptive test names
- Use composition for complex scenarios

### ❌ DON'T

- Create complex test data builders
- Use shared state between tests
- Mock the database in service layer tests
- Skip cleanup between tests
- Make tests depend on each other
- Use hardcoded IDs in tests

## Common Anti-Patterns

### ❌ Complex Builders

```typescript
// Don't do this
const builder = new TestDataBuilder();
const result = await builder.create({
  user: { email: 'test@example.com' },
  assessmentType: { name: 'Test' },
  // ... complex config
});
```

### ❌ Shared State

```typescript
// Don't do this
let sharedUser;
beforeEach(() => {
  sharedUser = createUser(); // Shared between tests
});
```

### ❌ Mixed Concerns

```typescript
// Don't do this
class TestHelper {
  async createUserAndAssessment() {
    // Does too many things
  }
}
```

## Troubleshooting

### Foreign Key Constraint Errors

- Make sure you're using the correct IDs from created entities
- Don't use hardcoded IDs (like `1`, `2`, etc.)
- Use the returned entities from factory functions

### Unique Constraint Errors

- Each entity should have unique identifiers
- Use timestamps or random strings for unique values
- Don't reuse the same data across tests

### Test Pollution

- Always use `cleanup()` in beforeEach/afterEach
- Don't share state between tests
- Each test should be independent

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPatterns=user.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

## Code Review Checklist

When reviewing tests, ensure:

- [ ] Uses simple factory functions, not complex builders
- [ ] No hidden state or side effects
- [ ] Clear separation of concerns
- [ ] Proper cleanup in beforeEach/afterEach
- [ ] Tests are independent and can run in any order
- [ ] Uses composition over inheritance
- [ ] Easy to understand and maintain
- [ ] No mocking of database in service layer tests
- [ ] Real database operations for integration tests

## Resources

- [Testing Patterns Guide](TESTING_PATTERNS.md) - Detailed patterns and principles
- [Team Training Guide](TEAM_TRAINING.md) - Training materials for the team
- [Clean Test Utilities](../src/lib/test-utils-clean.ts) - Implementation of clean test utilities
- [Example Tests](../src/lib/test-utils-clean.test.ts) - Examples of using the clean patterns 