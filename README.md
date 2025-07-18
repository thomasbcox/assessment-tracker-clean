# Assessment Tracker

A modern assessment management system built with Next.js, TypeScript, and SQLite.

## Features

- **User Management**: Create and manage users with different roles
- **Assessment Types**: Define different types of assessments
- **Assessment Periods**: Organize assessments by time periods
- **Assessment Templates**: Create reusable assessment templates
- **Assessment Categories**: Group assessment questions by categories
- **Assessment Questions**: Define questions for assessments
- **Assessment Instances**: Track individual assessment attempts
- **Assessment Responses**: Store and analyze assessment responses
- **Manager Relationships**: Define reporting relationships
- **Invitations**: Invite users to complete assessments
- **Magic Links**: Secure authentication without passwords

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Drizzle ORM
- **Testing**: Jest with React Testing Library
- **Authentication**: Magic link authentication

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd assessment-tracker-clean
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run setup-db
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

The project uses clean, simple test patterns for maintainable and predictable tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Patterns

We use simple factory functions for creating test data:

```typescript
// Create a test user
const user = await createTestUser({
  email: 'test@example.com',
  role: 'manager'
});

// Create multiple users
const users = await createMultipleUsers([
  { email: 'user1@example.com', role: 'user' },
  { email: 'user2@example.com', role: 'manager' }
]);

// Create complex assessment setup
const setup = await createTestAssessmentSetup({
  type: { name: 'Team Assessment' },
  period: { name: 'Q1 2024', isActive: 1 },
  template: { name: 'Leadership Template' },
  category: { name: 'Leadership' }
});
```

See `TESTING_PATTERNS.md` and `TEAM_TRAINING.md` for detailed guidance on test patterns.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── dashboard/         # Dashboard-specific components
├── lib/                   # Core utilities and services
│   ├── db.ts             # Database schema and connection
│   ├── test-utils-clean.ts # Clean test utilities
│   └── services/         # Business logic services
└── tests/                # Integration tests
```

## Database Schema

The application uses SQLite with the following main tables:

- `users` - User accounts and profiles
- `assessment_types` - Types of assessments
- `assessment_periods` - Time periods for assessments
- `assessment_templates` - Reusable assessment templates
- `assessment_categories` - Question categories
- `assessment_questions` - Individual questions
- `assessment_instances` - Assessment attempts
- `assessment_responses` - User responses to questions
- `manager_relationships` - Reporting relationships
- `invitations` - Assessment invitations
- `magic_links` - Authentication tokens

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules and Prettier formatting
- Write tests for all new features
- Use the clean test patterns documented in `TESTING_PATTERNS.md`

### Testing

- Write tests using the clean factory function patterns
- Avoid complex test data builders
- Keep tests independent and stateless
- Use proper cleanup in beforeEach/afterEach

### Database

- Use Drizzle ORM for all database operations
- Define schemas in `src/lib/db.ts`
- Use migrations for schema changes
- Test database operations with the clean test utilities

## Contributing

1. Follow the established patterns and guidelines
2. Write tests for new features
3. Update documentation as needed
4. Use the code review checklist for tests

## License

This project is licensed under the MIT License.
