# Team Training: Clean Test Patterns

## **Overview**

We've established new testing patterns that make our tests more maintainable, predictable, and easier to debug. This document will help you understand and use these patterns effectively.

## **The Problem We Solved**

### **Old Approach (Complex & Messy)**
```typescript
// ❌ Complex builder with hidden state
const builder = new TestDataBuilder(db);
const result = await builder.create({
  user: { email: 'test@example.com' },
  assessmentType: { name: 'Test' },
  // ... complex config
});

// Problems:
// - Hidden state between calls
// - Complex inheritance hierarchy
// - Hard to debug and understand
// - Configuration not always respected
// - Foreign key constraint errors
```

### **New Approach (Simple & Clean)**
```typescript
// ✅ Simple factory functions
const user = await createTestUser({ email: 'test@example.com' });
const type = await createTestAssessmentType({ name: 'Test' });

// Benefits:
// - No hidden state
// - Easy to understand
// - Predictable behavior
// - Easy to debug
// - Configuration always respected
```

## **Core Patterns to Learn**

### **1. Simple Entity Creation**
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

### **2. Multiple Entities**
```typescript
// Create multiple users at once
const users = await createMultipleUsers([
  { email: 'user1@example.com', role: 'user' },
  { email: 'user2@example.com', role: 'manager' }
]);
```

### **3. Complex Relationships**
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

### **4. Test Structure**
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

## **Available Utilities**

### **Basic Entity Creation**
- `createTestUser(overrides)` - Create a user
- `createTestAssessmentType(overrides)` - Create an assessment type
- `createTestAssessmentPeriod(overrides)` - Create an assessment period

### **Complex Scenarios**
- `createTestAssessmentSetup(overrides)` - Create type, period, template, category
- `createTestUserWithAssessment(overrides)` - Create user with assessment instance
- `createMultipleUsers(configs)` - Create multiple users

### **Cleanup**
- `cleanup()` - Clean all test data
- `withCleanup(testFn)` - Run test with automatic cleanup

## **Best Practices**

### **✅ DO**
- Use simple factory functions
- Override specific properties as needed
- Clean up in beforeEach/afterEach
- Make tests independent
- Use composition for complex scenarios

### **❌ DON'T**
- Create complex builder classes
- Use shared state between tests
- Mix concerns in single functions
- Skip cleanup
- Make tests depend on each other

## **Migration Guide**

### **From Old to New**

**Old:**
```typescript
const builder = new TestDataBuilder(db);
const result = await builder.create({
  user: { email: 'test@example.com' },
  assessmentType: { name: 'Test' }
});
```

**New:**
```typescript
const user = await createTestUser({ email: 'test@example.com' });
const type = await createTestAssessmentType({ name: 'Test' });
```

### **From Complex Relationships**

**Old:**
```typescript
const result = await builder.create({
  user: { email: 'employee@example.com' },
  assessmentType: { name: 'Performance Review' },
  assessmentPeriod: { name: 'Q1 2024' },
  assessmentTemplate: { name: 'Template' },
  assessmentInstance: { status: 'pending' }
});
```

**New:**
```typescript
const result = await createTestUserWithAssessment({
  user: { email: 'employee@example.com' },
  assessmentSetup: { 
    type: { name: 'Performance Review' },
    period: { name: 'Q1 2024' }
  },
  instance: { status: 'pending' }
});
```

## **Common Scenarios**

### **Testing User Creation**
```typescript
it('should create a user with valid data', async () => {
  const user = await createTestUser({
    email: 'test@example.com',
    role: 'manager'
  });

  expect(user.email).toBe('test@example.com');
  expect(user.role).toBe('manager');
});
```

### **Testing Multiple Users**
```typescript
it('should handle multiple users', async () => {
  const users = await createMultipleUsers([
    { email: 'user1@example.com', role: 'user' },
    { email: 'user2@example.com', role: 'manager' }
  ]);

  expect(users).toHaveLength(2);
  expect(users[0].role).toBe('user');
  expect(users[1].role).toBe('manager');
});
```

### **Testing Complex Relationships**
```typescript
it('should create assessment with all related entities', async () => {
  const setup = await createTestAssessmentSetup({
    type: { name: 'Team Assessment' },
    period: { name: 'Q1 2024', isActive: 1 }
  });

  expect(setup.template.assessmentTypeId).toBe(setup.type.id);
  expect(setup.category.assessmentTypeId).toBe(setup.type.id);
});
```

## **Troubleshooting**

### **Foreign Key Constraint Errors**
- Make sure you're using the correct IDs from created entities
- Don't use hardcoded IDs (like `1`, `2`, etc.)
- Use the returned entities from factory functions

### **Unique Constraint Errors**
- Each entity should have unique identifiers
- Use timestamps or random strings for unique values
- Don't reuse the same data across tests

### **Test Pollution**
- Always use `cleanup()` in beforeEach/afterEach
- Don't share state between tests
- Each test should be independent

## **Getting Help**

- Check `TESTING_PATTERNS.md` for detailed patterns
- Look at `test-utils-clean.test.ts` for examples
- Review existing tests in `db.test.ts`
- Ask the team for guidance on complex scenarios

## **Next Steps**

1. **Practice**: Try writing a few tests using the new patterns
2. **Migrate**: Update existing tests to use new patterns
3. **Review**: Use the code review checklist when reviewing tests
4. **Share**: Help other team members learn the patterns
5. **Iterate**: Provide feedback to improve the patterns 