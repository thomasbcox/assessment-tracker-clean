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

/**
 * Create test data for an assessment category
 */
export const createTestAssessmentCategoryData = (overrides: Partial<NewAssessmentCategory> = {}): NewAssessmentCategory => ({
  assessmentTypeId: overrides.assessmentTypeId || 1,
  name: `Test Category ${Date.now()}`,
  description: 'Test category description',
  displayOrder: 1,
  isActive: 1,
  ...overrides
});

/**
 * Create test data for an assessment template
 */
export const createTestAssessmentTemplateData = (overrides: Partial<NewAssessmentTemplate> = {}): NewAssessmentTemplate => ({
  assessmentTypeId: overrides.assessmentTypeId || 1,
  name: `Test Template ${Date.now()}`,
  version: '1.0',
  description: 'Test template description',
  isActive: 1,
  ...overrides
});

/**
 * Create test data for an assessment question
 */
export const createTestAssessmentQuestionData = (overrides: Partial<NewAssessmentQuestion> = {}): NewAssessmentQuestion => ({
  templateId: overrides.templateId || 1,
  categoryId: overrides.categoryId || 1,
  questionText: 'Test question?',
  displayOrder: 1,
  isActive: 1,
  ...overrides
});

/**
 * Create test data for an assessment instance
 */
export const createTestAssessmentInstanceData = (overrides: Partial<NewAssessmentInstance> = {}): NewAssessmentInstance => ({
  userId: overrides.userId || 'user-required',
  periodId: overrides.periodId || 1,
  templateId: overrides.templateId || 1,
  status: 'pending',
  ...overrides
});

/**
 * Create test data for an assessment response
 */
export const createTestAssessmentResponseData = (overrides: Partial<NewAssessmentResponse> = {}): NewAssessmentResponse => ({
  instanceId: overrides.instanceId || 1,
  questionId: overrides.questionId || 1,
  score: 85,
  notes: 'Test response notes',
  ...overrides
});

/**
 * Create test data for a manager relationship
 * Note: This should only be used with actual entity IDs, not hardcoded values
 */
export const createTestManagerRelationshipData = (overrides: Partial<NewManagerRelationship> = {}): NewManagerRelationship => ({
  managerId: overrides.managerId || 'manager-required',
  subordinateId: overrides.subordinateId || 'subordinate-required',
  periodId: overrides.periodId || 1,
  ...overrides
});

/**
 * Create test data for an invitation
 * Note: This should only be used with actual entity IDs, not hardcoded values
 */
