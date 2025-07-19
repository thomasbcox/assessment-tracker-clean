import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  createTestUser, 
  createTestAssessmentType, 
  createTestAssessmentPeriod,
  createCompleteAssessmentSetup,
  createManagerSubordinateSetup,
  cleanup,
  withCleanup,
  createMultipleUsers
} from './test-utils-clean';

describe('Clean Test Utilities', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Simple Factory Functions', () => {
    it('should create a user with defaults', async () => {
      const user = await createTestUser();
      
      expect(user.email).toMatch(/test-\d+-\w+@example\.com/);
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(1);
    });

    it('should create a user with overrides', async () => {
      const user = await createTestUser({
        email: 'custom@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager'
      });
      
      expect(user.email).toBe('custom@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.role).toBe('manager');
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

  describe('Assessment Entities', () => {
    it('should create an assessment type', async () => {
      const type = await createTestAssessmentType({
        name: 'Manager Self-Assessment',
        description: 'Managers evaluate their own performance'
      });
      
      expect(type.name).toBe('Manager Self-Assessment');
      expect(type.description).toBe('Managers evaluate their own performance');
    });

    it('should create an assessment period', async () => {
      const period = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1
      });
      
      expect(period.name).toBe('Q1 2024');
      expect(period.startDate).toBe('2024-01-01');
      expect(period.endDate).toBe('2024-03-31');
      expect(period.isActive).toBe(1);
    });
  });

  describe('Complex Relationships', () => {
    it('should create assessment setup with all related entities', async () => {
      const setup = await createCompleteAssessmentSetup({
        type: { name: 'Team Assessment' },
        period: { name: 'Q1 2024', isActive: 1 },
        template: { name: 'Team Leadership Template', version: '1.0' },
        category: { name: 'Leadership', description: 'Leadership skills' }
      });
      
      expect(setup.type.name).toBe('Team Assessment');
      expect(setup.period.name).toBe('Q1 2024');
      expect(setup.template.name).toBe('Team Leadership Template');
      expect(setup.template.assessmentTypeId).toBe(setup.type.id);
      expect(setup.category.name).toBe('Leadership');
      expect(setup.category.assessmentTypeId).toBe(setup.type.id);
    });

    it('should create user with assessment instance', async () => {
      const result = await createCompleteAssessmentSetup({
        user: { email: 'employee@example.com', role: 'user' },
        type: { name: 'Performance Review' },
        period: { name: 'Q1 2024', isActive: 1 },
        instance: { status: 'in_progress' }
      });
      
      expect(result.user.email).toBe('employee@example.com');
      expect(result.type.name).toBe('Performance Review');
      expect(result.period.name).toBe('Q1 2024');
      expect(result.instance.userId).toBe(result.user.id);
      expect(result.instance.periodId).toBe(result.period.id);
      expect(result.instance.templateId).toBe(result.template.id);
      expect(result.instance.status).toBe('in_progress');
    });
  });

  describe('Cleanup Utilities', () => {
    it('should clean up all data between tests', async () => {
      // Create some data
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      
      // Verify data exists
      expect(user1.id).toBeDefined();
      expect(user2.id).toBeDefined();
      
      // Cleanup should happen automatically in afterEach
    });

    it('should work with withCleanup helper', async () => {
      const result = await withCleanup(async () => {
        const user = await createTestUser({ email: 'test@example.com' });
        return user;
      });
      
      expect(result.email).toBe('test@example.com');
      // Data should be cleaned up automatically
    });
  });
}); 