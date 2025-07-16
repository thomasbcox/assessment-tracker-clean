# Development Guidelines

## Next.js App Router Architecture

### Server vs Client Components

**Server Components (Default)**
- All components are server components by default
- Cannot use React hooks (`useState`, `useEffect`, `useRouter`, etc.)
- Cannot use browser APIs (`window`, `document`, `localStorage`, etc.)
- Cannot use event handlers (`onClick`, `onChange`, etc.)
- Better for SEO, performance, and initial page load

**Client Components**
- Must have `"use client"` directive at the top of the file
- Can use all React hooks and browser APIs
- Can use event handlers and interactive features
- Rendered on the client side

### When to Use Each

**Use Server Components for:**
- Static content and layouts
- Data fetching that doesn't need interactivity
- SEO-optimized content
- Performance-critical pages

**Use Client Components for:**
- Interactive UI elements (forms, buttons, modals)
- Components that use React hooks
- Components that need browser APIs
- Components with event handlers
- Components that need client-side state

### Common Patterns

```tsx
// ✅ Good: Server Component (no hooks)
export default function StaticPage() {
  return <div>Static content</div>;
}

// ✅ Good: Client Component (with hooks)
"use client";

import { useState, useEffect } from 'react';

export default function InteractivePage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Client-side logic
  }, []);
  
  return <div>Interactive content</div>;
}

// ❌ Bad: Server Component with hooks (will cause error)
export default function BrokenPage() {
  const [data, setData] = useState(null); // Error!
  
  return <div>This will break</div>;
}
```

## File Organization

### Page Components (`src/app/**/page.tsx`)
- Most page components should be client components
- Use `"use client"` directive
- Handle authentication, routing, and data fetching

### Layout Components (`src/app/**/layout.tsx`)
- Usually server components
- Handle global layouts and metadata
- Avoid hooks unless necessary

### UI Components (`src/components/**`)
- Split into server and client components based on needs
- Interactive components → client components
- Static components → server components

## Common Hooks and Their Requirements

| Hook | Requires "use client" | Common Use Cases |
|------|----------------------|------------------|
| `useState` | ✅ Yes | Form state, UI state |
| `useEffect` | ✅ Yes | Data fetching, side effects |
| `useRouter` | ✅ Yes | Navigation |
| `useCallback` | ✅ Yes | Performance optimization |
| `useMemo` | ✅ Yes | Expensive calculations |
| `useRef` | ✅ Yes | DOM references |
| `useContext` | ✅ Yes | Global state |
| `useReducer` | ✅ Yes | Complex state management |

## Error Prevention Checklist

### Before Creating New Components
- [ ] Determine if the component needs interactivity
- [ ] Check if it will use React hooks
- [ ] Add `"use client"` if needed
- [ ] Test the component in isolation

### Before Modifying Existing Components
- [ ] Check if the component already has `"use client"`
- [ ] Verify that new hooks are added to client components
- [ ] Test the component after changes

### Common Error Messages and Solutions

**Error**: `You're importing a component that needs 'useEffect'. This React hook only works in a client component.`
**Solution**: Add `"use client"` at the top of the file

**Error**: `Cannot read properties of undefined (reading 'useState')`
**Solution**: Check if the component is properly marked as client component

**Error**: `window is not defined`
**Solution**: Add `"use client"` or use `typeof window !== 'undefined'` check

## Testing Guidelines

### Unit Tests
- Test client components with proper mocking
- Mock browser APIs when testing server components
- Use `@testing-library/react` for component testing

### Integration Tests
- Test complete user flows
- Verify authentication and authorization
- Test error boundaries and fallbacks

## Performance Considerations

### Server Components
- Better initial page load
- Reduced JavaScript bundle size
- Better SEO
- Automatic code splitting

### Client Components
- Interactive user experience
- Client-side state management
- Real-time updates
- Progressive enhancement

## Best Practices

1. **Start with Server Components**: Default to server components unless client-side features are needed
2. **Minimize Client Components**: Only use client components when necessary
3. **Hybrid Approach**: Use server components for static parts and client components for interactive parts
4. **Clear Separation**: Keep server and client logic separate
5. **Error Boundaries**: Use error boundaries around client components
6. **Loading States**: Provide loading states for client-side data fetching

## Common Anti-Patterns

### ❌ Don't: Put everything in client components
```tsx
// Bad: Unnecessary client component
"use client";

export default function StaticHeader() {
  return <h1>Static Title</h1>; // No hooks needed!
}
```

### ❌ Don't: Use hooks in server components
```tsx
// Bad: Hooks in server component
export default function BrokenComponent() {
  const [data, setData] = useState(null); // Will break!
  return <div>{data}</div>;
}
```

### ✅ Do: Use appropriate component types
```tsx
// Good: Server component for static content
export default function StaticHeader() {
  return <h1>Static Title</h1>;
}

// Good: Client component for interactive content
"use client";

export default function InteractiveForm() {
  const [data, setData] = useState(null);
  return <form>...</form>;
}
```

## Debugging Tips

1. **Check the Error Message**: Next.js provides clear error messages about missing `"use client"`
2. **Use React DevTools**: Check if components are rendering on client or server
3. **Check Network Tab**: Server components don't send JavaScript to the client
4. **Use Console Logs**: Add logs to determine where code is running
5. **Test in Isolation**: Test components separately to isolate issues

## Testing Guidelines

### Test Structure
- **Component Tests**: Use JSX in test files (standard practice)
- **Mock Files**: Avoid JSX in mocks and setup files
- **Database Tests**: Use SQLite in-memory with proper cleanup
- **API Tests**: Mock NextRequest/NextResponse appropriately

### Test Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPatterns="button.test.tsx"

# Run with coverage
npm run test:coverage

# Check for missing "use client" directives
npm run check:client
```

### Testing Best Practices
1. **Write tests for new features** before or alongside development
2. **Use descriptive test names** that explain expected behavior
3. **Test user interactions** rather than implementation details
4. **Mock external dependencies** (router, session, API calls)
5. **Clean up test data** between tests to avoid conflicts

### Current Test Status
- **JSX Parsing**: ✅ Fixed with proper Jest configuration
- **Component Tests**: ✅ Working (some expectations need updating)
- **Database Tests**: ❌ Constraint violation issues
- **API Tests**: ❌ NextRequest import issues
- **Overall**: 18 failing, 3 passing test suites

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/learn/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/) 