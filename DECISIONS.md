# Architecture Decision Records (ADR)

This document captures key architectural decisions made during the development of the Assessment Tracker application.

## ADR-001: Service Layer Architecture

**Date:** 2025-07-15  
**Status:** Accepted  
**Context:** Need to establish a clean, testable, and maintainable architecture for the Next.js application.

**Decision:** Implement a service-layer-first architecture where:
- All business logic lives in service functions
- API routes are thin wrappers that only handle HTTP concerns
- Services accept plain data objects, not framework objects
- Services are fully testable without framework dependencies

**Consequences:**
- ✅ Improved testability and maintainability
- ✅ Clear separation of concerns
- ✅ Framework-agnostic business logic
- ❌ Additional complexity in initial setup
- ❌ Need for clear documentation and team training

---

## ADR-002: Custom ESLint Rules for Architecture Enforcement

**Date:** 2025-07-16  
**Status:** Accepted  
**Context:** Need to enforce service-layer-first architecture and prevent anti-patterns across the codebase.

**Decision:** Implement custom ESLint rules in-repo to enforce:
1. **No Logic in API Routes** - API routes can only parse requests and call service functions
2. **No Framework Objects in Services** - Services must accept plain data types only
3. **No .json() in Tests** - Prevent confusion between HTTP responses and service returns
4. **Service Naming Conventions** - Enforce .service.ts files and function exports
5. **Validate Test Inputs** - Ensure test inputs match TypeScript interfaces
6. **Restrict API Route Imports** - Only allow next/server, services, and types

**Rationale:**
- **In-repo vs Plugin:** Chose in-repo implementation for faster iteration and project-specific customization
- **Immediate Enforcement:** Rules provide real-time feedback during development
- **Team Alignment:** Ensures consistent patterns across all developers
- **Prevent Technical Debt:** Catches anti-patterns before they become entrenched

**Implementation:**
- Created `eslint-rules/` directory with 6 custom rules
- Updated `eslint.config.mjs` to include custom rules
- Rules are configured as errors for critical patterns, warnings for suggestions

**Consequences:**
- ✅ Enforces architectural patterns automatically
- ✅ Prevents common anti-patterns
- ✅ Improves code quality and consistency
- ✅ Reduces code review burden
- ❌ Learning curve for team members
- ❌ Potential false positives requiring rule tuning

---

## ADR-003: Standardized Error Handling

**Date:** 2025-07-16  
**Status:** Accepted  
**Context:** Need consistent error handling across all services and API routes.

**Decision:** Implement centralized error handling with:
- `ServiceError` class with standardized properties (code, statusCode, details)
- Factory functions for common error types (validation, not found, database, etc.)
- Consistent error codes and HTTP status codes
- Centralized logging and API response helpers

**Consequences:**
- ✅ Consistent error responses across the application
- ✅ Better debugging and monitoring
- ✅ Type-safe error handling
- ❌ Additional complexity in error handling setup

---

## ADR-004: Interface-First Service Design

**Date:** 2025-07-16  
**Status:** Accepted  
**Context:** Need clear contracts for all services to ensure consistency and testability.

**Decision:** Define TypeScript interfaces for all services before implementation:
- All services implement defined interfaces
- Input/output types use Zod schemas for validation
- Clear separation between interface and implementation
- Comprehensive type definitions for all service operations

**Consequences:**
- ✅ Clear service contracts and expectations
- ✅ Better TypeScript support and IDE experience
- ✅ Easier testing with proper type checking
- ✅ Consistent service patterns across the application
- ❌ Additional upfront design work
- ❌ Need to maintain interface-implementation alignment

---

## ADR-005: Test Data Builder System

**Date:** 2025-01-27  
**Status:** Accepted  
**Context:** Need a robust, maintainable way to create test data for complex database relationships without manual foreign key management.

**Decision:** Implement a comprehensive test data builder system with:
- **Dependency-aware architecture** organized by foreign key relationships
- **Automatic dependency resolution** - no manual foreign key management required
- **Fluent configuration API** for easy test data creation
- **Type-safe builders** with full TypeScript support
- **Database cleanup utilities** with dependency-aware truncation
- **Layer 2 testing approach** using real SQLite database

**Rationale:**
- **Dependency Management:** Complex foreign key relationships require careful ordering
- **Test Isolation:** Each test needs clean, unique data
- **Maintainability:** Centralized test data creation reduces duplication
- **Type Safety:** Full TypeScript integration prevents runtime errors
- **Performance:** In-memory SQLite provides fast test execution

**Implementation:**
- Created `SimpleTestDataBuilder` with 4 dependency groups
- Implemented `SimpleDatabaseCleanup` for proper test isolation
- Built comprehensive test suite with 14 test cases
- Created 10 practical usage examples
- Integrated with existing Drizzle ORM schema

**Dependency Groups:**
1. **Group 1:** Dimension tables (users, assessment_types, assessment_periods, magic_links)
2. **Group 2:** Tables with FKs to Group 1 (assessment_categories, assessment_templates, assessment_instances, manager_relationships)
3. **Group 3:** Tables with FKs to Group 2 (assessment_questions, invitations)
4. **Group 4:** Tables with FKs to Group 3 (assessment_responses)

**Consequences:**
- ✅ Automatic dependency management eliminates foreign key errors
- ✅ Consistent test data creation across all test suites
- ✅ Improved test maintainability and readability
- ✅ Better test isolation and data cleanup
- ✅ Type-safe test data creation
- ✅ Follows Layer 2 testing standards (real database)
- ❌ Initial complexity in understanding dependency groups
- ❌ Learning curve for team members
- ❌ Need for comprehensive documentation and examples 