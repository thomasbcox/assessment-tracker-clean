import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { 
  users, 
  assessmentTypes, 
  assessmentCategories, 
  assessmentTemplates, 
  assessmentQuestions, 
  assessmentPeriods,
  magicLinks,
  managerRelationships,
  assessmentInstances,
  assessmentResponses,
  invitations
} from './db';
import { eq } from 'drizzle-orm';

/**
 * Test Database Utilities for Three-Layer Testing Strategy
 */

// Layer 2: In-Memory SQLite with Cleanup
export class TestDatabase {
  private db: ReturnType<typeof drizzle>;
  protected connection: Database.Database;

  constructor() {
    this.connection = new Database(':memory:');
    this.db = drizzle(this.connection);
    this.initializeSchema();
  }

  private initializeSchema() {
    // Create tables in the correct order (dependencies first)
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        purpose TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_periods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_type_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        display_order INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id)
      );

      CREATE TABLE IF NOT EXISTS assessment_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_type_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id),
        UNIQUE(name, version)
      );

      CREATE TABLE IF NOT EXISTS assessment_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES assessment_templates(id),
        FOREIGN KEY (category_id) REFERENCES assessment_categories(id)
      );

      CREATE TABLE IF NOT EXISTS assessment_instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        period_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        started_at TEXT,
        completed_at TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (period_id) REFERENCES assessment_periods(id),
        FOREIGN KEY (template_id) REFERENCES assessment_templates(id)
      );

      CREATE TABLE IF NOT EXISTS assessment_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instance_id) REFERENCES assessment_instances(id),
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
      );

      CREATE TABLE IF NOT EXISTS manager_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id TEXT NOT NULL,
        subordinate_id TEXT NOT NULL,
        period_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES users(id),
        FOREIGN KEY (subordinate_id) REFERENCES users(id),
        FOREIGN KEY (period_id) REFERENCES assessment_periods(id),
        UNIQUE(manager_id, subordinate_id, period_id)
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id TEXT NOT NULL,
        template_id INTEGER NOT NULL,
        period_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        status TEXT DEFAULT 'pending',
        token TEXT NOT NULL UNIQUE,
        invited_at TEXT DEFAULT CURRENT_TIMESTAMP,
        accepted_at TEXT,
        expires_at TEXT NOT NULL,
        reminder_count INTEGER DEFAULT 0,
        last_reminder_sent TEXT,
        FOREIGN KEY (manager_id) REFERENCES users(id),
        FOREIGN KEY (template_id) REFERENCES assessment_templates(id),
        FOREIGN KEY (period_id) REFERENCES assessment_periods(id)
      );

      CREATE TABLE IF NOT EXISTS magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  getDatabase() {
    return this.db;
  }

  async cleanup() {
    // Clean all tables in reverse dependency order
    await this.db.delete(assessmentResponses);
    await this.db.delete(assessmentInstances);
    await this.db.delete(invitations);
    await this.db.delete(managerRelationships);
    await this.db.delete(magicLinks);
    await this.db.delete(assessmentQuestions);
    await this.db.delete(assessmentTemplates);
    await this.db.delete(assessmentCategories);
    await this.db.delete(assessmentPeriods);
    await this.db.delete(assessmentTypes);
    await this.db.delete(users);
  }

  async close() {
    await this.connection.close();
  }
}

// Layer 3: Transaction-Based Testing
export class TransactionTestDatabase extends TestDatabase {
  async withTransaction<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.connection.exec('BEGIN TRANSACTION');
      
      fn(this.getDatabase())
        .then(result => {
          this.connection.exec('ROLLBACK');
          resolve(result);
        })
        .catch(error => {
          this.connection.exec('ROLLBACK');
          reject(error);
        });
    });
  }
}

// Test Data Factories
export class TestDataFactory {
  private counter = 1;

  private getUniqueId(): number {
    return Date.now() + this.counter++;
  }

  createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
    return {
      id: `test-user-${this.getUniqueId()}`,
      email: `test${this.getUniqueId()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  createAssessmentType(overrides: Partial<typeof assessmentTypes.$inferInsert> = {}) {
    return {
      id: this.getUniqueId(),
      name: `Test Type ${this.getUniqueId()}`,
      description: 'A test assessment type',
      purpose: 'Testing purposes',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  createAssessmentCategory(overrides: Partial<typeof assessmentCategories.$inferInsert> = {}) {
    return {
      id: this.getUniqueId(),
      assessmentTypeId: overrides.assessmentTypeId || 1,
      name: `Test Category ${this.getUniqueId()}`,
      description: 'A test category',
      displayOrder: 1,
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  createAssessmentTemplate(overrides: Partial<typeof assessmentTemplates.$inferInsert> = {}) {
    return {
      id: this.getUniqueId(),
      assessmentTypeId: overrides.assessmentTypeId || 1,
      name: `Test Template ${this.getUniqueId()}`,
      version: '1.0',
      description: 'A test template',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  createAssessmentPeriod(overrides: Partial<typeof assessmentPeriods.$inferInsert> = {}) {
    return {
      id: this.getUniqueId(),
      name: `Test Period ${this.getUniqueId()}`,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  createMagicLink(overrides: Partial<typeof magicLinks.$inferInsert> = {}) {
    return {
      id: `test-token-${this.getUniqueId()}`,
      email: `test${this.getUniqueId()}@example.com`,
      token: `token-${this.getUniqueId()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isUsed: 0,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }
}

// Global test utilities
export const testDb = new TestDatabase();
export const transactionDb = new TransactionTestDatabase();
export const testData = new TestDataFactory();

// Setup and teardown helpers
export async function setupTestDatabase() {
  await testDb.cleanup();
}

export async function teardownTestDatabase() {
  await testDb.cleanup();
  await testDb.close();
}

// Layer 1: Mock Database for Unit Tests
export const mockDatabase = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  where: jest.fn(),
  eq: jest.fn(),
};

// Reset all mocks
export function resetDatabaseMocks() {
  jest.clearAllMocks();
  Object.values(mockDatabase).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
} 