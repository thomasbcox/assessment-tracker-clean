import { drizzle } from 'drizzle-orm/better-sqlite3';
import { db } from './db';
import { 
  users, assessmentTypes, assessmentPeriods, assessmentCategories, 
  assessmentTemplates, assessmentInstances, assessmentQuestions, 
  assessmentResponses, managerRelationships, invitations, magicLinks 
} from './db';
import type { 
  User, AssessmentType, AssessmentPeriod, AssessmentCategory,
  AssessmentTemplate, AssessmentInstance, AssessmentQuestion,
  AssessmentResponse, ManagerRelationship, Invitation, MagicLink,
  NewUser, NewAssessmentType, NewAssessmentPeriod, NewAssessmentCategory,
  NewAssessmentTemplate, NewAssessmentInstance, NewAssessmentQuestion,
  NewAssessmentResponse, NewManagerRelationship, NewInvitation, NewMagicLink
} from './db';

// ============================================================================
// SIMPLE FACTORY FUNCTIONS
// ============================================================================

/**
 * Create test data for a user with sensible defaults
 */
export const createTestUserData = (overrides: Partial<NewUser> = {}): NewUser => ({
  id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: 1,
  ...overrides
});

/**
 * Create test data for an assessment type
 */
export const createTestAssessmentTypeData = (overrides: Partial<NewAssessmentType> = {}): NewAssessmentType => ({
  name: `Test Type ${Date.now()}`,
  description: 'Test assessment type',
  purpose: 'Testing purposes',
  isActive: 1,
  ...overrides
});

/**
 * Create test data for an assessment period
 */
export const createTestAssessmentPeriodData = (overrides: Partial<NewAssessmentPeriod> = {}): NewAssessmentPeriod => ({
  name: `Test Period ${Date.now()}`,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  isActive: 0,
  ...overrides
});

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Insert a user and return the created entity
 */
export const insertTestUser = async (data: NewUser): Promise<User> => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

/**
 * Insert an assessment type and return the created entity
 */
export const insertTestAssessmentType = async (data: NewAssessmentType): Promise<AssessmentType> => {
  const [type] = await db.insert(assessmentTypes).values(data).returning();
  return type;
};

/**
 * Insert an assessment period and return the created entity
 */
export const insertTestAssessmentPeriod = async (data: NewAssessmentPeriod): Promise<AssessmentPeriod> => {
  const [period] = await db.insert(assessmentPeriods).values(data).returning();
  return period;
};

// ============================================================================
// COMPOSED OPERATIONS
// ============================================================================

/**
 * Create a user with the database operation
 */
export const createTestUser = async (overrides: Partial<NewUser> = {}): Promise<User> => {
  const userData = createTestUserData(overrides);
  return await insertTestUser(userData);
};

/**
 * Create an assessment type with the database operation
 */
export const createTestAssessmentType = async (overrides: Partial<NewAssessmentType> = {}): Promise<AssessmentType> => {
  const typeData = createTestAssessmentTypeData(overrides);
  return await insertTestAssessmentType(typeData);
};

/**
 * Create an assessment period with the database operation
 */
export const createTestAssessmentPeriod = async (overrides: Partial<NewAssessmentPeriod> = {}): Promise<AssessmentPeriod> => {
  const periodData = createTestAssessmentPeriodData(overrides);
  return await insertTestAssessmentPeriod(periodData);
};

// ============================================================================
// RELATIONSHIP HELPERS
// ============================================================================

/**
 * Create a complete assessment setup (type, period, template, category)
 */
export const createTestAssessmentSetup = async (overrides: {
  type?: Partial<NewAssessmentType>;
  period?: Partial<NewAssessmentPeriod>;
  template?: Partial<NewAssessmentTemplate>;
  category?: Partial<NewAssessmentCategory>;
} = {}) => {
  // Create the base entities
  const type = await createTestAssessmentType(overrides.type);
  const period = await createTestAssessmentPeriod(overrides.period);
  
  // Create template that references the type
  const templateData: NewAssessmentTemplate = {
    assessmentTypeId: type.id,
    name: `Test Template ${Date.now()}`,
    version: '1.0',
    description: 'Test template',
    isActive: 1,
    ...overrides.template
  };
  const [template] = await db.insert(assessmentTemplates).values(templateData).returning();
  
  // Create category that references the type
  const categoryData: NewAssessmentCategory = {
    assessmentTypeId: type.id,
    name: `Test Category ${Date.now()}`,
    description: 'Test category',
    displayOrder: 1,
    isActive: 1,
    ...overrides.category
  };
  const [category] = await db.insert(assessmentCategories).values(categoryData).returning();
  
  return { type, period, template, category };
};

/**
 * Create a user with an assessment instance
 */
export const createTestUserWithAssessment = async (overrides: {
  user?: Partial<NewUser>;
  assessmentSetup?: Parameters<typeof createTestAssessmentSetup>[0];
  instance?: Partial<NewAssessmentInstance>;
} = {}) => {
  const user = await createTestUser(overrides.user);
  const { type, period, template } = await createTestAssessmentSetup(overrides.assessmentSetup);
  
  const instanceData: NewAssessmentInstance = {
    userId: user.id,
    periodId: period.id,
    templateId: template.id,
    status: 'pending',
    ...overrides.instance
  };
  const [instance] = await db.insert(assessmentInstances).values(instanceData).returning();
  
  return { user, type, period, template, instance };
};

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up all test data
 */
export const cleanupTestData = async (): Promise<void> => {
  // Delete in dependency order (reverse of creation)
  await db.delete(assessmentResponses);
  await db.delete(invitations);
  await db.delete(assessmentQuestions);
  await db.delete(managerRelationships);
  await db.delete(assessmentInstances);
  await db.delete(assessmentCategories);
  await db.delete(assessmentTemplates);
  await db.delete(magicLinks);
  await db.delete(assessmentPeriods);
  await db.delete(assessmentTypes);
  await db.delete(users);
};

/**
 * Reset auto-increment counters
 */
export const resetCounters = async (): Promise<void> => {
  await db.run('DELETE FROM sqlite_sequence');
};

/**
 * Complete test cleanup
 */
export const cleanup = async (): Promise<void> => {
  await cleanupTestData();
  await resetCounters();
};

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Helper to run a test with automatic cleanup
 */
export const withCleanup = async <T>(testFn: () => Promise<T>): Promise<T> => {
  try {
    return await testFn();
  } finally {
    await cleanup();
  }
};

/**
 * Helper to create multiple users with unique emails
 */
export const createMultipleUsers = async (userConfigs: Array<Partial<NewUser>>): Promise<User[]> => {
  const users: User[] = [];
  for (let i = 0; i < userConfigs.length; i++) {
    const config = userConfigs[i];
    // Ensure unique email by adding timestamp and index
    const uniqueConfig = {
      ...config,
      email: config.email || `test-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}@example.com`
    };
    const user = await createTestUser(uniqueConfig);
    users.push(user);
  }
  return users;
}; 