export const createTestInvitationData = (overrides: Partial<NewInvitation> = {}): NewInvitation => ({
  managerId: overrides.managerId || 'manager-required',
  templateId: overrides.templateId || 1,
  periodId: overrides.periodId || 1,
  email: `invitee-${Date.now()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  status: 'pending',
  token: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

/**
 * Insert an assessment category and return the created entity
 */
export const insertTestAssessmentCategory = async (data: NewAssessmentCategory): Promise<AssessmentCategory> => {
  const [category] = await db.insert(assessmentCategories).values(data).returning();
  return category;
};

/**
 * Insert an assessment template and return the created entity
 */
export const insertTestAssessmentTemplate = async (data: NewAssessmentTemplate): Promise<AssessmentTemplate> => {
  const [template] = await db.insert(assessmentTemplates).values(data).returning();
  return template;
};

/**
 * Insert an assessment question and return the created entity
 */
export const insertTestAssessmentQuestion = async (data: NewAssessmentQuestion): Promise<AssessmentQuestion> => {
  const [question] = await db.insert(assessmentQuestions).values(data).returning();
  return question;
};

/**
 * Insert an assessment instance and return the created entity
 */
export const insertTestAssessmentInstance = async (data: NewAssessmentInstance): Promise<AssessmentInstance> => {
  const [instance] = await db.insert(assessmentInstances).values(data).returning();
  return instance;
};

/**
 * Insert an assessment response and return the created entity
 */
export const insertTestAssessmentResponse = async (data: NewAssessmentResponse): Promise<AssessmentResponse> => {
  const [response] = await db.insert(assessmentResponses).values(data).returning();
  return response;
};

/**
 * Insert a manager relationship and return the created entity
 */
export const insertTestManagerRelationship = async (data: NewManagerRelationship): Promise<ManagerRelationship> => {
  const [relationship] = await db.insert(managerRelationships).values(data).returning();
  return relationship;
};

/**
 * Insert an invitation and return the created entity
 */
export const insertTestInvitation = async (data: NewInvitation): Promise<Invitation> => {
  const [invitation] = await db.insert(invitations).values(data).returning();
  return invitation;
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

/**
 * Create an assessment category with the database operation
 */
export const createTestAssessmentCategory = async (overrides: Partial<NewAssessmentCategory> = {}): Promise<AssessmentCategory> => {
  const categoryData = createTestAssessmentCategoryData(overrides);
  return await insertTestAssessmentCategory(categoryData);
};

/**
 * Create an assessment template with the database operation
 */
export const createTestAssessmentTemplate = async (overrides: Partial<NewAssessmentTemplate> = {}): Promise<AssessmentTemplate> => {
  const templateData = createTestAssessmentTemplateData(overrides);
  return await insertTestAssessmentTemplate(templateData);
};

/**
 * Create an assessment question with the database operation
 */
export const createTestAssessmentQuestion = async (overrides: Partial<NewAssessmentQuestion> = {}): Promise<AssessmentQuestion> => {
  const questionData = createTestAssessmentQuestionData(overrides);
  return await insertTestAssessmentQuestion(questionData);
};

/**
 * Create an assessment instance with the database operation
 */
export const createTestAssessmentInstance = async (overrides: Partial<NewAssessmentInstance> = {}): Promise<AssessmentInstance> => {
  const instanceData = createTestAssessmentInstanceData(overrides);
  return await insertTestAssessmentInstance(instanceData);
};

/**
 * Create an assessment response with the database operation
 */
export const createTestAssessmentResponse = async (overrides: Partial<NewAssessmentResponse> = {}): Promise<AssessmentResponse> => {
  const responseData = createTestAssessmentResponseData(overrides);
  return await insertTestAssessmentResponse(responseData);
};

/**
 * Create a manager relationship with the database operation
 */
export const createTestManagerRelationship = async (overrides: Partial<NewManagerRelationship> = {}): Promise<ManagerRelationship> => {
  const relationshipData = createTestManagerRelationshipData(overrides);
  return await insertTestManagerRelationship(relationshipData);
};

/**
 * Create an invitation with the database operation
 */
export const createTestInvitation = async (overrides: Partial<NewInvitation> = {}): Promise<Invitation> => {
  const invitationData = createTestInvitationData(overrides);
  return await insertTestInvitation(invitationData);
};

// ============================================================================
// COMPLETE SCENARIO BUILDERS
// ============================================================================

/**
 * Create a complete assessment setup with all dependencies
 */
export const createCompleteAssessmentSetup = async (overrides: {
  user?: Partial<NewUser>;
  type?: Partial<NewAssessmentType>;
  period?: Partial<NewAssessmentPeriod>;
  template?: Partial<NewAssessmentTemplate>;
  category?: Partial<NewAssessmentCategory>;
  question?: Partial<NewAssessmentQuestion>;
  instance?: Partial<NewAssessmentInstance>;
} = {}) => {
  // Create base entities
  const user = await createTestUser(overrides.user);
  const type = await createTestAssessmentType(overrides.type);
  const period = await createTestAssessmentPeriod(overrides.period);
  
  // Create template that references the type
  const template = await createTestAssessmentTemplate({
    assessmentTypeId: type.id,
    ...overrides.template
  });
  
  // Create category that references the type
  const category = await createTestAssessmentCategory({
    assessmentTypeId: type.id,
    ...overrides.category
  });
  
  // Create question that references template and category
  const question = await createTestAssessmentQuestion({
    templateId: template.id,
    categoryId: category.id,
    ...overrides.question
  });
  
  // Create instance that references user, period, and template
  const instance = await createTestAssessmentInstance({
    userId: user.id,
    periodId: period.id,
    templateId: template.id,
    ...overrides.instance
  });
  
  return { user, type, period, template, category, question, instance };
};

/**
 * Create a complete manager-subordinate setup
 */
export const createManagerSubordinateSetup = async (overrides: {
  manager?: Partial<NewUser>;
  subordinate?: Partial<NewUser>;
  period?: Partial<NewAssessmentPeriod>;
  relationship?: Partial<NewManagerRelationship>;
} = {}) => {
  const manager = await createTestUser({ role: 'manager', ...overrides.manager });
  const subordinate = await createTestUser({ role: 'user', ...overrides.subordinate });
  const period = await createTestAssessmentPeriod(overrides.period);
  
  const relationship = await createTestManagerRelationship({
    managerId: manager.id,
    subordinateId: subordinate.id,
    periodId: period.id,
    ...overrides.relationship
  });
  
  return { manager, subordinate, period, relationship };
};

/**
 * Create a complete invitation setup
 */
export const createInvitationSetup = async (overrides: {
  manager?: Partial<NewUser>;
  invitation?: Partial<NewInvitation>;
} = {}) => {
  const manager = await createTestUser({ role: 'manager', ...overrides.manager });
  const type = await createTestAssessmentType();
  const period = await createTestAssessmentPeriod();
  const template = await createTestAssessmentTemplate({ assessmentTypeId: type.id });

  // Import the service dynamically to avoid circular dependencies
  const { InvitationsService } = await import('./services/invitations');
  
  const invitationData = {
    managerId: manager.id,
    templateId: template.id,
    periodId: period.id,
    email: `invitee-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    ...overrides.invitation
  };

  const invitation = await InvitationsService.createInvitation(invitationData);
  
  return { manager, invitation };
};

