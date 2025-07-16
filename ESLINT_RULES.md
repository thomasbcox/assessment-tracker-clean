# Custom ESLint Rules for Assessment Tracker

This document describes the custom ESLint rules implemented to enforce service-layer-first architecture and prevent anti-patterns in our Next.js + TypeScript codebase.

## Overview

Our custom ESLint rules are designed to enforce clean architecture patterns and prevent common anti-patterns that can lead to technical debt. These rules are implemented as in-repo custom rules for faster iteration and project-specific customization.

## Rule Configuration

The rules are configured in `eslint.config.mjs`:

```javascript
{
  plugins: {
    "assessment-tracker": customRules
  },
  rules: {
    "assessment-tracker/no-logic-in-api-routes": "error",
    "assessment-tracker/no-framework-objects-in-services": "error",
    "assessment-tracker/no-json-in-tests": "warn",
    "assessment-tracker/service-naming-convention": "error",
    "assessment-tracker/validate-test-inputs": "warn",
    "assessment-tracker/restrict-api-route-imports": "error"
  }
}
```

## Rule Details

### 1. `no-logic-in-api-routes`

**Purpose:** Enforces that API routes are thin wrappers that only parse requests and call service functions.

**What it checks:**
- API route files (files in `src/app/api/**/route.ts`)
- Function calls other than request parsing
- Number of service calls (should be at most one)
- Forbidden function calls in API routes

**Allowed functions:**
- `json()`, `text()`, `formData()`, `url()`, `headers()`, `cookies()`
- `NextResponse.json()`, `NextResponse.redirect()`, `NextResponse.rewrite()`

**Error messages:**
- "API routes should only parse requests and call service functions"
- "API routes should make at most one service call"
- "Function call 'X' is not allowed in API routes"

**Example violations:**
```typescript
// ❌ Bad - Business logic in API route
export async function POST(req: NextRequest) {
  const data = await req.json();
  const user = await db.select().from(users).where(eq(users.email, data.email));
  if (user.length > 0) {
    return NextResponse.json({ error: 'User exists' }, { status: 409 });
  }
  // ... more business logic
}

// ✅ Good - Thin wrapper calling service
export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await userService.createUser(input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### 2. `no-framework-objects-in-services`

**Purpose:** Prevents services from accepting framework objects, ensuring they accept plain data types only.

**What it checks:**
- Service files (files ending with `.service.ts` or in `/services/` directories)
- Function parameters with framework types
- TypeScript type annotations and JSDoc comments

**Forbidden types:**
- `Request`, `NextRequest`, `Response`, `NextResponse`
- `IncomingMessage`, `ServerResponse`

**Error messages:**
- "Service function 'X' accepts framework object 'Y'. Services should accept plain data types only"
- "Parameter 'X' in service function 'Y' has framework type 'Z'. Use plain data types instead"

**Example violations:**
```typescript
// ❌ Bad - Framework object in service
export async function createUser(req: NextRequest): Promise<User> {
  const data = await req.json();
  // ... implementation
}

// ✅ Good - Plain data in service
export async function createUser(input: CreateUserInput): Promise<User> {
  // ... implementation
}
```

### 3. `no-json-in-tests`

**Purpose:** Prevents `.json()` usage in test files to avoid confusion between HTTP responses and service returns.

**What it checks:**
- Test files (files containing `.test.` or `.spec.`)
- `.json()` method calls
- Manual mocks (allows with warning)

**Error messages:**
- "Avoid using .json() in test files. Test service functions directly with plain data objects"
- "Consider using plain objects instead of .json() even in manual mocks for consistency"

**Example violations:**
```typescript
// ❌ Bad - .json() in test
it('should handle response', async () => {
  const response = await fetch('/api/users');
  const data = await response.json();
  expect(data).toEqual(expected);
});

// ✅ Good - Direct service testing
it('should create user', async () => {
  const result = await userService.createUser(input);
  expect(result).toEqual(expected);
});
```

### 4. `service-naming-convention`

**Purpose:** Enforces consistent naming conventions for service files and functions.

**What it checks:**
- Service files must end with `.service.ts`
- No default exports in service files
- No classes in service files (function exports only)
- camelCase naming for exported functions

**Error messages:**
- "Service files must end with '.service.ts'"
- "Service files should not use default exports. Use named exports instead"
- "Service files should export functions, not classes"
- "Service function 'X' should follow camelCase naming convention"

**Example violations:**
```typescript
// ❌ Bad - Default export and class
export default class UserService {
  async createUser() { /* ... */ }
}

// ✅ Good - Named function exports
export async function createUser(input: CreateUserInput): Promise<User> {
  // ... implementation
}
```

### 5. `validate-test-inputs`

**Purpose:** Warns when test inputs don't match imported TypeScript interfaces.

**What it checks:**
- Test files calling service functions
- Inline object literals as arguments
- Suggests appropriate input types

**Error messages:**
- "Consider using a typed variable instead of inline object literal for test input"
- "Test input should use imported types. Consider importing 'X' from service interfaces"

**Example violations:**
```typescript
// ❌ Bad - Inline object literal
it('should create user', async () => {
  const result = await userService.createUser({
    email: 'test@example.com',
    role: 'user'
  });
});

