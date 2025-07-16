import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import {
  createTestDataBuilder,
  createDatabaseCleanup,
  UserBuilder,
  AssessmentTypeBuilder,
  AssessmentPeriodBuilder,
  AssessmentCategoryBuilder,
  AssessmentTemplateBuilder,
  AssessmentInstanceBuilder,
  AssessmentQuestionBuilder,
  AssessmentResponseBuilder,
  ManagerRelationshipBuilder,
  InvitationBuilder,
  MagicLinkBuilder,
  type TestDataConfig,
  type TestDataResult,
} from './test-data-builder';
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

describe('TestDataBuilder System', () => {
  let db: ReturnType<typeof drizzle>;
  let connection: Database.Database;
  let cleanup: ReturnType<typeof createDatabaseCleanup>;

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

    cleanup = createDatabaseCleanup(db);
  });

  afterEach(async () => {
    await cleanup.reset();
    await connection.close();
  });

  describe('Individual Builders', () => {
    describe('UserBuilder', () => {
      it('should create user with default values', async () => {
        const user = await new UserBuilder().create(db);
        
        expect(user.id).toMatch(/^user-\d+-\d+$/);
        expect(user.email).toMatch(/^test-\d+-\d+@example\.com$/);
        expect(user.firstName).toBe('Test');
        expect(user.lastName).toBe('User');
        expect(user.role).toBe('user');
        expect(user.isActive).toBe(1);
      });

      it('should create user with custom values', async () => {
        const user = await new UserBuilder()
          .withId('custom-user')
          .withEmail('custom@example.com')
          .withFirstName('John')
          .withLastName('Doe')
          .withRole('admin')
          .withIsActive(0)
          .create(db);

        expect(user.id).toBe('custom-user');
        expect(user.email).toBe('custom@example.com');
        expect(user.firstName).toBe('John');
        expect(user.lastName).toBe('Doe');
        expect(user.role).toBe('admin');
        expect(user.isActive).toBe(0);
      });

      it('should build user object without creating in database', () => {
        const userData = new UserBuilder()
          .withId('test-user')
          .withEmail('test@example.com')
          .build();

        expect(userData.id).toBe('test-user');
        expect(userData.email).toBe('test@example.com');
        expect(userData.firstName).toBe('Test');
        expect(userData.lastName).toBe('User');
        expect(userData.role).toBe('user');
        expect(userData.isActive).toBe(1);
      });
    });

    describe('AssessmentTypeBuilder', () => {
      it('should create assessment type with default values', async () => {
        const type = await new AssessmentTypeBuilder().create(db);
        
        expect(type.name).toMatch(/^Assessment Type \d+$/);
        expect(type.description).toBe('Test assessment type');
        expect(type.purpose).toBe('Testing purposes');
        expect(type.isActive).toBe(1);
      });

      it('should create assessment type with custom values', async () => {
        const type = await new AssessmentTypeBuilder()
          .withName('Leadership Assessment')
          .withDescription('Assess leadership skills')
          .withPurpose('Leadership development')
          .withIsActive(0)
          .create(db);

        expect(type.name).toBe('Leadership Assessment');
        expect(type.description).toBe('Assess leadership skills');
        expect(type.purpose).toBe('Leadership development');
        expect(type.isActive).toBe(0);
      });
    });

    describe('AssessmentPeriodBuilder', () => {
      it('should create assessment period with default values', async () => {
        const period = await new AssessmentPeriodBuilder().create(db);
        
        expect(period.name).toMatch(/^Period \d+$/);
        expect(period.startDate).toBe('2024-01-01');
        expect(period.endDate).toBe('2024-12-31');
        expect(period.isActive).toBe(0);
      });

      it('should create assessment period with custom values', async () => {
        const period = await new AssessmentPeriodBuilder()
          .withName('Q1 2024')
          .withStartDate('2024-01-01')
          .withEndDate('2024-03-31')
          .withIsActive(1)
          .create(db);

        expect(period.name).toBe('Q1 2024');
        expect(period.startDate).toBe('2024-01-01');
        expect(period.endDate).toBe('2024-03-31');
        expect(period.isActive).toBe(1);
      });
    });
  });

  describe('Dependent Builders', () => {
    describe('AssessmentCategoryBuilder', () => {
      it('should require assessmentTypeId', async () => {
        const builder = new AssessmentCategoryBuilder();
        
        expect(() => builder.build()).toThrow('AssessmentTypeId is required for AssessmentCategory');
      });

      it('should create category with assessment type', async () => {
        const assessmentType = await new AssessmentTypeBuilder().create(db);
        const category = await new AssessmentCategoryBuilder()
          .withAssessmentTypeId(assessmentType.id)
          .withName('Technical Skills')
          .withDescription('Technical competency assessment')
          .withDisplayOrder(1)
          .create(db);

        expect(category.assessmentTypeId).toBe(assessmentType.id);
        expect(category.name).toBe('Technical Skills');
        expect(category.description).toBe('Technical competency assessment');
        expect(category.displayOrder).toBe(1);
      });
    });

    describe('AssessmentTemplateBuilder', () => {
      it('should require assessmentTypeId', async () => {
        const builder = new AssessmentTemplateBuilder();
        
        expect(() => builder.build()).toThrow('AssessmentTypeId is required for AssessmentTemplate');
      });

      it('should create template with assessment type', async () => {
        const assessmentType = await new AssessmentTypeBuilder().create(db);
        const template = await new AssessmentTemplateBuilder()
          .withAssessmentTypeId(assessmentType.id)
          .withName('Leadership Template')
          .withVersion('2.0')
          .withDescription('Leadership assessment template')
          .create(db);

        expect(template.assessmentTypeId).toBe(assessmentType.id);
        expect(template.name).toBe('Leadership Template');
        expect(template.version).toBe('2.0');
        expect(template.description).toBe('Leadership assessment template');
      });
    });

    describe('AssessmentInstanceBuilder', () => {
      it('should require userId, periodId, and templateId', async () => {
        const builder = new AssessmentInstanceBuilder();
        
        expect(() => builder.build()).toThrow('UserId, PeriodId, and TemplateId are required for AssessmentInstance');
      });

      it('should create instance with all required dependencies', async () => {
        const user = await new UserBuilder().create(db);
        const period = await new AssessmentPeriodBuilder().create(db);
        const assessmentType = await new AssessmentTypeBuilder().create(db);
        const template = await new AssessmentTemplateBuilder()
          .withAssessmentTypeId(assessmentType.id)
          .create(db);

        const instance = await new AssessmentInstanceBuilder()
          .withUserId(user.id)
          .withPeriodId(period.id)
          .withTemplateId(template.id)
          .withStatus('in_progress')
          .withStartedAt('2024-01-15T10:00:00Z')
          .withDueDate('2024-01-31T23:59:59Z')
          .create(db);

        expect(instance.userId).toBe(user.id);
        expect(instance.periodId).toBe(period.id);
        expect(instance.templateId).toBe(template.id);
        expect(instance.status).toBe('in_progress');
        expect(instance.startedAt).toBe('2024-01-15T10:00:00Z');
        expect(instance.dueDate).toBe('2024-01-31T23:59:59Z');
      });
    });
  });

  describe('TestDataBuilder - Main Builder', () => {
    it('should create minimal test data', async () => {
      const builder = createTestDataBuilder(db);
      const result = await builder.create();

      expect(result.user).toBeDefined();
      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentPeriod).toBeDefined();
    });

    it('should create complete assessment workflow', async () => {
      const builder = createTestDataBuilder(db);
      const result = await builder.create({
        user: { email: 'manager@example.com', role: 'manager' },
        assessmentType: { name: 'Leadership Assessment' },
        assessmentPeriod: { name: 'Q1 2024', isActive: 1 },
        assessmentCategory: { name: 'Leadership Skills' },
        assessmentTemplate: { name: 'Leadership Template', version: '1.0' },
        assessmentInstance: { status: 'in_progress' },
        assessmentQuestion: { questionText: 'How do you handle conflict?' },
        assessmentResponse: { score: 8, notes: 'Good conflict resolution skills' },
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
      expect(result.user!.email).toBe('manager@example.com');
      expect(result.user!.role).toBe('manager');
      expect(result.assessmentType!.name).toBe('Leadership Assessment');
      expect(result.assessmentPeriod!.name).toBe('Q1 2024');
      expect(result.assessmentPeriod!.isActive).toBe(1);
      expect(result.assessmentCategory!.name).toBe('Leadership Skills');
      expect(result.assessmentTemplate!.name).toBe('Leadership Template');
      expect(result.assessmentTemplate!.version).toBe('1.0');
      expect(result.assessmentInstance!.status).toBe('in_progress');
      expect(result.assessmentQuestion!.questionText).toBe('How do you handle conflict?');
      expect(result.assessmentResponse!.score).toBe(8);
      expect(result.assessmentResponse!.notes).toBe('Good conflict resolution skills');
    });

    it('should create manager relationship', async () => {
      const builder = createTestDataBuilder(db);
      const result = await builder.create({
        user: { email: 'manager@example.com', role: 'manager' },
        assessmentPeriod: { name: 'Q1 2024' },
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
      const builder = createTestDataBuilder(db);
      const result = await builder.create({
        user: { email: 'manager@example.com', role: 'manager' },
        assessmentType: { name: 'Leadership Assessment' },
        assessmentPeriod: { name: 'Q1 2024' },
        invitation: { email: 'invite@example.com' },
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
      expect(result.invitation!.email).toBe('invite@example.com');
      expect(result.invitation!.status).toBe('pending');
      expect(result.invitation!.token).toBeDefined();
    });

    it('should create magic link', async () => {
      const builder = createTestDataBuilder(db);
      const result = await builder.create({
        magicLink: { email: 'user@example.com' },
      });

      expect(result.magicLink).toBeDefined();
      expect(result.magicLink!.email).toBe('user@example.com');
      expect(result.magicLink!.token).toBeDefined();
      expect(result.magicLink!.used).toBe(0);
      expect(result.magicLink!.expiresAt).toBeDefined();
    });
  });

  describe('DatabaseCleanup', () => {
    it('should truncate all tables', async () => {
      // Create some test data
      const builder = createTestDataBuilder(db);
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
      const type1 = await new AssessmentTypeBuilder().create(db);
      const type2 = await new AssessmentTypeBuilder().create(db);

      expect(type1.id).toBe(1);
      expect(type2.id).toBe(2);

      // Reset counters
      await cleanup.resetCounters();

      // Create new data - should start from 1 again
      const type3 = await new AssessmentTypeBuilder().create(db);
      expect(type3.id).toBe(1);
    });

    it('should perform complete reset', async () => {
      // Create test data
      const builder = createTestDataBuilder(db);
      await builder.create({
        user: { email: 'test@example.com' },
        assessmentType: { name: 'Test Type' },
      });

      // Verify data exists
      const users = await db.select().from(users);
      const types = await db.select().from(assessmentTypes);
      expect(users).toHaveLength(1);
      expect(types).toHaveLength(1);

      // Complete reset
      await cleanup.reset();

      // Verify all tables are empty
      const usersAfter = await db.select().from(users);
      const typesAfter = await db.select().from(assessmentTypes);
      expect(usersAfter).toHaveLength(0);
      expect(typesAfter).toHaveLength(0);

      // Verify counters are reset
      const typeNew = await new AssessmentTypeBuilder().create(db);
      expect(typeNew.id).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex nested relationships', async () => {
      const builder = createTestDataBuilder(db);
      const result = await builder.create({
        user: { email: 'manager@example.com', role: 'manager' },
        assessmentType: { name: 'Leadership Assessment' },
        assessmentPeriod: { name: 'Q1 2024', isActive: 1 },
        assessmentCategory: { name: 'Leadership Skills' },
        assessmentTemplate: { name: 'Leadership Template', version: '1.0' },
        assessmentInstance: { status: 'in_progress' },
        assessmentQuestion: { questionText: 'How do you handle conflict?' },
        assessmentResponse: { score: 8, notes: 'Good conflict resolution skills' },
        managerRelationship: {},
        invitation: { email: 'invite@example.com' },
        magicLink: { email: 'user@example.com' },
      });

      // Verify all entities exist and have correct relationships
      expect(result.user).toBeDefined();
      expect(result.assessmentType).toBeDefined();
      expect(result.assessmentPeriod).toBeDefined();
      expect(result.assessmentCategory).toBeDefined();
      expect(result.assessmentTemplate).toBeDefined();
      expect(result.assessmentInstance).toBeDefined();
      expect(result.assessmentQuestion).toBeDefined();
      expect(result.assessmentResponse).toBeDefined();
      expect(result.managerRelationship).toBeDefined();
      expect(result.invitation).toBeDefined();
      expect(result.magicLink).toBeDefined();

      // Verify foreign key relationships are maintained
      expect(result.assessmentCategory!.assessmentTypeId).toBe(result.assessmentType!.id);
      expect(result.assessmentTemplate!.assessmentTypeId).toBe(result.assessmentType!.id);
      expect(result.assessmentInstance!.userId).toBe(result.user!.id);
      expect(result.assessmentInstance!.periodId).toBe(result.assessmentPeriod!.id);
      expect(result.assessmentInstance!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.assessmentQuestion!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.assessmentQuestion!.categoryId).toBe(result.assessmentCategory!.id);
      expect(result.assessmentResponse!.instanceId).toBe(result.assessmentInstance!.id);
      expect(result.assessmentResponse!.questionId).toBe(result.assessmentQuestion!.id);
      expect(result.managerRelationship!.managerId).toBe(result.user!.id);
      expect(result.managerRelationship!.periodId).toBe(result.assessmentPeriod!.id);
      expect(result.invitation!.managerId).toBe(result.user!.id);
      expect(result.invitation!.templateId).toBe(result.assessmentTemplate!.id);
      expect(result.invitation!.periodId).toBe(result.assessmentPeriod!.id);
    });

    it('should handle multiple test runs with cleanup', async () => {
      const builder = createTestDataBuilder(db);

      // First test run
      const result1 = await builder.create({
        user: { email: 'user1@example.com' },
        assessmentType: { name: 'Type 1' },
      });

      expect(result1.user!.email).toBe('user1@example.com');
      expect(result1.assessmentType!.name).toBe('Type 1');

      // Cleanup
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