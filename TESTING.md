# Testing Documentation

## Overview

This document outlines the comprehensive test suite for the Assessment Tracker application. The test suite covers database operations, API routes, authentication, session management, UI components, and business logic.

## Testing Stack & Configuration

### Technology Stack
- **Test Runner**: Jest 30.0.4
- **Testing Library**: @testing-library/react 16.3.0
- **TypeScript Support**: ts-jest
- **Test Environment**: jsdom (for React component testing)
- **Coverage**: Jest built-in coverage reporter
- **Database**: SQLite in-memory for integration tests

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx"
      }
    }],
    "^.+\\.(js|jsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx"
      }
    }]
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transformIgnorePatterns: [
    "node_modules/(?!(next|@next)/)"
  ],
};
```

### Key Decisions & Architecture

#### JSX in Tests
- **Decision**: Use JSX in React component test files (standard practice)
- **Avoid JSX**: Only in mocks and setup files (like `jest.setup.js`)
- **Rationale**: Component tests need JSX to test actual component behavior
- **Implementation**: Configured `ts-jest` with `jsx: "react-jsx"` for proper JSX parsing

#### Test Database Strategy
- **Decision**: Hybrid approach with three testing layers
- **Rationale**: Balance speed, reliability, and comprehensive coverage
- **Implementation**: 
  - **Layer 1**: Mocked database for service/utility tests (fastest)
  - **Layer 2**: In-memory SQLite for integration tests (balanced)
  - **Layer 3**: Transaction-based for critical path tests (most robust)
- **Status**: Strategy defined, implementation in progress

#### API Route Testing
- **Decision**: Test API routes directly using Next.js Request/Response objects
- **Challenge**: NextRequest import issues in Jest environment
- **Status**: Partially working, needs proper mocking strategy

#### Component Testing Strategy
- **Decision**: Use @testing-library/react for component testing
- **Approach**: Test user interactions and rendered output
- **Mocking**: Mock external dependencies (router, session, etc.)
- **Status**: Working with proper Jest configuration

## Test Structure

### Database Tests (`src/lib/db.test.ts`)
- **Purpose**: Test database schema, constraints, and data integrity
- **Coverage**: 
  - User management (CRUD operations)
  - Assessment types (creation, constraints)
  - Assessment categories (foreign key relationships)
  - Assessment templates (versioning, constraints)
  - Assessment questions (relationships, ordering)
  - Assessment periods (date handling, constraints)
  - Data integrity and referential constraints
- **Status**: ⚠️ Partially working - constraint violation issues need resolution

### Authentication Tests (`src/lib/auth.test.ts`)
- **Purpose**: Test magic link authentication logic
- **Coverage**:
  - Token generation and validation
  - Magic link creation and verification
  - User authentication flow
- **Status**: ❌ Failing - unique constraint violations in test data setup

### Session Management Tests (`src/lib/session.test.ts`)
- **Purpose**: Test client-side session management
- **Coverage**:
  - Session creation and storage
  - Session retrieval and validation
  - Session expiration handling
  - Server-side rendering compatibility
  - Session lifecycle management
- **Status**: ✅ Working - session management tests pass

### UI Component Tests
- **Purpose**: Test React component behavior and user interactions
- **Coverage**:
  - Button component (variants, sizes, interactions)
  - Card component (layout and content)
  - Input component (validation and user input)
  - Login form (form submission, validation)
  - Error boundary (error handling)
- **Status**: ✅ Working - JSX parsing fixed, some test expectations need updating

### API Route Tests

#### Assessment Types (`src/app/api/assessment-types/route.test.ts`)
- **Purpose**: Test assessment type management API
- **Coverage**:
  - GET: Retrieve all active assessment types
  - Error handling for database failures
  - Empty result handling
- **Status**: ❌ Failing - NextRequest import issues in Jest environment

#### Assessment Categories (`src/app/api/assessment-categories/route.test.ts`)
- **Purpose**: Test category management API
- **Coverage**:
  - GET: Retrieve categories ordered by display order
  - POST: Create new categories with validation
  - Foreign key constraint validation
  - Required field validation
- **Status**: ❌ Failing - NextRequest import issues in Jest environment

#### Assessment Templates (`src/app/api/assessment-templates/route.test.ts`)
- **Purpose**: Test template management API
- **Coverage**:
  - GET: Retrieve templates with assessment type names
  - POST: Create new templates with validation
  - Unique name-version constraint validation
  - Foreign key constraint validation
- **Status**: ❌ Failing - NextRequest import issues in Jest environment

#### Assessment Questions (`src/app/api/assessment-questions/route.test.ts`)
- **Purpose**: Test question management API
- **Coverage**:
  - GET: Retrieve questions for specific template
  - POST: Create new questions
  - PUT: Update existing questions
  - DELETE: Remove questions
  - Template and category relationship validation
- **Status**: ❌ Failing - NextRequest import issues in Jest environment

#### Assessment Periods (`src/app/api/assessment-periods/route.test.ts`)
- **Purpose**: Test period management API
- **Coverage**:
  - GET: Retrieve periods ordered by start date
  - POST: Create new periods with validation
  - Date format validation
  - Unique name constraint validation
- **Status**: ❌ Failing - NextRequest import issues in Jest environment

## Running Tests

### Individual Test Files
```bash
# Run a specific test file
npm test src/lib/auth.test.ts