/**
 * Create a complete manager relationship with all dependencies
 */
export const createCompleteManagerRelationship = async (overrides: {
  manager?: Partial<NewUser>;
  subordinate?: Partial<NewUser>;
  period?: Partial<NewAssessmentPeriod>;
  relationship?: Partial<NewManagerRelationship>;
} = {}): Promise<{
  manager: User;
  subordinate: User;
  period: AssessmentPeriod;
  relationship: ManagerRelationship;
}> => {
  // Create manager user
  const manager = await createTestUser({ 
    role: 'manager', 
    ...overrides.manager 
  });

  // Create subordinate user
  const subordinate = await createTestUser({ 
    role: 'user', 
    ...overrides.subordinate 
  });

  // Create assessment period
  const period = await createTestAssessmentPeriod(overrides.period);

  // Create manager relationship with real IDs
  const relationship = await insertTestManagerRelationship({
    managerId: manager.id,
    subordinateId: subordinate.id,
    periodId: period.id,
    ...overrides.relationship
  });

  return { manager, subordinate, period, relationship };
};

/**
 * Create a complete invitation with all dependencies
 */
export const createCompleteInvitation = async (overrides: {
  manager?: Partial<NewUser>;
  type?: Partial<NewAssessmentType>;
  period?: Partial<NewAssessmentPeriod>;
  template?: Partial<NewAssessmentTemplate>;
  invitation?: Partial<NewInvitation>;
} = {}): Promise<{
  manager: User;
  type: AssessmentType;
  period: AssessmentPeriod;
  template: AssessmentTemplate;
  invitation: Invitation;
}> => {
  // Create manager user
  const manager = await createTestUser({ 
    role: 'manager', 
    ...overrides.manager 
  });

  // Create assessment type
  const type = await createTestAssessmentType(overrides.type);

  // Create assessment period
  const period = await createTestAssessmentPeriod(overrides.period);

  // Create assessment template
  const template = await createTestAssessmentTemplate({ 
    assessmentTypeId: type.id,
    ...overrides.template 
  });

  // Import the service dynamically to avoid circular dependencies
  const { InvitationsService } = await import('./services/invitations');

  // Create invitation with real IDs using the service
  const invitation = await InvitationsService.createInvitation({
    managerId: manager.id,
    templateId: template.id,
    periodId: period.id,
    email: `invitee-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    ...overrides.invitation
  });

  return { manager, type, period, template, invitation };
};

// ============================================================================
// EXISTING DATA HELPERS
// ============================================================================

/**
 * Get existing user from database or create a new one
 */
export const getOrCreateTestUser = async (overrides: Partial<NewUser> = {}): Promise<User> => {
  // Try to get an existing user first
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    return existingUsers[0];
  }
  
  // If no existing users, create a new one
  return await createTestUser(overrides);
};

/**
 * Get existing assessment type from database or create a new one
 */
export const getOrCreateTestAssessmentType = async (overrides: Partial<NewAssessmentType> = {}): Promise<AssessmentType> => {
  // Try to get an existing assessment type first
  const existingTypes = await db.select().from(assessmentTypes).limit(1);
  if (existingTypes.length > 0) {
    return existingTypes[0];
  }
  
  // If no existing types, create a new one
  return await createTestAssessmentType(overrides);
};

/**
 * Get existing assessment period from database or create a new one
 */
export const getOrCreateTestAssessmentPeriod = async (overrides: Partial<NewAssessmentPeriod> = {}): Promise<AssessmentPeriod> => {
  // Try to get an existing assessment period first
  const existingPeriods = await db.select().from(assessmentPeriods).limit(1);
  if (existingPeriods.length > 0) {
    return existingPeriods[0];
  }
  
  // If no existing periods, create a new one
  return await createTestAssessmentPeriod(overrides);
};

/**
 * Get existing assessment template from database or create a new one
 */
export const getOrCreateTestAssessmentTemplate = async (overrides: Partial<NewAssessmentTemplate> = {}): Promise<AssessmentTemplate> => {
  // Try to get an existing assessment template first
  const existingTemplates = await db.select().from(assessmentTemplates).limit(1);
  if (existingTemplates.length > 0) {
    return existingTemplates[0];
  }
  
  // If no existing templates, create a new one
  return await createTestAssessmentTemplate(overrides);
};

/**
 * Create a complete invitation using existing data
 */
export const createInvitationWithExistingData = async (overrides: {
  manager?: Partial<NewUser>;
  invitation?: Partial<NewInvitation>;
} = {}): Promise<{
  manager: User;
  type: AssessmentType;
  period: AssessmentPeriod;
  template: AssessmentTemplate;
  invitation: Invitation;
}> => {
  // Use existing data or create new if needed
  const manager = await getOrCreateTestUser({ 
    role: 'manager', 
    ...overrides.manager 
  });

  const type = await getOrCreateTestAssessmentType();
  const period = await getOrCreateTestAssessmentPeriod();
  const template = await getOrCreateTestAssessmentTemplate({ 
    assessmentTypeId: type.id
  });

  // Import the service dynamically to avoid circular dependencies
  const { InvitationsService } = await import('./services/invitations');

  // Create invitation with real IDs using the service
  const invitation = await InvitationsService.createInvitation({
    managerId: manager.id,
    templateId: template.id,
    periodId: period.id,
    email: `invitee-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    ...overrides.invitation
  });

  return { manager, type, period, template, invitation };
};

