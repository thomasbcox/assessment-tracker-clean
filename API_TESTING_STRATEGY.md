# API Testing Strategy

## Problem with Previous Approach

The initial approach of testing Next.js API routes directly was problematic because:

1. **Environment Mismatch**: Next.js API routes expect a specific runtime environment with Web API polyfills that Jest doesn't provide
2. **Complex Mocking**: Required extensive mocking of `Request`, `Response`, `NextRequest`, `NextResponse` objects
3. **Brittle Tests**: Tests were fragile and broke when Next.js internals changed
4. **Hard to Maintain**: Complex mock setup made tests difficult to understand and maintain

## Better Approach: Service Layer Testing

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Routes    │    │  Service Layer   │    │   Database      │
│   (Next.js)     │───▶│  (Business       │───▶│   (Drizzle)     │
│                 │    │   Logic)         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Benefits

1. **Separation of Concerns**: Business logic is separated from HTTP handling
2. **Testable**: Service layer can be tested without Next.js environment
3. **Reusable**: Service methods can be used by different parts of the application
4. **Maintainable**: Clear interfaces and error handling
5. **Fast**: No HTTP overhead in tests

### Implementation

#### Service Layer (`src/lib/assessment-templates.service.ts`)

```typescript
export class AssessmentTemplatesService {
  static async getAllTemplates(): Promise<TemplateWithTypeName[]>
  static async createTemplate(data: CreateTemplateData): Promise<TemplateWithTypeName>
}
```

#### API Route (`src/app/api/assessment-templates/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  try {
    const templates = await AssessmentTemplatesService.getAllTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Tests (`src/lib/assessment-templates.service.test.ts`)

```typescript
describe('AssessmentTemplatesService', () => {
  it('should return all active templates', async () => {
    const templates = await AssessmentTemplatesService.getAllTemplates();
    expect(templates).toHaveLength(2);
  });
});
```

## Test Results

### Before (API Route Testing)
- ❌ All API route tests failed
- ❌ Complex mocking required
- ❌ Brittle and hard to maintain

### After (Service Layer Testing)
- ✅ 10/10 tests passing
- ✅ Clean, readable tests
- ✅ Fast execution
- ✅ Easy to maintain

## Best Practices

1. **Extract Business Logic**: Move complex logic from API routes to service classes
2. **Clear Interfaces**: Define TypeScript interfaces for all data structures
3. **Error Handling**: Use specific error messages that can be mapped to HTTP status codes
4. **Database Testing**: Use the existing test database utilities for integration testing
5. **Mock Dependencies**: Only mock external dependencies (like logger), not the database

## Migration Guide

For other API routes, follow this pattern:

1. **Create Service Class**: Extract business logic to a service class
2. **Define Interfaces**: Create TypeScript interfaces for request/response data
3. **Update API Route**: Make API route thin wrapper around service calls
4. **Write Service Tests**: Test the service layer directly
5. **Remove Old Tests**: Delete the problematic API route tests

## Future Considerations

- **E2E Testing**: For full integration testing, use tools like Playwright or Cypress
- **API Contract Testing**: Consider tools like Pact for testing API contracts
- **Performance Testing**: Add performance tests for service methods
- **Load Testing**: Test API endpoints under load using tools like Artillery

This approach follows industry best practices and makes the codebase more maintainable and testable. 