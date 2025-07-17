# Assessment Tracker

A comprehensive performance evaluation system built with Next.js 15, TypeScript, and SQLite. Features role-based access control, assessment templates, and real-time tracking.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd assessment-tracker-clean

# Install dependencies
npm install

# Set up the database
npm run setup-db

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Check for missing "use client" directives
npm run check:client
```

### Current Test Status
- **Total Tests**: 267 tests across 23 test suites
- **Passing**: 188 tests (70.4%)
- **Failing**: 79 tests (29.6%)

**Note**: Core business logic and utilities have excellent test coverage. Remaining failures are primarily UI test expectations and legacy API route tests.

### Test Data Builder System
A comprehensive test data builder system has been implemented for robust testing with complex database relationships:

- **Dependency-aware architecture** with automatic foreign key management
- **Fluent configuration API** for easy test data creation
- **Type-safe builders** with full TypeScript support
- **Database cleanup utilities** for proper test isolation

**Service Layer Test Policy:**
- All service layer tests must use a real in-memory SQLite database and the test data builder system.
- **Mocking the database or ORM in service layer tests is strictly forbidden and enforced by ESLint.**
- See [TESTING.md](TESTING.md) for details on the policy and enforcement.

**Usage Example:**
```typescript
const builder = createSimpleTestDataBuilder(db);
const result = await builder.create({
  user: { email: 'manager@company.com', role: 'manager' },
  assessmentType: { name: 'Leadership Assessment' },
  assessmentPeriod: { name: 'Q1 2024', isActive: 1 }
});
```

See [TEST_DATA_BUILDER_SUMMARY.md](TEST_DATA_BUILDER_SUMMARY.md) for complete documentation.

## Logger Test Policy

Logger tests must:
- Capture and assert on real console output (no mocking of console or logger)
- Verify environment-specific output (development, test, production)
- Comply with the custom ESLint rule: `no-logger-mocking-in-tests`

See [TESTING.md](./TESTING.md#logger-test-policy) for details.

## 🛠️ Development

### Key Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components and UI library
- `src/lib/` - Database, authentication, and utility functions
- `src/types/` - TypeScript type definitions
- `scripts/` - Development and build scripts

## 📚 Documentation

### Core Documentation
- **[Architecture](ARCHITECTURE.md)** - System architecture and technical patterns
- **[Architecture Decisions](DECISIONS.md)** - Key technical decisions and rationale
- **[Development Guidelines](DEVELOPMENT_GUIDELINES.md)** - Coding standards and best practices
- **[Development History](DEVELOPMENT_HISTORY.md)** - Project timeline and milestones
- **[Service Layer Pattern](SERVICE_LAYER_PATTERN.md)** - API architecture and testing strategy
- **[Testing Documentation](TESTING.md)** - Comprehensive testing guide
- **[API Testing Strategy](API_TESTING_STRATEGY.md)** - Service layer testing approach
- **[Test Data Builder Summary](TEST_DATA_BUILDER_SUMMARY.md)** - Comprehensive test data builder system documentation

### Requirements & Planning
- **[Requirements](REQUIREMENTS.md)** - Feature requirements and specifications
- **[Roadmap](ROADMAP.md)** - Development phases and progress
- **[Database Schema](database-schema.md)** - Database design and relationships

### Technical Details
- **[ES Modules Migration](ES_MODULES_MIGRATION.md)** - Migration from CommonJS to ES modules
- **[Additional Tests](ADDITIONAL_TESTS.md)** - Extended testing scenarios

## 🧪 Testing Stack

- **Test Runner**: Jest 30.0.4
- **Component Testing**: @testing-library/react 16.3.0
- **TypeScript Support**: ts-jest with react-jsx
- **Test Environment**: jsdom for React component testing
- **Database Testing**: SQLite in-memory for integration tests

## 🚀 Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📖 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [React Documentation](https://react.dev/) - React features and concepts
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - TypeScript language guide
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework

## Email Delivery & Testing

- **Automated tests:** All email sending is mocked (no real emails sent).
- **Manual/E2E/Dev:** Uses Mailtrap for safe email delivery. Configure credentials in `.env.local` or your deployment secrets.
- **Secrets:** Set `MAILTRAP_USER` and `MAILTRAP_PASS` in your environment. Never commit real credentials to git.

### Configuring Mailtrap

1. Sign up at [Mailtrap.io](https://mailtrap.io/).
2. Get your SMTP credentials.
3. Add to your `.env.local`:
   ```env
   MAILTRAP_USER=your-mailtrap-username
   MAILTRAP_PASS=your-mailtrap-password
   ```
4. Emails sent in dev/staging will appear in your Mailtrap inbox.

### How it works
- The app uses `src/lib/mailer.ts` for all email delivery.
- In tests, the mailer is mocked using Jest.
- In dev/staging, real emails go to Mailtrap.