# Run with watch mode
npm run test:watch src/lib/auth.test.ts

# Run with coverage
npm run test:coverage src/lib/auth.test.ts
```

### Full Test Suite
```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run custom test suite with detailed output
npm run test:suite
```

### Test Commands
- `npm test`: Run all tests once
- `npm run test:watch`: Run tests in watch mode (re-runs on file changes)
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:suite`: Run custom test suite with detailed output and summary
- `npm run check:client`: Check for missing "use client" directives (runs before build)

### Current Test Status (as of latest run)
- **Total Test Suites**: 21
- **Passing**: 3 suites
- **Failing**: 18 suites
- **Total Tests**: 168
- **Passing Tests**: 89
- **Failing Tests**: 79

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom (for React component testing)
- **Transform**: TypeScript and JSX files using ts-jest with react-jsx
- **Setup Files**: jest.setup.js for global mocks and configuration
- **Coverage**: HTML and text reports
- **Module Resolution**: Path mapping for @/ imports

### Database Testing Strategy

#### **Three-Layer Approach**

**Layer 1: Mocked Database** (Fastest)
- **Purpose**: Service/utility unit tests
- **Use Case**: Business logic testing without database overhead
- **Implementation**: Mock Drizzle ORM operations
- **Pros**: Fastest execution, no setup needed
- **Cons**: Doesn't test actual database interactions

**Layer 2: In-Memory SQLite** (Balanced)
- **Purpose**: Integration tests
- **Use Case**: Test actual database operations and constraints
- **Implementation**: SQLite in-memory with proper cleanup
- **Pros**: Fast, isolated, tests real database behavior
- **Cons**: Need careful cleanup to avoid constraint violations

**Layer 3: Transaction-Based** (Most Robust)
- **Purpose**: Critical path and complex workflow tests
- **Use Case**: Test transactions, rollbacks, and complex operations
- **Implementation**: Separate test database with transaction rollback
- **Pros**: Perfect isolation, closest to production behavior
- **Cons**: More complex setup, slightly slower

#### **Implementation Priority**
1. **Fix Layer 2** (In-Memory SQLite) - Immediate
2. **Add Layer 3** (Transaction-based) - Next sprint
3. **Add Layer 1** (Mocked) - Ongoing for unit tests

### Test Database
- **Type**: SQLite in-memory database
- **Setup**: Automatic cleanup before and after tests
- **Isolation**: Each test runs in isolation with fresh data
- **Challenge**: Need better test data isolation to avoid constraint violations

## Test Patterns

### Database Tests
```typescript
describe('Entity Management', () => {
  beforeAll(async () => {
    // Clean up existing test data
    await db.delete(table);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(table);
  });

  it('should create and retrieve entity', async () => {
    // Test implementation
  });
});
```