// ✅ Good - Typed input
it('should create user', async () => {
  const input: CreateUserInput = {
    email: 'test@example.com',
    role: 'user'
  };
  const result = await userService.createUser(input);
});
```

### 6. `restrict-api-route-imports`

**Purpose:** Restricts imports in API routes to only allow next/server, services, and types.

**What it checks:**
- API route files (files in `src/app/api/**/route.ts`)
- Import statements
- Forbidden import patterns

**Allowed imports:**
- `next/server`, `next/headers`, `next/cookies`
- Local service modules (`@/lib/services/`, `.service`)
- Type imports (`@/lib/types/`)

**Forbidden patterns:**
- `@/lib/db` (database imports)
- `@/lib/utils` (utility imports)
- `@/lib/auth` (direct auth imports)
- `@/lib/mailer` (direct mailer imports)
- `drizzle-orm`, `sqlite3`, `bcrypt`, `nodemailer`

**Error messages:**
- "Import from 'X' is not allowed in API routes. Only import from 'next/server', local services, or types"
- "Direct database imports are not allowed in API routes. Use service layer instead"
- "Utility imports are not allowed in API routes. Use service layer instead"

**Example violations:**
```typescript
// ❌ Bad - Direct database import
import { db, users } from '@/lib/db';
import { bcrypt } from 'bcrypt';

// ✅ Good - Service import
import { userService } from '@/lib/services/users';
import { CreateUserInput } from '@/lib/types/service-interfaces';
```

## Implementation Details

### File Structure
```
eslint-rules/
├── index.js                    # Main rule exports
├── no-logic-in-api-routes.js   # API route logic prevention
├── no-framework-objects-in-services.js  # Framework object prevention
├── no-json-in-tests.js         # .json() usage prevention
├── service-naming-convention.js # Naming convention enforcement
├── validate-test-inputs.js     # Test input validation
└── restrict-api-route-imports.js # Import restriction
```

### Rule Development
Each rule follows the standard ESLint rule format:
- **meta**: Rule metadata, documentation, and messages
- **create**: Rule implementation function
- **AST traversal**: Node-specific handlers
- **Error reporting**: Context.report() calls

### Testing Rules
Rules can be tested by running ESLint on files that should trigger violations:

```bash
npx eslint src/app/api/users/route.ts
npx eslint src/lib/services/users.ts
npx eslint src/lib/services/users.test.ts
```

## Benefits

### Immediate Benefits
- **Real-time feedback** during development
- **Prevention of anti-patterns** before they become entrenched
- **Consistent code quality** across all developers
- **Reduced code review burden** for architectural concerns

### Long-term Benefits
- **Maintainable codebase** with clear architectural boundaries
- **Easier onboarding** for new team members
- **Reduced technical debt** through automated enforcement
- **Better developer experience** with clear error messages

## Best Practices

### For Developers
1. **Read error messages carefully** - they provide specific guidance
2. **Use the suggested patterns** - they align with our architecture
3. **Import types properly** - use service interfaces for inputs/outputs
4. **Test services directly** - avoid HTTP response mocking in tests
5. **Keep API routes thin** - move business logic to services

### For Code Reviews
1. **Check for rule violations** - ensure new code follows patterns
2. **Suggest improvements** - use rule suggestions for better code
3. **Maintain consistency** - enforce the same patterns across the team
4. **Document exceptions** - if a rule needs to be disabled, document why

## Troubleshooting

### Common Issues
1. **False positives** - Some rules may need adjustment for edge cases
2. **Import confusion** - Ensure imports follow the allowed patterns
3. **Test setup** - Use proper test utilities instead of HTTP mocking
4. **Type mismatches** - Import and use proper TypeScript interfaces

### Rule Disabling
If a rule needs to be disabled for a specific case, use ESLint disable comments:

```typescript
// eslint-disable-next-line assessment-tracker/no-json-in-tests
const data = await response.json();
```

**Note:** Always document why a rule is being disabled and consider if the code can be refactored to follow the pattern instead.

## Future Enhancements

### Potential Rule Additions
1. **Service interface compliance** - Ensure services implement their interfaces
2. **Error handling patterns** - Enforce consistent error handling
3. **Test coverage requirements** - Ensure services have adequate test coverage
4. **Documentation requirements** - Enforce JSDoc comments for public APIs

### Rule Improvements
1. **Better type inference** - Improve TypeScript type checking in rules
2. **Customizable patterns** - Allow configuration of allowed/forbidden patterns
3. **Performance optimization** - Optimize rule performance for large codebases
4. **IDE integration** - Better integration with VS Code and other editors

---

*This documentation should be updated as rules evolve and new patterns are identified.* 