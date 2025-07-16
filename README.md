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
- **Total Test Suites**: 21
- **Passing**: 3 suites (14%)
- **Failing**: 18 suites (86%)
- **Total Tests**: 168 (89 passing, 79 failing)

**Note**: Test suite has known issues with database constraints and API route testing that are being addressed.

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

- [Development Guidelines](DEVELOPMENT_GUIDELINES.md) - Coding standards and best practices
- [Testing Documentation](TESTING.md) - Comprehensive testing guide
- [Requirements](REQUIREMENTS.md) - Feature requirements and specifications
- [Roadmap](ROADMAP.md) - Development phases and progress

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