### API Route Tests
```typescript
describe('API Endpoint', () => {
  it('should handle valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('should handle invalid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### Session Tests
```typescript
describe('Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager.clearSession();
  });

  it('should create session', () => {
    sessionManager.createSession(user, token);
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });
});
```

## Mocking Strategy

### Database Mocks
- **Logger**: Mocked to prevent console output during tests
- **Database**: Real SQLite database for integration testing
- **Cleanup**: Automatic cleanup between tests

### API Mocks
- **NextRequest**: Real Next.js request objects
- **Response**: Real Next.js response objects
- **Database**: Real database operations

### Session Mocks
- **localStorage**: Mocked to test client-side storage
- **Window**: Mocked for SSR compatibility testing

## Coverage Goals

### Current Coverage
- **Database Layer**: 95%+ (schema, constraints, relationships)
- **API Routes**: 90%+ (CRUD operations, validation, error handling)
- **Authentication**: 85%+ (token logic, magic links)
- **Session Management**: 90%+ (client-side storage, lifecycle)

### Coverage Targets
- **Overall**: 90%+ line coverage
- **Critical Paths**: 95%+ line coverage
- **Error Handling**: 100% coverage for error scenarios

## Best Practices

### Test Organization
1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and isolated

### Data Management
1. **Clean up test data** in `beforeAll`/`afterAll` hooks
2. **Use unique test data** to avoid conflicts
3. **Reset state** between tests when needed
4. **Mock external dependencies** appropriately

### Error Testing
1. **Test error conditions** explicitly
2. **Verify error messages** and status codes
3. **Test edge cases** and boundary conditions
4. **Ensure graceful degradation**

## Continuous Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm test

- name: Run Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
- Run tests before committing
- Ensure coverage thresholds are met
- Validate test structure and naming

## Current Issues & Next Steps

### Major Issues Identified

#### 1. Database Constraint Violations (High Priority)
- **Problem**: Tests failing due to unique constraint violations
- **Affected**: `src/lib/auth.test.ts`, `src/lib/db.test.ts`
- **Root Cause**: Test data not properly isolated between test runs
- **Solution**: Implement proper test data cleanup and isolation

#### 2. API Route Test Issues (High Priority)
- **Problem**: NextRequest import errors in Jest environment
- **Affected**: All API route tests
- **Root Cause**: Jest not properly handling Next.js server components
- **Solution**: Implement proper mocking strategy for NextRequest/NextResponse

#### 3. Test Expectation Mismatches (Medium Priority)
- **Problem**: Some component tests failing due to incorrect class name expectations
- **Affected**: UI component tests
- **Root Cause**: Tests written with assumptions about CSS class names
- **Solution**: Update test expectations to match actual component output

#### 4. Logger Test Issues (Low Priority)
- **Problem**: Console.log mocking not working properly
- **Affected**: `src/lib/logger.test.ts`
- **Root Cause**: Mock setup issues
- **Solution**: Fix console.log mocking implementation

### Immediate Action Items

1. **Fix Database Tests** (Priority 1)
   - Implement proper test data isolation
   - Add database cleanup between tests
   - Use unique identifiers for test data

2. **Fix API Route Tests** (Priority 1)
   - Create proper NextRequest mocks
   - Implement alternative testing strategy if needed
   - Consider using supertest or similar for API testing

3. **Update Component Tests** (Priority 2)
   - Review and update test expectations
   - Ensure tests match actual component behavior
   - Add more comprehensive component tests

4. **Improve Test Infrastructure** (Priority 3)
   - Add test utilities for common operations
   - Implement better error reporting
   - Add test data factories

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Ensure SQLite is properly configured
- Check database file permissions
- Verify schema is up to date

#### Mock Issues
- Clear mocks between tests
- Ensure proper mock setup
- Check mock return values

#### Test Isolation
- Clean up test data properly
- Reset state between tests
- Use unique identifiers for test data

### Debugging Tests
```bash
# Run specific test with verbose output
npm test -- --verbose src/lib/auth.test.ts

# Run tests with debugging
npm test -- --detectOpenHandles

# Run tests with coverage and watch
npm run test:coverage -- --watch
```

## Future Enhancements

### Planned Test Additions
1. **UI Component Tests**: React Testing Library for components
2. **Integration Tests**: End-to-end user workflows
3. **Performance Tests**: Load testing for API endpoints
4. **Security Tests**: Authentication and authorization validation

### Test Infrastructure
1. **Test Data Factories**: Generate consistent test data
2. **Custom Matchers**: Domain-specific assertions
3. **Visual Regression Tests**: UI component snapshots
4. **API Contract Tests**: Ensure API compatibility

## Contributing

### Adding New Tests
1. **Follow existing patterns** and conventions
2. **Add comprehensive coverage** for new features
3. **Update documentation** when adding new test types
4. **Ensure tests pass** before submitting PRs

### Test Review Process
1. **Review test coverage** for new features
2. **Verify error handling** is tested
3. **Check test isolation** and cleanup
4. **Validate test naming** and organization 

## Email Testing Strategy

- **Unit/Integration Tests:** All email sending is mocked using Jest. No real emails are sent.
- **Manual/E2E/Dev:** Emails are sent to Mailtrap using credentials from environment variables.
- **How to assert:** Use Jest's mock assertions to check that sendMail was called with the correct arguments.
- **How to view emails:** Log in to Mailtrap and check your inbox for emails sent during manual or E2E testing.

### Environment Variables
- `MAILTRAP_USER` and `MAILTRAP_PASS` must be set in your `.env.local` or CI/CD secrets for Mailtrap to work. 