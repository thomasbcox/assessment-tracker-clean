import { db, users, assessmentTypes, assessmentCategories, assessmentTemplates, assessmentQuestions, assessmentPeriods, assessmentInstances, assessmentResponses, magicLinks, managerRelationships } from './db';
import { eq, and, lt, gt, desc, asc } from 'drizzle-orm';

describe('Database Schema Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(assessmentResponses);
    await db.delete(assessmentInstances);
    await db.delete(assessmentQuestions);
    await db.delete(assessmentTemplates);
    await db.delete(assessmentCategories);
    await db.delete(assessmentTypes);
    await db.delete(assessmentPeriods);
    await db.delete(managerRelationships);
    await db.delete(magicLinks);
    await db.delete(users);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assessmentResponses);
    await db.delete(assessmentInstances);
    await db.delete(assessmentQuestions);
    await db.delete(assessmentTemplates);
    await db.delete(assessmentCategories);
    await db.delete(assessmentTypes);
    await db.delete(assessmentPeriods);
    await db.delete(managerRelationships);
    await db.delete(magicLinks);
    await db.delete(users);
  });

  describe('User Management', () => {
    it('should create and retrieve a user', async () => {
      const testUser = {
        id: 'testuser1',
        email: 'testuser1@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      await db.insert(users).values(testUser);
      
      const retrievedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1);

      expect(retrievedUser).toHaveLength(1);
      expect(retrievedUser[0]).toMatchObject(testUser);
    });

    it('should enforce unique email constraint', async () => {
      const duplicateUser = {
        id: 'testuser2',
        email: 'testuser1@example.com', // Same email as above
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'user',
      };

      await expect(
        db.insert(users).values(duplicateUser)
      ).rejects.toThrow();
    });

    it('should handle all user roles', async () => {
      const roleTestUsers = [
        { id: 'superadmin1', email: 'superadmin1@example.com', firstName: 'Super', lastName: 'Admin', role: 'superadmin' },
        { id: 'admin1', email: 'admin1@example.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
        { id: 'manager1', email: 'manager1@example.com', firstName: 'Manager', lastName: 'User', role: 'manager' },
        { id: 'user1', email: 'user1@example.com', firstName: 'Regular', lastName: 'User', role: 'user' },
      ];

      for (const user of roleTestUsers) {
        await db.insert(users).values(user);
      }

      const retrievedUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .orderBy(asc(users.email));

      expect(retrievedUsers).toHaveLength(1);
      expect(retrievedUsers[0].role).toBe('admin');
    });

    it('should handle nullable fields correctly', async () => {
      const userWithNullFields = {
        id: 'nulluser',
        email: 'nulluser@example.com',
        firstName: null,
        lastName: null,
        role: 'user',
      };

      await db.insert(users).values(userWithNullFields);
      
      const retrievedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, 'nulluser@example.com'))
        .limit(1);

      expect(retrievedUser[0].firstName).toBeNull();
      expect(retrievedUser[0].lastName).toBeNull();
    });

    it('should enforce required fields', async () => {
      const invalidUser = {
        id: 'invaliduser',
        // email is missing
        firstName: 'Invalid',
        lastName: 'User',
        role: 'user',
      };

      await expect(
        db.insert(users).values(invalidUser as any)
      ).rejects.toThrow();
    });
  });

  describe('Assessment Types', () => {
    it('should create and retrieve assessment types', async () => {
      const testType = {
        name: 'Test Assessment Type',
        description: 'A test assessment type',
        purpose: 'Testing purposes',
      };

      const [insertedType] = await db.insert(assessmentTypes).values(testType).returning();
      
      expect(insertedType).toMatchObject(testType);
      expect(insertedType.id).toBeDefined();
      expect(insertedType.isActive).toBe(1);
    });

    it('should enforce unique name constraint', async () => {
      const duplicateType = {
        name: 'Test Assessment Type', // Same name as above
        description: 'Another test type',
        purpose: 'More testing',
      };

      await expect(
        db.insert(assessmentTypes).values(duplicateType)
      ).rejects.toThrow();
    });

    it('should handle all assessment type fields', async () => {
      const comprehensiveType = {
        name: 'Comprehensive Test Type',
        description: 'A comprehensive test assessment type with all fields',
        purpose: 'Comprehensive testing purposes',
        isActive: 0, // Test inactive status
      };

      const [insertedType] = await db.insert(assessmentTypes).values(comprehensiveType).returning();
      
      expect(insertedType).toMatchObject(comprehensiveType);
      expect(insertedType.id).toBeDefined();
      expect(insertedType.isActive).toBe(0);
    });

    it('should handle long text fields', async () => {
      const longDescription = 'A'.repeat(1000);
      const longPurpose = 'B'.repeat(1000);
      
      const longTextType = {
        name: 'Long Text Test Type',
        description: longDescription,
        purpose: longPurpose,
      };

      const [insertedType] = await db.insert(assessmentTypes).values(longTextType).returning();
      
      expect(insertedType.description).toBe(longDescription);
      expect(insertedType.purpose).toBe(longPurpose);
    });
  });

  describe('Assessment Categories', () => {
    let testTypeId: number;

    beforeAll(async () => {
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Category Test Type',
        description: 'For testing categories',
        purpose: 'Testing',
      }).returning();
      testTypeId = type.id;
    });

    it('should create categories with proper foreign key relationships', async () => {
      const testCategory = {
        assessmentTypeId: testTypeId,
        name: 'Test Category',
        description: 'A test category',
        displayOrder: 1,
      };

      const [insertedCategory] = await db.insert(assessmentCategories).values(testCategory).returning();
      
      expect(insertedCategory).toMatchObject(testCategory);
      expect(insertedCategory.id).toBeDefined();
    });

    it('should enforce foreign key constraint', async () => {
      const invalidCategory = {
        assessmentTypeId: 99999, // Non-existent type ID
        name: 'Invalid Category',
        description: 'Should fail',
        displayOrder: 1,
      };

      await expect(
        db.insert(assessmentCategories).values(invalidCategory)
      ).rejects.toThrow();
    });

    it('should handle display order correctly', async () => {
      const categories = [
        { assessmentTypeId: testTypeId, name: 'First Category', description: 'First', displayOrder: 1 },
        { assessmentTypeId: testTypeId, name: 'Second Category', description: 'Second', displayOrder: 2 },
        { assessmentTypeId: testTypeId, name: 'Third Category', description: 'Third', displayOrder: 3 },
      ];

      for (const category of categories) {
        await db.insert(assessmentCategories).values(category);
      }

      const retrievedCategories = await db
        .select()
        .from(assessmentCategories)
        .where(eq(assessmentCategories.assessmentTypeId, testTypeId))
        .orderBy(asc(assessmentCategories.displayOrder));

      expect(retrievedCategories).toHaveLength(3);
      expect(retrievedCategories[0].displayOrder).toBe(1);
      expect(retrievedCategories[1].displayOrder).toBe(2);
      expect(retrievedCategories[2].displayOrder).toBe(3);
    });

    it('should allow duplicate display orders within different types', async () => {
      const [secondType] = await db.insert(assessmentTypes).values({
        name: 'Second Category Test Type',
        description: 'For testing category display orders',
        purpose: 'Testing',
      }).returning();

      const category1 = {
        assessmentTypeId: testTypeId,
        name: 'Category with Order 1',
        description: 'First type, order 1',
        displayOrder: 1,
      };

      const category2 = {
        assessmentTypeId: secondType.id,
        name: 'Category with Order 1',
        description: 'Second type, order 1',
        displayOrder: 1,
      };

      await expect(db.insert(assessmentCategories).values(category1)).resolves.toBeDefined();
      await expect(db.insert(assessmentCategories).values(category2)).resolves.toBeDefined();
    });
  });

  describe('Assessment Templates', () => {
    let testTypeId: number;

    beforeAll(async () => {
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Template Test Type',
        description: 'For testing templates',
        purpose: 'Testing',
      }).returning();
      testTypeId = type.id;
    });

    it('should create templates with versioning', async () => {
      const testTemplate = {
        assessmentTypeId: testTypeId,
        name: 'Test Template',
        version: 'v1.0',
        description: 'A test template',
      };

      const [insertedTemplate] = await db.insert(assessmentTemplates).values(testTemplate).returning();
      
      expect(insertedTemplate).toMatchObject(testTemplate);
      expect(insertedTemplate.id).toBeDefined();
    });

    it('should enforce unique name-version constraint', async () => {
      const duplicateTemplate = {
        assessmentTypeId: testTypeId,
        name: 'Test Template', // Same name and version
        version: 'v1.0',
        description: 'Duplicate template',
      };

      await expect(
        db.insert(assessmentTemplates).values(duplicateTemplate)
      ).rejects.toThrow();
    });

    it('should allow same name with different versions', async () => {
      const templateV1 = {
        assessmentTypeId: testTypeId,
        name: 'Versioned Template',
        version: 'v1.0',
        description: 'Version 1',
      };

      const templateV2 = {
        assessmentTypeId: testTypeId,
        name: 'Versioned Template',
        version: 'v2.0',
        description: 'Version 2',
      };

      await expect(db.insert(assessmentTemplates).values(templateV1)).resolves.toBeDefined();
      await expect(db.insert(assessmentTemplates).values(templateV2)).resolves.toBeDefined();
    });

    it('should handle template versioning', async () => {
      const templateV1 = {
        assessmentTypeId: testTypeId,
        name: 'Versioned Template',
        version: 'v1.0',
        description: 'Version 1',
      };

      const templateV2 = {
        assessmentTypeId: testTypeId,
        name: 'Versioned Template',
        version: 'v2.0',
        description: 'Version 2',
      };

      await expect(db.insert(assessmentTemplates).values(templateV1)).resolves.toBeDefined();
      await expect(db.insert(assessmentTemplates).values(templateV2)).resolves.toBeDefined();
    });
  });

  describe('Assessment Questions', () => {
    let testTypeId: number;
    let testTemplateId: number;
    let testCategoryId: number;

    beforeAll(async () => {
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Question Test Type',
        description: 'For testing questions',
        purpose: 'Testing',
      }).returning();
      testTypeId = type.id;

      const [template] = await db.insert(assessmentTemplates).values({
        assessmentTypeId: testTypeId,
        name: 'Question Test Template',
        version: 'v1.0',
        description: 'For testing questions',
      }).returning();
      testTemplateId = template.id;

      const [category] = await db.insert(assessmentCategories).values({
        assessmentTypeId: testTypeId,
        name: 'Question Test Category',
        description: 'For testing questions',
        displayOrder: 1,
      }).returning();
      testCategoryId = category.id;
    });

    it('should create questions with proper relationships', async () => {
      const testQuestion = {
        templateId: testTemplateId,
        categoryId: testCategoryId,
        questionText: 'What is your favorite color?',
        displayOrder: 1,
      };

      const [insertedQuestion] = await db.insert(assessmentQuestions).values(testQuestion).returning();
      
      expect(insertedQuestion).toMatchObject(testQuestion);
      expect(insertedQuestion.id).toBeDefined();
    });

    it('should enforce template foreign key constraint', async () => {
      const invalidQuestion = {
        templateId: 99999, // Non-existent template
        categoryId: testCategoryId,
        questionText: 'Should fail',
        displayOrder: 1,
      };

      await expect(
        db.insert(assessmentQuestions).values(invalidQuestion)
      ).rejects.toThrow();
    });

    it('should enforce category foreign key constraint', async () => {
      const invalidQuestion = {
        templateId: testTemplateId,
        categoryId: 99999, // Non-existent category
        questionText: 'Should fail',
        displayOrder: 1,
      };

      await expect(
        db.insert(assessmentQuestions).values(invalidQuestion)
      ).rejects.toThrow();
    });

    it('should handle question ordering within categories', async () => {
      const questions = [
        { templateId: testTemplateId, categoryId: testCategoryId, questionText: 'Question 1', displayOrder: 1 },
        { templateId: testTemplateId, categoryId: testCategoryId, questionText: 'Question 2', displayOrder: 2 },
        { templateId: testTemplateId, categoryId: testCategoryId, questionText: 'Question 3', displayOrder: 3 },
      ];

      for (const question of questions) {
        await db.insert(assessmentQuestions).values(question);
      }

      const retrievedQuestions = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.categoryId, testCategoryId))
        .orderBy(asc(assessmentQuestions.displayOrder));

      expect(retrievedQuestions).toHaveLength(3);
      expect(retrievedQuestions[0].displayOrder).toBe(1);
      expect(retrievedQuestions[1].displayOrder).toBe(2);
      expect(retrievedQuestions[2].displayOrder).toBe(3);
    });

    it('should handle long question text', async () => {
      const longQuestionText = 'A'.repeat(2000);
      
      const longQuestion = {
        templateId: testTemplateId,
        categoryId: testCategoryId,
        questionText: longQuestionText,
        displayOrder: 10,
      };

      const [insertedQuestion] = await db.insert(assessmentQuestions).values(longQuestion).returning();
      
      expect(insertedQuestion.questionText).toBe(longQuestionText);
    });
  });

  describe('Assessment Periods', () => {
    it('should create assessment periods', async () => {
      const testPeriod = {
        name: 'Q1 2024 Test',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 0,
      };

      const [insertedPeriod] = await db.insert(assessmentPeriods).values(testPeriod).returning();
      
      expect(insertedPeriod).toMatchObject(testPeriod);
      expect(insertedPeriod.id).toBeDefined();
    });

    it('should enforce unique name constraint', async () => {
      const duplicatePeriod = {
        name: 'Q1 2024 Test', // Same name as above
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isActive: 0,
      };

      await expect(
        db.insert(assessmentPeriods).values(duplicatePeriod)
      ).rejects.toThrow();
    });

    it('should handle date validation', async () => {
      const validPeriod = {
        name: 'Valid Date Period',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: 1,
      };

      const [insertedPeriod] = await db.insert(assessmentPeriods).values(validPeriod).returning();
      
      expect(insertedPeriod.startDate).toBe('2024-01-01');
      expect(insertedPeriod.endDate).toBe('2024-12-31');
      expect(insertedPeriod.isActive).toBe(1);
    });

    it('should handle active period management', async () => {
      // Create multiple periods
      const periods = [
        { name: 'Period 1', startDate: '2024-01-01', endDate: '2024-03-31', isActive: 1 },
        { name: 'Period 2', startDate: '2024-04-01', endDate: '2024-06-30', isActive: 0 },
        { name: 'Period 3', startDate: '2024-07-01', endDate: '2024-09-30', isActive: 0 },
      ];

      for (const period of periods) {
        await db.insert(assessmentPeriods).values(period);
      }

      const activePeriods = await db
        .select()
        .from(assessmentPeriods)
        .where(eq(assessmentPeriods.isActive, 1));

      expect(activePeriods).toHaveLength(1);
      expect(activePeriods[0].name).toBe('Period 1');
    });
  });

  describe('Assessment Instances', () => {
    let testUserId: string;
    let testPeriodId: number;

    beforeAll(async () => {
      const [user] = await db.insert(users).values({
        id: 'instanceuser',
        email: 'instanceuser@example.com',
        firstName: 'Instance',
        lastName: 'User',
        role: 'user',
      }).returning();
      testUserId = user.id;

      const [period] = await db.insert(assessmentPeriods).values({
        name: 'Instance Test Period',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: 1,
      }).returning();
      testPeriodId = period.id;
    });

    it('should create assessment instances', async () => {
      const testInstance = {
        userId: testUserId,
        periodId: testPeriodId,
        templateId: 1, // Use existing template
        status: 'pending',
      };

      const [insertedInstance] = await db.insert(assessmentInstances).values(testInstance).returning();
      
      expect(insertedInstance).toMatchObject(testInstance);
      expect(insertedInstance.id).toBeDefined();
    });

    it('should enforce user foreign key constraint', async () => {
      const invalidInstance = {
        userId: 'nonexistentuser',
        periodId: testPeriodId,
        templateId: 1,
        status: 'pending',
      };

      await expect(
        db.insert(assessmentInstances).values(invalidInstance)
      ).rejects.toThrow();
    });

    it('should enforce period foreign key constraint', async () => {
      const invalidInstance = {
        userId: testUserId,
        periodId: 99999, // Non-existent period
        templateId: 1,
        status: 'pending',
      };

      await expect(
        db.insert(assessmentInstances).values(invalidInstance)
      ).rejects.toThrow();
    });

    it('should handle status transitions', async () => {
      const instance = {
        userId: testUserId,
        periodId: testPeriodId,
        templateId: 1,
        status: 'pending',
      };

      const [insertedInstance] = await db.insert(assessmentInstances).values(instance).returning();

      // Update status to in_progress
      await db
        .update(assessmentInstances)
        .set({ status: 'in_progress' })
        .where(eq(assessmentInstances.id, insertedInstance.id));

      // Update status to completed
      await db
        .update(assessmentInstances)
        .set({ status: 'completed', completedAt: new Date().toISOString() })
        .where(eq(assessmentInstances.id, insertedInstance.id));

      const updatedInstance = await db
        .select()
        .from(assessmentInstances)
        .where(eq(assessmentInstances.id, insertedInstance.id))
        .limit(1);

      expect(updatedInstance[0].status).toBe('completed');
      expect(updatedInstance[0].completedAt).toBeDefined();
    });
  });

  describe('Assessment Responses', () => {
    let testInstanceId: number;
    let testQuestionId: number;

    beforeAll(async () => {
      // Create test user
      const [user] = await db.insert(users).values({
        id: 'responseuser',
        email: 'responseuser@example.com',
        firstName: 'Response',
        lastName: 'User',
        role: 'user',
      }).returning();

      // Create test period
      const [period] = await db.insert(assessmentPeriods).values({
        name: 'Response Test Period',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: 1,
      }).returning();

      // Create test type, template, category, and question
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Response Test Type',
        description: 'For testing responses',
        purpose: 'Testing',
      }).returning();

      const [template] = await db.insert(assessmentTemplates).values({
        assessmentTypeId: type.id,
        name: 'Response Test Template',
        version: 'v1.0',
        description: 'For testing responses',
      }).returning();

      // Create test instance
      const [instance] = await db.insert(assessmentInstances).values({
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'in_progress',
      }).returning();
      testInstanceId = instance.id;

      const [category] = await db.insert(assessmentCategories).values({
        assessmentTypeId: type.id,
        name: 'Response Test Category',
        description: 'For testing responses',
        displayOrder: 1,
      }).returning();

      const [question] = await db.insert(assessmentQuestions).values({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Test question for responses?',
        displayOrder: 1,
      }).returning();
      testQuestionId = question.id;
    });

    it('should create assessment responses', async () => {
      const testResponse = {
        instanceId: testInstanceId,
        questionId: testQuestionId,
        score: 5,
      };

      const [insertedResponse] = await db.insert(assessmentResponses).values(testResponse).returning();
      
      expect(insertedResponse).toMatchObject(testResponse);
      expect(insertedResponse.id).toBeDefined();
    });

    it('should enforce assessment foreign key constraint', async () => {
      const invalidResponse = {
        instanceId: 99999, // Non-existent assessment
        questionId: testQuestionId,
        score: 5,
      };

      await expect(
        db.insert(assessmentResponses).values(invalidResponse)
      ).rejects.toThrow();
    });

    it('should enforce question foreign key constraint', async () => {
      const invalidResponse = {
        instanceId: testInstanceId,
        questionId: 99999, // Non-existent question
        score: 5,
      };

      await expect(
        db.insert(assessmentResponses).values(invalidResponse)
      ).rejects.toThrow();
    });

    it('should handle score validation', async () => {
      const validScores = [1, 2, 3, 4, 5, 6, 7];

      for (const score of validScores) {
        const response = {
          instanceId: testInstanceId,
          questionId: testQuestionId,
          score,
        };

        await expect(db.insert(assessmentResponses).values(response)).resolves.toBeDefined();
      }
    });
  });

  describe('Magic Links', () => {
    it('should create magic links', async () => {
      const testLink = {
        email: 'magiclink@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: 0,
      };

      const [insertedLink] = await db.insert(magicLinks).values(testLink).returning();
      
      expect(insertedLink).toMatchObject(testLink);
      expect(insertedLink.id).toBeDefined();
    });

    it('should enforce unique token constraint', async () => {
      const duplicateLink = {
        email: 'another@example.com',
        token: 'a'.repeat(64), // Same token as above
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: 0,
      };

      await expect(
        db.insert(magicLinks).values(duplicateLink)
      ).rejects.toThrow();
    });

    it('should handle token expiration', async () => {
      const expiredLink = {
        email: 'expired@example.com',
        token: 'b'.repeat(64),
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        used: 0,
      };

      await db.insert(magicLinks).values(expiredLink);

      const expiredLinks = await db
        .select()
        .from(magicLinks)
        .where(lt(magicLinks.expiresAt, new Date().toISOString()));

      expect(expiredLinks.length).toBeGreaterThan(0);
    });

    it('should handle token usage tracking', async () => {
      const unusedLink = {
        email: 'unused@example.com',
        token: 'c'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: 0,
      };

      const [insertedLink] = await db.insert(magicLinks).values(unusedLink).returning();

      // Mark as used
      await db
        .update(magicLinks)
        .set({ used: 1 })
        .where(eq(magicLinks.id, insertedLink.id));

      const updatedLink = await db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.id, insertedLink.id))
        .limit(1);

      expect(updatedLink[0].used).toBe(1);
    });
  });

  describe('Manager Relationships', () => {
    let testManagerId: string;
    let testSubordinateId: string;
    let testPeriodId: number;

    beforeAll(async () => {
      const [manager] = await db.insert(users).values({
        id: 'manager1',
        email: 'manager1@example.com',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'manager',
      }).returning();
      testManagerId = manager.id;

      const [subordinate] = await db.insert(users).values({
        id: 'subordinate1',
        email: 'subordinate1@example.com',
        firstName: 'Test',
        lastName: 'Subordinate',
        role: 'user',
      }).returning();
      testSubordinateId = subordinate.id;

      const [period] = await db.insert(assessmentPeriods).values({
        name: 'Relationship Test Period',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: 1,
      }).returning();
      testPeriodId = period.id;
    });

    it('should create manager relationships', async () => {
      const testRelationship = {
        managerId: testManagerId,
        subordinateId: testSubordinateId,
        periodId: testPeriodId,
      };

      const [insertedRelationship] = await db.insert(managerRelationships).values(testRelationship).returning();
      
      expect(insertedRelationship).toMatchObject(testRelationship);
      expect(insertedRelationship.id).toBeDefined();
    });

    it('should enforce manager foreign key constraint', async () => {
      const invalidRelationship = {
        managerId: 'nonexistentmanager',
        subordinateId: testSubordinateId,
        periodId: testPeriodId,
      };

      await expect(
        db.insert(managerRelationships).values(invalidRelationship)
      ).rejects.toThrow();
    });

    it('should enforce subordinate foreign key constraint', async () => {
      const invalidRelationship = {
        managerId: testManagerId,
        subordinateId: 'nonexistentsubordinate',
        periodId: testPeriodId,
      };

      await expect(
        db.insert(managerRelationships).values(invalidRelationship)
      ).rejects.toThrow();
    });

    it('should enforce period foreign key constraint', async () => {
      const invalidRelationship = {
        managerId: testManagerId,
        subordinateId: testSubordinateId,
        periodId: 99999, // Non-existent period
      };

      await expect(
        db.insert(managerRelationships).values(invalidRelationship)
      ).rejects.toThrow();
    });

    it('should handle multiple subordinates per manager', async () => {
      const [subordinate2] = await db.insert(users).values({
        id: 'subordinate2',
        email: 'subordinate2@example.com',
        firstName: 'Second',
        lastName: 'Subordinate',
        role: 'user',
      }).returning();

      const [subordinate3] = await db.insert(users).values({
        id: 'subordinate3',
        email: 'subordinate3@example.com',
        firstName: 'Third',
        lastName: 'Subordinate',
        role: 'user',
      }).returning();

      const relationships = [
        { managerId: testManagerId, subordinateId: subordinate2.id, periodId: testPeriodId },
        { managerId: testManagerId, subordinateId: subordinate3.id, periodId: testPeriodId },
      ];

      for (const relationship of relationships) {
        await db.insert(managerRelationships).values(relationship);
      }

      const managerSubordinates = await db
        .select()
        .from(managerRelationships)
        .where(eq(managerRelationships.managerId, testManagerId));

      expect(managerSubordinates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity when deleting parent records', async () => {
      // Create a type, template, category, and question
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Integrity Test Type',
        description: 'For testing integrity',
        purpose: 'Testing',
      }).returning();

      const [template] = await db.insert(assessmentTemplates).values({
        assessmentTypeId: type.id,
        name: 'Integrity Test Template',
        version: 'v1.0',
        description: 'For testing integrity',
      }).returning();

      const [category] = await db.insert(assessmentCategories).values({
        assessmentTypeId: type.id,
        name: 'Integrity Test Category',
        description: 'For testing integrity',
        displayOrder: 1,
      }).returning();

      const [question] = await db.insert(assessmentQuestions).values({
        templateId: template.id,
        categoryId: category.id,
        questionText: 'Integrity test question?',
        displayOrder: 1,
      }).returning();

      // Verify the question exists
      const existingQuestion = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.id, question.id))
        .limit(1);

      expect(existingQuestion).toHaveLength(1);

      // Delete the template (should cascade or prevent deletion)
      await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, template.id));

      // The question should no longer exist or the deletion should be prevented
      const remainingQuestion = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.id, question.id))
        .limit(1);

      // Note: SQLite doesn't enforce foreign key constraints by default
      // In a production environment, you'd want to enable foreign key constraints
      expect(remainingQuestion).toHaveLength(0);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Test concurrent user creation
      const userPromises = Array(5).fill(null).map((_, index) => 
        db.insert(users).values({
          id: `concurrentuser${index}`,
          email: `concurrentuser${index}@example.com`,
          firstName: `Concurrent${index}`,
          lastName: 'User',
          role: 'user',
        })
      );

      await expect(Promise.all(userPromises)).resolves.toBeDefined();
    });

    it('should handle large datasets', async () => {
      // Create multiple assessment types
      const typePromises = Array(10).fill(null).map((_, index) =>
        db.insert(assessmentTypes).values({
          name: `Large Dataset Type ${index}`,
          description: `Type ${index} for large dataset testing`,
          purpose: 'Large dataset testing',
        })
      );

      await expect(Promise.all(typePromises)).resolves.toBeDefined();

      // Verify all types were created
      const allTypes = await db.select().from(assessmentTypes);
      expect(allTypes.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Query Performance', () => {
    it('should efficiently query related data', async () => {
      // Create test data with relationships
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Performance Test Type',
        description: 'For testing query performance',
        purpose: 'Performance testing',
      }).returning();

      const [template] = await db.insert(assessmentTemplates).values({
        assessmentTypeId: type.id,
        name: 'Performance Test Template',
        version: 'v1.0',
        description: 'For testing query performance',
      }).returning();

      const [category] = await db.insert(assessmentCategories).values({
        assessmentTypeId: type.id,
        name: 'Performance Test Category',
        description: 'For testing query performance',
        displayOrder: 1,
      }).returning();

      // Create multiple questions
      const questionPromises = Array(20).fill(null).map((_, index) =>
        db.insert(assessmentQuestions).values({
          templateId: template.id,
          categoryId: category.id,
          questionText: `Performance test question ${index}?`,
          displayOrder: index + 1,
        })
      );

      await Promise.all(questionPromises);

      // Test efficient querying
      const questionsWithRelations = await db
        .select({
          questionId: assessmentQuestions.id,
          questionText: assessmentQuestions.questionText,
          categoryName: assessmentCategories.name,
          typeName: assessmentTypes.name,
        })
        .from(assessmentQuestions)
        .innerJoin(assessmentCategories, eq(assessmentQuestions.categoryId, assessmentCategories.id))
        .innerJoin(assessmentTemplates, eq(assessmentQuestions.templateId, assessmentTemplates.id))
        .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
        .where(eq(assessmentTypes.id, type.id))
        .orderBy(asc(assessmentQuestions.displayOrder));

      expect(questionsWithRelations).toHaveLength(20);
      expect(questionsWithRelations[0]).toHaveProperty('questionId');
      expect(questionsWithRelations[0]).toHaveProperty('categoryName');
      expect(questionsWithRelations[0]).toHaveProperty('typeName');
    });
  });

  describe('Assessment Instances', () => {
    let testUserId: string;
    let testPeriodId: number;
    let testTemplateId: number;

    beforeAll(async () => {
      // Create test user
      const [user] = await db.insert(users).values({
        id: 'instance-test-user',
        email: 'instance-test@example.com',
        firstName: 'Instance',
        lastName: 'Test',
        role: 'user',
      }).returning();
      testUserId = user.id;

      // Create test period
      const [period] = await db.insert(assessmentPeriods).values({
        name: 'Instance Test Period',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1,
      }).returning();
      testPeriodId = period.id;

      // Create test type and template
      const [type] = await db.insert(assessmentTypes).values({
        name: 'Instance Test Type',
        description: 'For testing instances',
        purpose: 'Testing',
      }).returning();

      const [template] = await db.insert(assessmentTemplates).values({
        assessmentTypeId: type.id,
        name: 'Instance Test Template',
        version: 'v1.0',
        description: 'For testing instances',
      }).returning();
      testTemplateId = template.id;
    });

    it('should create and retrieve assessment instances', async () => {
      const testInstance = {
        userId: testUserId,
        periodId: testPeriodId,
        templateId: testTemplateId,
        status: 'pending',
        dueDate: '2024-03-31',
      };

      const [insertedInstance] = await db.insert(assessmentInstances).values(testInstance).returning();
      
      expect(insertedInstance).toMatchObject(testInstance);
      expect(insertedInstance.id).toBeDefined();
      expect(insertedInstance.createdAt).toBeDefined();
      expect(insertedInstance.startedAt).toBeNull();
      expect(insertedInstance.completedAt).toBeNull();
    });

    it('should handle all assessment instance statuses', async () => {
      const statuses = ['pending', 'draft', 'active', 'completed', 'archived'];
      
      for (const status of statuses) {
        const instance = {
          userId: testUserId,
          periodId: testPeriodId,
          templateId: testTemplateId,
          status,
          dueDate: '2024-03-31',
        };

        const [insertedInstance] = await db.insert(assessmentInstances).values(instance).returning();
        expect(insertedInstance.status).toBe(status);
      }
    });

    it('should handle assessment instance lifecycle', async () => {
      // Create instance
      const [instance] = await db.insert(assessmentInstances).values({
        userId: testUserId,
        periodId: testPeriodId,
        templateId: testTemplateId,
        status: 'pending',
        dueDate: '2024-03-31',
      }).returning();

      // Start assessment
      await db
        .update(assessmentInstances)
        .set({ 
          status: 'active',
          startedAt: '2024-01-15T10:00:00Z'
        })
        .where(eq(assessmentInstances.id, instance.id));

      const startedInstance = await db
        .select()
        .from(assessmentInstances)
        .where(eq(assessmentInstances.id, instance.id))
        .limit(1);

      expect(startedInstance[0].status).toBe('active');
      expect(startedInstance[0].startedAt).toBe('2024-01-15T10:00:00Z');

      // Complete assessment
      await db
        .update(assessmentInstances)
        .set({ 
          status: 'completed',
          completedAt: '2024-01-20T14:30:00Z'
        })
        .where(eq(assessmentInstances.id, instance.id));

      const completedInstance = await db
        .select()
        .from(assessmentInstances)
        .where(eq(assessmentInstances.id, instance.id))
        .limit(1);

      expect(completedInstance[0].status).toBe('completed');
      expect(completedInstance[0].completedAt).toBe('2024-01-20T14:30:00Z');
    });

    it('should enforce foreign key constraints for assessment instances', async () => {
      const invalidInstance = {
        userId: 'nonexistent-user',
        periodId: testPeriodId,
        templateId: testTemplateId,
        status: 'pending',
      };

      await expect(
        db.insert(assessmentInstances).values(invalidInstance)
      ).rejects.toThrow();
    });

    it('should query assessment instances with related data', async () => {
      // Create another user for testing
      const [user2] = await db.insert(users).values({
        id: 'instance-test-user-2',
        email: 'instance-test-2@example.com',
        firstName: 'Instance',
        lastName: 'Test2',
        role: 'user',
      }).returning();

      // Create instances for both users
      await db.insert(assessmentInstances).values([
        {
          userId: testUserId,
          periodId: testPeriodId,
          templateId: testTemplateId,
          status: 'completed',
          startedAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-20T14:30:00Z',
        },
        {
          userId: user2.id,
          periodId: testPeriodId,
          templateId: testTemplateId,
          status: 'active',
          startedAt: '2024-01-16T09:00:00Z',
        },
      ]);

      // Query instances with related data
      const instancesWithData = await db
        .select({
          instanceId: assessmentInstances.id,
          status: assessmentInstances.status,
          userEmail: users.email,
          userName: users.firstName,
          periodName: assessmentPeriods.name,
          templateName: assessmentTemplates.name,
        })
        .from(assessmentInstances)
        .innerJoin(users, eq(assessmentInstances.userId, users.id))
        .innerJoin(assessmentPeriods, eq(assessmentInstances.periodId, assessmentPeriods.id))
        .innerJoin(assessmentTemplates, eq(assessmentInstances.templateId, assessmentTemplates.id))
        .where(eq(assessmentInstances.userId, testUserId))
        .orderBy(desc(assessmentInstances.createdAt));

      expect(instancesWithData.length).toBeGreaterThan(0);
      expect(instancesWithData[0]).toHaveProperty('instanceId');
      expect(instancesWithData[0]).toHaveProperty('userEmail');
      expect(instancesWithData[0]).toHaveProperty('periodName');
      expect(instancesWithData[0]).toHaveProperty('templateName');
    });

    it('should handle multiple instances per user', async () => {
      // Create multiple instances for the same user
      const instances = [
        {
          userId: testUserId,
          periodId: testPeriodId,
          templateId: testTemplateId,
          status: 'pending',
          dueDate: '2024-03-31',
        },
        {
          userId: testUserId,
          periodId: testPeriodId,
          templateId: testTemplateId,
          status: 'active',
          startedAt: '2024-01-17T11:00:00Z',
          dueDate: '2024-03-31',
        },
        {
          userId: testUserId,
          periodId: testPeriodId,
          templateId: testTemplateId,
          status: 'completed',
          startedAt: '2024-01-18T12:00:00Z',
          completedAt: '2024-01-25T16:00:00Z',
          dueDate: '2024-03-31',
        },
      ];

      await db.insert(assessmentInstances).values(instances);

      const userInstances = await db
        .select()
        .from(assessmentInstances)
        .where(eq(assessmentInstances.userId, testUserId))
        .orderBy(asc(assessmentInstances.createdAt));

      expect(userInstances.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle assessment instance with responses', async () => {
      // Create a category and question
      const [category] = await db.insert(assessmentCategories).values({
        assessmentTypeId: 1, // Use existing type
        name: 'Instance Response Category',
        description: 'For testing instance responses',
        displayOrder: 1,
      }).returning();

      const [question] = await db.insert(assessmentQuestions).values({
        templateId: testTemplateId,
        categoryId: category.id,
        questionText: 'Instance response test question?',
        displayOrder: 1,
      }).returning();

      // Create an instance
      const [instance] = await db.insert(assessmentInstances).values({
        userId: testUserId,
        periodId: testPeriodId,
        templateId: testTemplateId,
        status: 'active',
        startedAt: '2024-01-19T13:00:00Z',
      }).returning();

      // Create responses for the instance
      const responses = [
        {
          instanceId: instance.id,
          questionId: question.id,
          score: 5,
          notes: 'Good performance',
        },
        {
          instanceId: instance.id,
          questionId: question.id,
          score: 7,
          notes: 'Excellent performance',
        },
      ];

      await db.insert(assessmentResponses).values(responses);

      // Query instance with response count
      const instanceWithResponses = await db
        .select({
          instanceId: assessmentInstances.id,
          status: assessmentInstances.status,
          responseCount: assessmentResponses.id,
        })
        .from(assessmentInstances)
        .leftJoin(assessmentResponses, eq(assessmentInstances.id, assessmentResponses.instanceId))
        .where(eq(assessmentInstances.id, instance.id));

      expect(instanceWithResponses.length).toBe(2); // Two responses
    });
  });
}); 