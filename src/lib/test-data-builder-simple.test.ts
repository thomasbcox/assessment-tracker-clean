import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import {
  createSimpleTestDataBuilder,
  createSimpleDatabaseCleanup,
  type TestDataConfig,
  type TestDataResult,
} from './test-data-builder-simple';
import {
  users,
  assessmentTypes,
  assessmentPeriods,
  assessmentCategories,
  assessmentTemplates,
  assessmentQuestions,
  assessmentInstances,
  assessmentResponses,
  managerRelationships,
  invitations,
  magicLinks,
} from './db';

describe('SimpleTestDataBuilder', () => {
  let db: ReturnType<typeof drizzle>;
  let connection: Database.Database;
  let cleanup: ReturnType<typeof createSimpleDatabaseCleanup>;

  beforeEach(async () => {
    // Create in-memory test database
    connection = new Database(':memory:');
    db = drizzle(connection);
    
    // Initialize schema
    await connection.exec(`
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

    cleanup = createSimpleDatabaseCleanup(db);
  });

  afterEach(async () => {
    await cleanup.reset();
    await connection.close();
  });

  describe('Basic Functionality', () => {
    it('should create user with custom data', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        user: {
          email: 'john.doe@company.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'manager',
        },
      });

      expect(result.user).toBeDefined();
      expect(result.user!.email).toBe('john.doe@company.com');
      expect(result.user!.firstName).toBe('John');
      expect(result.user!.lastName).toBe('Doe');
      expect(result.user!.role).toBe('manager');
    });

    it('should create assessment type with custom data', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        assessmentType: {
          name: 'Leadership Assessment',
          description: 'Comprehensive leadership evaluation',
          purpose: 'Leadership development',
        },
      });

      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentType!.name).toBe('Leadership Assessment');
      expect(result.assessmentType!.description).toBe('Comprehensive leadership evaluation');
      expect(result.assessmentType!.purpose).toBe('Leadership development');
    });

    it('should create assessment period with custom data', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        assessmentPeriod: {
          name: 'Q1 2024',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          isActive: 1,
        },
      });

      expect(result.assessmentPeriod).toBeDefined();
      expect(result.assessmentPeriod!.name).toBe('Q1 2024');
      expect(result.assessmentPeriod!.startDate).toBe('2024-01-01');
      expect(result.assessmentPeriod!.endDate).toBe('2024-03-31');
      expect(result.assessmentPeriod!.isActive).toBe(1);
    });
  });

  describe('Dependent Entities', () => {
    it('should create assessment category with auto-created assessment type', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        assessmentCategory: {
          name: 'Technical Skills',
          description: 'Technical competency assessment',
        },
      });

      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentCategory).toBeDefined();
      expect(result.assessmentCategory!.name).toBe('Technical Skills');
      expect(result.assessmentCategory!.description).toBe('Technical competency assessment');
      expect(result.assessmentCategory!.assessmentTypeId).toBe(result.assessmentType!.id);
    });

    it('should create assessment template with auto-created assessment type', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        assessmentTemplate: {
          name: 'Leadership Template',
          version: '2.0',
          description: 'Leadership assessment template',
        },
      });

      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentTemplate).toBeDefined();
      expect(result.assessmentTemplate!.name).toBe('Leadership Template');
      expect(result.assessmentTemplate!.version).toBe('2.0');
      expect(result.assessmentTemplate!.description).toBe('Leadership assessment template');
      expect(result.assessmentTemplate!.assessmentTypeId).toBe(result.assessmentType!.id);
    });

    it('should create assessment instance with all required dependencies', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        assessmentInstance: {
          status: 'in_progress',
        },
      });

      expect(result.user).toBeDefined();
      expect(result.assessmentPeriod).toBeDefined();
      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentTemplate).toBeDefined();
      expect(result.assessmentInstance).toBeDefined();

      expect(result.assessmentInstance!.userId).toBe(result.user!.id);
      expect(result.assessmentInstance!.periodId).toBe(result.assessmentPeriod!.id);
      expect(result.assessmentInstance!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.assessmentInstance!.status).toBe('in_progress');
    });
  });

  describe('Complex Workflows', () => {
    it('should create complete assessment workflow', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        user: {
          email: 'manager@company.com',
          role: 'manager',
        },
        assessmentType: {
          name: 'Leadership Assessment',
        },
        assessmentPeriod: {
          name: 'Q1 2024',
          isActive: 1,
        },
        assessmentCategory: {
          name: 'Communication Skills',
        },
        assessmentTemplate: {
          name: 'Leadership Template',
          version: '1.0',
        },
        assessmentInstance: {
          status: 'in_progress',
        },
        assessmentQuestion: {
          questionText: 'How do you handle difficult conversations?',
        },
        assessmentResponse: {
          score: 8,
          notes: 'Good conflict resolution skills',
        },
      });

      // Verify all entities were created
      expect(result.user).toBeDefined();
      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentPeriod).toBeDefined();
      expect(result.assessmentCategory).toBeDefined();
      expect(result.assessmentTemplate).toBeDefined();
      expect(result.assessmentInstance).toBeDefined();
      expect(result.assessmentQuestion).toBeDefined();
      expect(result.assessmentResponse).toBeDefined();

      // Verify relationships
      expect(result.assessmentCategory!.assessmentTypeId).toBe(result.assessmentType!.id);
      expect(result.assessmentTemplate!.assessmentTypeId).toBe(result.assessmentType!.id);
      expect(result.assessmentInstance!.userId).toBe(result.user!.id);
      expect(result.assessmentInstance!.periodId).toBe(result.assessmentPeriod!.id);
      expect(result.assessmentInstance!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.assessmentQuestion!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.assessmentQuestion!.categoryId).toBe(result.assessmentCategory!.id);
      expect(result.assessmentResponse!.instanceId).toBe(result.assessmentInstance!.id);
      expect(result.assessmentResponse!.questionId).toBe(result.assessmentQuestion!.id);

      // Verify custom values
      expect(result.user!.email).toBe('manager@company.com');
      expect(result.user!.role).toBe('manager');
      expect(result.assessmentType!.name).toBe('Leadership Assessment');
      expect(result.assessmentPeriod!.name).toBe('Q1 2024');
      expect(result.assessmentPeriod!.isActive).toBe(1);
      expect(result.assessmentCategory!.name).toBe('Communication Skills');
      expect(result.assessmentTemplate!.name).toBe('Leadership Template');
      expect(result.assessmentTemplate!.version).toBe('1.0');
      expect(result.assessmentInstance!.status).toBe('in_progress');
      expect(result.assessmentQuestion!.questionText).toBe('How do you handle difficult conversations?');
      expect(result.assessmentResponse!.score).toBe(8);
      expect(result.assessmentResponse!.notes).toBe('Good conflict resolution skills');
    });

    it('should create manager relationship', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        user: {
          email: 'manager@company.com',
          role: 'manager',
        },
        assessmentPeriod: {
          name: 'Q1 2024',
        },
        managerRelationship: {},
      });

      expect(result.user).toBeDefined();
      expect(result.assessmentPeriod).toBeDefined();
      expect(result.managerRelationship).toBeDefined();

      // Verify manager relationship
      expect(result.managerRelationship!.managerId).toBe(result.user!.id);
      expect(result.managerRelationship!.periodId).toBe(result.assessmentPeriod!.id);
      expect(result.managerRelationship!.subordinateId).toBeDefined();
      expect(result.managerRelationship!.subordinateId).not.toBe(result.user!.id);
    });

    it('should create invitation', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        user: {
          email: 'manager@company.com',
          role: 'manager',
        },
        assessmentType: {
          name: 'Performance Review',
        },
        assessmentPeriod: {
          name: 'Annual 2024',
        },
        invitation: {
          email: 'newemployee@company.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      });

      expect(result.user).toBeDefined();
      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentTemplate).toBeDefined();
      expect(result.assessmentPeriod).toBeDefined();
      expect(result.invitation).toBeDefined();

      // Verify invitation
      expect(result.invitation!.managerId).toBe(result.user!.id);
      expect(result.invitation!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.invitation!.periodId).toBe(result.assessmentPeriod!.id);
      expect(result.invitation!.email).toBe('newemployee@company.com');
      expect(result.invitation!.firstName).toBe('Jane');
      expect(result.invitation!.lastName).toBe('Smith');
      expect(result.invitation!.status).toBe('pending');
      expect(result.invitation!.token).toBeDefined();
    });

    it('should create magic link', async () => {
      const builder = createSimpleTestDataBuilder(db);
      const result = await builder.create({
        magicLink: {
          email: 'user@company.com',
        },
      });

      expect(result.magicLink).toBeDefined();
      expect(result.magicLink!.email).toBe('user@company.com');
      expect(result.magicLink!.token).toBeDefined();
      expect(result.magicLink!.used).toBe(0);
      expect(result.magicLink!.expiresAt).toBeDefined();
    });
  });

  describe('Database Cleanup', () => {
    it('should truncate all tables', async () => {
      // Create some test data
      const builder = createSimpleTestDataBuilder(db);
      await builder.create({
        user: { email: 'test@example.com' },
        assessmentType: { name: 'Test Type' },
        assessmentPeriod: { name: 'Test Period' },
      });

      // Verify data exists
      const userRecords = await db.select().from(users);
      const types = await db.select().from(assessmentTypes);
      const periods = await db.select().from(assessmentPeriods);

      expect(userRecords).toHaveLength(1);
      expect(types).toHaveLength(1);
      expect(periods).toHaveLength(1);

      // Truncate all tables
      await cleanup.truncateAll();

      // Verify all tables are empty
      const usersAfter = await db.select().from(users);
      const typesAfter = await db.select().from(assessmentTypes);
      const periodsAfter = await db.select().from(assessmentPeriods);

      expect(usersAfter).toHaveLength(0);
      expect(typesAfter).toHaveLength(0);
      expect(periodsAfter).toHaveLength(0);
    });

    it('should reset auto-increment counters', async () => {
      // Create some test data
      const type1 = await db.insert(assessmentTypes).values({
        name: 'Type 1',
        description: 'Test type 1',
        purpose: 'Testing',
        isActive: 1,
      }).returning();

      const type2 = await db.insert(assessmentTypes).values({
        name: 'Type 2',
        description: 'Test type 2',
        purpose: 'Testing',
        isActive: 1,
      }).returning();

      expect(type1[0].id).toBe(1);
      expect(type2[0].id).toBe(2);

      // Reset counters
      await cleanup.resetCounters();

      // Create new data - should start from 1 again
      const type3 = await db.insert(assessmentTypes).values({
        name: 'Type 3',
        description: 'Test type 3',
        purpose: 'Testing',
        isActive: 1,
      }).returning();

      expect(type3[0].id).toBe(1);
    });

    it('should perform complete reset', async () => {
      // Create test data
      const builder = createSimpleTestDataBuilder(db);
      await builder.create({
        user: { email: 'test@example.com' },
        assessmentType: { name: 'Test Type' },
      });

      // Verify data exists
      const userRecords = await db.select().from(users);
      const types = await db.select().from(assessmentTypes);
      expect(userRecords).toHaveLength(1);
      expect(types).toHaveLength(1);

      // Complete reset
      await cleanup.reset();

      // Verify all tables are empty
      const usersAfter = await db.select().from(users);
      const typesAfter = await db.select().from(assessmentTypes);
      expect(usersAfter).toHaveLength(0);
      expect(typesAfter).toHaveLength(0);

      // Verify counters are reset
      const typeNew = await db.insert(assessmentTypes).values({
        name: 'New Type',
        description: 'New test type',
        purpose: 'Testing',
        isActive: 1,
      }).returning();

      expect(typeNew[0].id).toBe(1);
    });
  });

  describe('Multiple Test Runs', () => {
    it('should handle multiple test runs with cleanup', async () => {
      const builder = createSimpleTestDataBuilder(db);
      
      // First test run
      const result1 = await builder.create({
        user: { email: 'user1@example.com' },
        assessmentType: { name: 'Type 1' },
      });

      expect(result1.user!.email).toBe('user1@example.com');
      expect(result1.assessmentType!.name).toBe('Type 1');

      // Clean up for next scenario
      await cleanup.reset();

      // Second test run
      const result2 = await builder.create({
        user: { email: 'user2@example.com' },
        assessmentType: { name: 'Type 2' },
      });

      expect(result2.user!.email).toBe('user2@example.com');
      expect(result2.assessmentType!.name).toBe('Type 2');

      // Verify no data from first run remains
      const allUsers = await db.select().from(users);
      const allTypes = await db.select().from(assessmentTypes);

      expect(allUsers).toHaveLength(1);
      expect(allTypes).toHaveLength(1);
      expect(allUsers[0].email).toBe('user2@example.com');
      expect(allTypes[0].name).toBe('Type 2');
    });
  });
}); 