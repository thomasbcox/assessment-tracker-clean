import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { db, users, assessmentPeriods, assessmentTypes } from './db';
import { 
  createTestUser, 
  createTestAssessmentType, 
  createTestAssessmentPeriod,
  createCompleteAssessmentSetup,
  cleanup,
  createMultipleUsers
} from './test-utils-clean';

describe('Database Integration Tests', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('User Management', () => {
    it('should create and retrieve a user', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.role).toBe('user');
    });

    it('should create multiple users with unique emails', async () => {
      const users = await createMultipleUsers([
        { email: 'user1@example.com', role: 'user' },
        { email: 'user2@example.com', role: 'manager' }
      ]);

      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[0].role).toBe('user');
      expect(users[1].email).toBe('user2@example.com');
      expect(users[1].role).toBe('manager');
    });
  });

  describe('Assessment Period Management', () => {
    it('should create and retrieve an assessment period', async () => {
      const period = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1,
      });

      expect(period).toBeDefined();
      expect(period.name).toBe('Q1 2024');
      expect(period.startDate).toBe('2024-01-01');
      expect(period.endDate).toBe('2024-03-31');
      expect(period.isActive).toBe(1);
    });

    it('should create multiple assessment periods', async () => {
      const period1 = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1,
      });

      const period2 = await createTestAssessmentPeriod({
        name: 'Q2 2024',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isActive: 0,
      });

      expect(period1.name).toBe('Q1 2024');
      expect(period1.isActive).toBe(1);
      expect(period2.name).toBe('Q2 2024');
      expect(period2.isActive).toBe(0);
    });
  });

  describe('Assessment Type Management', () => {
    it('should create and retrieve an assessment type', async () => {
      const type = await createTestAssessmentType({
        name: 'Manager Self-Assessment',
        description: 'Managers evaluate their own performance',
      });

      expect(type).toBeDefined();
      expect(type.name).toBe('Manager Self-Assessment');
      expect(type.description).toBe('Managers evaluate their own performance');
    });
  });

  describe('Complex Relationships', () => {
    it('should create assessment template with categories and questions', async () => {
      const setup = await createCompleteAssessmentSetup({
        type: { name: 'Team Assessment' },
        period: { name: 'Q1 2024', isActive: 1 },
        template: { 
          name: 'Team Leadership Template',
          version: '1.0',
        },
        category: { name: 'Leadership' },
      });

      // Verify all entities were created
      expect(setup.type).toBeDefined();
      expect(setup.period).toBeDefined();
      expect(setup.category).toBeDefined();
      expect(setup.template).toBeDefined();

      // Verify relationships
      expect(setup.template.assessmentTypeId).toBe(setup.type.id);
      expect(setup.category.assessmentTypeId).toBe(setup.type.id);
    });

    it('should create assessment instance for a user', async () => {
      // Create employee with assessment
      const result = await createCompleteAssessmentSetup({
        user: { 
          email: 'employee@example.com', 
          role: 'user' 
        },
        type: { name: 'Team Assessment' },
        period: { name: 'Q1 2024', isActive: 1 },
        instance: { status: 'pending' }
      });

      // Verify relationships
      expect(result.user.email).toBe('employee@example.com');
      expect(result.instance.userId).toBe(result.user.id);
      expect(result.instance.periodId).toBe(result.period.id);
      expect(result.instance.templateId).toBe(result.template.id);
    });
  });

  describe('Database Cleanup', () => {
    it('should properly clean up all tables', async () => {
      // Create some test data
      await createTestUser({ email: 'test@example.com' });
      await createTestAssessmentPeriod({ name: 'Test Period' });
      await createTestAssessmentType({ name: 'Test Type' });

      // Verify data exists
      const userCount = await db.select().from(users).all();
      const periodCount = await db.select().from(assessmentPeriods).all();
      const typeCount = await db.select().from(assessmentTypes).all();

      expect(userCount.length).toBeGreaterThan(0);
      expect(periodCount.length).toBeGreaterThan(0);
      expect(typeCount.length).toBeGreaterThan(0);

      // Clean up
      await cleanup();

      // Verify data is gone
      const userCountAfter = await db.select().from(users).all();
      const periodCountAfter = await db.select().from(assessmentPeriods).all();
      const typeCountAfter = await db.select().from(assessmentTypes).all();

      expect(userCountAfter.length).toBe(0);
      expect(periodCountAfter.length).toBe(0);
      expect(typeCountAfter.length).toBe(0);
    });
  });
}); 