# Service Layer Pattern Implementation

## Overview

The Assessment Tracker project implements a **service-layer-first architecture** where all business logic is contained within service classes, and API routes act as thin wrappers around these services.

## Core Principles

1. **Separation of Concerns**: API routes handle HTTP concerns, services handle business logic
2. **Interface-First Design**: All services implement well-defined TypeScript interfaces
3. **Clean Data Flow**: Services accept plain data objects, not framework objects
4. **Consistent Error Handling**: Standardized error patterns across all services
5. **Testability**: Services can be unit tested independently of HTTP layer

## Architecture Pattern

### Service Interface Definition
```typescript
// src/lib/types/service-interfaces.ts
export interface IUserService {
  createUser(input: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, input: UpdateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserStats(userId: string): Promise<UserStats>;
}

export type CreateUserInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
};
```

### Service Implementation
```typescript
// src/lib/services/users.ts
export class UserService implements IUserService {
  static async createUser(input: CreateUserInput): Promise<User> {
    // Business logic here
    const user = await db.insert(users).values(input).returning();
    return user[0];
  }
  
  static async getUserStats(userId: string): Promise<UserStats> {
    // Complex business logic for calculating user statistics
    const instances = await db.select().from(assessmentInstances)
      .where(eq(assessmentInstances.userId, userId));
    
    return {
      total: instances.length,
      completed: instances.filter(i => i.completedAt).length,
      pending: instances.filter(i => !i.completedAt).length
    };
  }
}
```

### API Route (Thin Wrapper)
```typescript
// src/app/api/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '@/lib/services/users';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const stats = await getUserStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Error Handling Pattern

### ServiceError Class
```typescript
export class ServiceError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
```

### Usage in Services
```typescript
// In a service method
if (!user) {
  throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
}

if (!isValidEmail(email)) {
  throw new ServiceError('Invalid email format', 'INVALID_EMAIL', 400);
}
```

### API Route Error Handling
```typescript
// Consistent error handling across all API routes
try {
  const result = await serviceMethod(input);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Service Layer Structure

### Current Services (10/10 Complete)
1. **UserService** - User management and statistics
2. **AssessmentTemplatesService** - Template CRUD operations
3. **AssessmentInstancesService** - Assessment instance management
4. **AssessmentResponsesService** - Response handling
5. **AssessmentPeriodsService** - Period management
6. **AssessmentCategoriesService** - Category management
7. **AssessmentQuestionsService** - Question management
8. **AdminService** - Administrative operations
9. **AuthService** - Authentication and authorization
10. **EmailService** - Email operations

### Service Method Patterns
```typescript
// CRUD Operations
async createEntity(input: CreateEntityInput): Promise<Entity>
async getEntityById(id: string): Promise<Entity | null>
async updateEntity(id: string, input: UpdateEntityInput): Promise<Entity>
async deleteEntity(id: string): Promise<void>

// Query Operations
async getAllEntities(): Promise<Entity[]>
async getEntitiesByFilter(filter: FilterInput): Promise<Entity[]>

// Business Operations
async performBusinessAction(input: ActionInput): Promise<ActionResult>

// Validation
validateEntityData(data: CreateEntityInput): ValidationResult
```

## API Route Patterns

### GET Route Pattern
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await serviceMethod(id);
    return NextResponse.json(result);
  } catch (error) {
    // Standard error handling
  }
}
```

### POST Route Pattern
```typescript
export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const result = await serviceMethod(input);
    return NextResponse.json(result);
  } catch (error) {
    // Standard error handling
  }
}
```

### PUT Route Pattern
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const input = await request.json();
    const result = await serviceMethod(id, input);
    return NextResponse.json(result);
  } catch (error) {
    // Standard error handling
  }
}
```

## Testing Strategy

### Service Layer Test Policy: No Database Mocking

All service layer tests must use a real in-memory SQLite database and the test data builder system. Mocking the database or ORM (e.g., jest.mock('@/lib/db'), jest.mock('drizzle-orm')) is strictly forbidden and enforced by ESLint. This ensures true integration coverage and prevents false positives/negatives from mocks.

- See [TESTING.md](TESTING.md) for details and rationale.

### Service Testing
```typescript
// Test service methods directly
describe('UserService', () => {
  it('should create user successfully', async () => {
    const input = { email: 'test@example.com', role: 'user' };
    const user = await UserService.createUser(input);
    expect(user.email).toBe(input.email);
  });
});
```

### API Route Testing
```typescript
// Test only route-specific logic
describe('GET /api/users/[id]/stats', () => {
  it('should return user stats', async () => {
    // Mock service call
    jest.spyOn(UserService, 'getUserStats').mockResolvedValue({
      total: 5,
      completed: 3,
      pending: 2
    });
    
    const response = await fetch('/api/users/123/stats');
    const data = await response.json();
    
    expect(data.total).toBe(5);
  });
});
```

## ESLint Enforcement

### Custom Rules Implemented
1. **no-logic-in-api-routes** - Prevents business logic in API routes
2. **no-framework-objects-in-services** - Prevents Next.js objects in services
3. **no-json-in-tests** - Encourages testing services directly
4. **validate-test-inputs** - Ensures test inputs match interfaces
5. **restrict-api-route-imports** - Limits imports in API routes

### Rule Configuration
```javascript
// eslint.config.mjs
{
  rules: {
    "assessment-tracker/no-logic-in-api-routes": "error",
    "assessment-tracker/no-framework-objects-in-services": "error",
    "assessment-tracker/no-json-in-tests": "warn",
    "assessment-tracker/validate-test-inputs": "warn",
    "assessment-tracker/restrict-api-route-imports": "error"
  }
}
```

## Current Implementation Status

### ✅ Completed (70%)
- **10/14 API routes** refactored to service layer pattern
- **All service interfaces** defined and documented
- **Error handling** standardized across services
- **ESLint rules** implemented and active
- **Core service implementations** complete

### 🔄 In Progress
- **4 remaining API routes** need refactoring
- **Service test alignment** with new interfaces
- **Missing service methods** (e.g., getAllTokens)

### 📋 Next Steps
1. Complete remaining API route refactoring
2. Update service tests to match interfaces
3. Add missing service methods
4. Fix all ESLint violations

## Benefits Achieved

1. **Maintainability** - Clear separation of concerns
2. **Testability** - Services can be tested independently
3. **Consistency** - Standardized patterns across codebase
4. **Error Handling** - Consistent error responses
5. **Developer Experience** - Clear interfaces and patterns
6. **Code Quality** - Automated enforcement via ESLint

## Best Practices

1. **Always define interfaces** before implementing services
2. **Use ServiceError** for all service-level errors
3. **Keep API routes thin** - only handle HTTP concerns
4. **Test services directly** rather than through API routes
5. **Use TypeScript interfaces** for all service contracts
6. **Follow naming conventions** consistently
7. **Document service methods** with clear input/output contracts 