// ============================================================================
// ENHANCED CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up all test data in proper order
 */
export const cleanupTestData = async (): Promise<void> => {
  // Delete in dependency order (reverse of creation)
  await db.delete(assessmentResponses);
  await db.delete(assessmentQuestions);
  await db.delete(assessmentInstances);
  await db.delete(assessmentCategories);
  await db.delete(assessmentTemplates);
  await db.delete(managerRelationships);
  await db.delete(invitations);
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

/**
 * Enhanced cleanup with error handling
 */
export const safeCleanup = async (): Promise<void> => {
  try {
    await cleanup();
  } catch (error) {
    console.warn('Cleanup failed, attempting individual table cleanup:', error);
    // Try individual table cleanup as fallback
    try {
      await db.delete(assessmentResponses);
    } catch (e) {}
    try {
      await db.delete(assessmentQuestions);
    } catch (e) {}
    try {
      await db.delete(assessmentInstances);
    } catch (e) {}
    try {
      await db.delete(assessmentCategories);
    } catch (e) {}
    try {
      await db.delete(assessmentTemplates);
    } catch (e) {}
    try {
      await db.delete(managerRelationships);
    } catch (e) {}
    try {
      await db.delete(invitations);
    } catch (e) {}
    try {
      await db.delete(magicLinks);
    } catch (e) {}
    try {
      await db.delete(assessmentPeriods);
    } catch (e) {}
    try {
      await db.delete(assessmentTypes);
    } catch (e) {}
    try {
      await db.delete(users);
    } catch (e) {}
  }
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
    await safeCleanup();
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

/**
 * Helper to create a complete assessment with responses
 */
export const createAssessmentWithResponses = async (overrides: {
  user?: Partial<NewUser>;
  responseCount?: number;
} = {}) => {
  const { user, type, period, template, category, question, instance } = await createCompleteAssessmentSetup({
    user: overrides.user
  });
  
  const responses: AssessmentResponse[] = [];
  const responseCount = overrides.responseCount || 1;
  
  for (let i = 0; i < responseCount; i++) {
    const response = await createTestAssessmentResponse({
      instanceId: instance.id,
      questionId: question.id,
      score: 85 + i,
      notes: `Response ${i + 1} notes`
    });
    responses.push(response);
  }
  
  return { user, type, period, template, category, question, instance, responses };
}; 