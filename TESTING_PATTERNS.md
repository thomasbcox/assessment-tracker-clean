# Testing Patterns Guide

## **The New Normal: Clean Test Utilities**

This document establishes the clean testing patterns that should be used for all new tests and guides migration of existing tests.

## **Core Principles**

### **1. Simple Factory Functions**
- Use pure functions that create test data
- No hidden state or side effects
- Easy to override with specific values
- Predictable and testable

```typescript
// ✅ GOOD: Simple factory function
export const createTestUserData = (overrides: Partial<NewUser> = {}): NewUser => ({
  id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: 1,
  ...overrides
});

// ❌ AVOID: Complex builders with state
class UserBuilder {
  private data = {};
  withEmail(email) { /* ... */ }
  create() { /* ... */ }
}
```

### **2. Separation of Concerns**
- Separate data creation from database operations
- Each function has a single responsibility
- Compose complex operations from simple pieces

```typescript
// ✅ GOOD: Separated concerns
export const createTestUserData = (overrides) => { /* pure function */ };
export const insertTestUser = async (data) => { /* database operation */ };
export const createTestUser = async (overrides) => {
  const data = createTestUserData(overrides);
  return await insertTestUser(data);
};

// ❌ AVOID: Mixed concerns
class TestDataBuilder {
  async create(config) { /* does everything */ }
}
```

### **3. Composition Over Inheritance**
- Build complex scenarios from simple functions
- Reuse and combine existing utilities
- No complex inheritance hierarchies

```typescript
// ✅ GOOD: Composition
export const createTestUserWithAssessment = async (overrides) => {
  const user = await createTestUser(overrides.user);
  const { type, period, template } = await createTestAssessmentSetup(overrides.assessmentSetup);
  // ... compose the pieces
};

// ❌ AVOID: Inheritance
class AssessmentBuilder extends BaseBuilder {
  // Complex inheritance chain
}
```

### **4. No Hidden State**
- Each function call is independent
- No shared state between tests
- Predictable behavior

```typescript
// ✅ GOOD: Stateless
const user1 = await createTestUser({ email: 'user1@example.com' });
const user2 = await createTestUser({ email: 'user2@example.com' });
// user1 and user2 are independent

// ❌ AVOID: Stateful
const builder = new TestDataBuilder();
const user1 = await builder.create({ user: { email: 'user1@example.com' } });
const user2 = await builder.create({ user: { email: 'user2@example.com' } });
// user2 might be affected by user1
```

## **Migration Strategy**

### **Phase 1: Establish New Patterns (Current)**
- ✅ Create clean test utilities (`test-utils-clean.ts`)
- ✅ Write example tests showing the patterns
- ✅ Document the approach (this guide)

### **Phase 2: Migrate Existing Tests**
- Update `db.test.ts` to use new patterns
- Remove dependency on complex test data builder
- Ensure all tests follow new patterns

### **Phase 3: Clean Up Legacy Code**
- Remove old test data builder
- Remove unused test utilities
- Update documentation

### **Phase 4: Establish Enforcement**
- Add linting rules for test patterns
- Code review checklist for tests
- Training for team members

## **Usage Patterns**

### **Simple Entity Creation**
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

### **Multiple Entities**
```typescript
// Create multiple users
const users = await createMultipleUsers([
  { email: 'user1@example.com', role: 'user' },
  { email: 'user2@example.com', role: 'manager' }
]);
```

### **Complex Relationships**
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

### **Test Structure**
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

## **Code Review Checklist**

When reviewing tests, ensure:

- [ ] Uses simple factory functions, not complex builders
- [ ] No hidden state or side effects
- [ ] Clear separation of concerns
- [ ] Proper cleanup in beforeEach/afterEach
- [ ] Tests are independent and can run in any order
- [ ] Uses composition over inheritance
- [ ] Easy to understand and maintain

## **Common Anti-Patterns to Avoid**

### **❌ Complex Builders**
```typescript
// Don't do this
const builder = new TestDataBuilder();
const result = await builder.create({
  user: { email: 'test@example.com' },
  assessmentType: { name: 'Test' },
  // ... complex config
});
```

### **❌ Shared State**
```typescript
// Don't do this
let sharedUser;
beforeEach(() => {
  sharedUser = createUser(); // Shared between tests
});
```

### **❌ Mixed Concerns**
```typescript
// Don't do this
class TestHelper {
  async createUserAndAssessment() {
    // Does too many things
  }
}
```

## **Benefits of This Approach**

1. **Maintainable**: Simple functions are easier to understand and modify
2. **Testable**: Each function can be tested independently
3. **Predictable**: No hidden state or side effects
4. **Composable**: Build complex scenarios from simple pieces
5. **Debuggable**: Easy to trace issues and understand behavior
6. **Performant**: No unnecessary complexity or overhead

## **Next Steps**

1. Migrate existing tests to use new patterns
2. Remove legacy test data builder
3. Add linting rules to enforce patterns
4. Train team on new approach
5. Monitor and iterate based on feedback 