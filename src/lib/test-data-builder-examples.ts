/**
 * Test Data Builder Usage Examples
 * 
 * This file demonstrates practical usage patterns for the test data builder system
 * in real test scenarios.
 */

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

// Example 1: Simple User Test
export async function exampleUserTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // Create a user with custom data
    const user = await new UserBuilder()
      .withEmail('john.doe@company.com')
      .withFirstName('John')
      .withLastName('Doe')
      .withRole('manager')
      .create(db);

    // Test user-related functionality
    // ... your test logic here ...

    return user;
  } finally {
    await cleanup.reset();
  }
}

// Example 2: Assessment Workflow Test
export async function exampleAssessmentWorkflowTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // Create complete assessment workflow
    const builder = createTestDataBuilder(db);
    const data = await builder.create({
      user: { 
        email: 'manager@company.com', 
        role: 'manager' 
      },
      assessmentType: { 
        name: 'Leadership Assessment',
        description: 'Comprehensive leadership evaluation'
      },
      assessmentPeriod: { 
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1
      },
      assessmentCategory: { 
        name: 'Communication Skills',
        description: 'Verbal and written communication'
      },
      assessmentTemplate: { 
        name: 'Leadership Template v2.0',
        version: '2.0',
        description: 'Updated leadership assessment'
      },
      assessmentInstance: { 
        status: 'in_progress',
        startedAt: '2024-01-15T10:00:00Z',
        dueDate: '2024-01-31T23:59:59Z'
      },
      assessmentQuestion: { 
        questionText: 'How do you handle difficult conversations with team members?'
      },
      assessmentResponse: { 
        score: 8,
        notes: 'Demonstrates good conflict resolution skills'
      }
    });

    // Test assessment workflow functionality
    // ... your test logic here ...

    return data;
  } finally {
    await cleanup.reset();
  }
}

// Example 3: Manager-Subordinate Relationship Test
export async function exampleManagerRelationshipTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // Create manager and subordinates
    const manager = await new UserBuilder()
      .withEmail('manager@company.com')
      .withRole('manager')
      .create(db);

    const subordinate1 = await new UserBuilder()
      .withEmail('subordinate1@company.com')
      .withRole('user')
      .create(db);

    const subordinate2 = await new UserBuilder()
      .withEmail('subordinate2@company.com')
      .withRole('user')
      .create(db);

    const period = await new AssessmentPeriodBuilder()
      .withName('Q1 2024')
      .withIsActive(1)
      .create(db);

    // Create manager relationships
    const relationship1 = await new ManagerRelationshipBuilder()
      .withManagerId(manager.id)
      .withSubordinateId(subordinate1.id)
      .withPeriodId(period.id)
      .create(db);

    const relationship2 = await new ManagerRelationshipBuilder()
      .withManagerId(manager.id)
      .withSubordinateId(subordinate2.id)
      .withPeriodId(period.id)
      .create(db);

    // Test manager-subordinate functionality
    // ... your test logic here ...

    return {
      manager,
      subordinates: [subordinate1, subordinate2],
      period,
      relationships: [relationship1, relationship2]
    };
  } finally {
    await cleanup.reset();
  }
}

// Example 4: Invitation System Test
export async function exampleInvitationTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // Create invitation system data
    const builder = createTestDataBuilder(db);
    const data = await builder.create({
      user: { 
        email: 'manager@company.com', 
        role: 'manager' 
      },
      assessmentType: { 
        name: 'Performance Review' 
      },
      assessmentPeriod: { 
        name: 'Annual 2024',
        isActive: 1
      },
      invitation: { 
        email: 'newemployee@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'pending'
      }
    });

    // Test invitation functionality
    // ... your test logic here ...

    return data;
  } finally {
    await cleanup.reset();
  }
}

// Example 5: Magic Link Authentication Test
export async function exampleMagicLinkTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // Create magic link
    const magicLink = await new MagicLinkBuilder()
      .withEmail('user@company.com')
      .withToken('magic-token-123')
      .withExpiresAt('2024-12-31T23:59:59Z')
      .withUsed(0)
      .create(db);

    // Test magic link functionality
    // ... your test logic here ...

    return magicLink;
  } finally {
    await cleanup.reset();
  }
}

// Example 6: Complex Multi-User Assessment Test
export async function exampleMultiUserAssessmentTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // Create multiple users
    const manager = await new UserBuilder()
      .withEmail('manager@company.com')
      .withRole('manager')
      .create(db);

    const user1 = await new UserBuilder()
      .withEmail('user1@company.com')
      .withRole('user')
      .create(db);

    const user2 = await new UserBuilder()
      .withEmail('user2@company.com')
      .withRole('user')
      .create(db);

    // Create assessment infrastructure
    const assessmentType = await new AssessmentTypeBuilder()
      .withName('Team Assessment')
      .create(db);

    const period = await new AssessmentPeriodBuilder()
      .withName('Q1 2024')
      .withIsActive(1)
      .create(db);

    const category1 = await new AssessmentCategoryBuilder()
      .withAssessmentTypeId(assessmentType.id)
      .withName('Technical Skills')
      .withDisplayOrder(1)
      .create(db);

    const category2 = await new AssessmentCategoryBuilder()
      .withAssessmentTypeId(assessmentType.id)
      .withName('Soft Skills')
      .withDisplayOrder(2)
      .create(db);

    const template = await new AssessmentTemplateBuilder()
      .withAssessmentTypeId(assessmentType.id)
      .withName('Team Assessment Template')
      .withVersion('1.0')
      .create(db);

    // Create questions for each category
    const question1 = await new AssessmentQuestionBuilder()
      .withTemplateId(template.id)
      .withCategoryId(category1.id)
      .withQuestionText('How would you rate your technical skills?')
      .withDisplayOrder(1)
      .create(db);

    const question2 = await new AssessmentQuestionBuilder()
      .withTemplateId(template.id)
      .withCategoryId(category2.id)
      .withQuestionText('How well do you work in a team?')
      .withDisplayOrder(2)
      .create(db);

    // Create assessment instances for each user
    const instance1 = await new AssessmentInstanceBuilder()
      .withUserId(user1.id)
      .withPeriodId(period.id)
      .withTemplateId(template.id)
      .withStatus('completed')
      .create(db);

    const instance2 = await new AssessmentInstanceBuilder()
      .withUserId(user2.id)
      .withPeriodId(period.id)
      .withTemplateId(template.id)
      .withStatus('in_progress')
      .create(db);

    // Create responses for user1
    const response1_1 = await new AssessmentResponseBuilder()
      .withInstanceId(instance1.id)
      .withQuestionId(question1.id)
      .withScore(8)
      .withNotes('Strong technical background')
      .create(db);

    const response1_2 = await new AssessmentResponseBuilder()
      .withInstanceId(instance1.id)
      .withQuestionId(question2.id)
      .withScore(7)
      .withNotes('Good team player')
      .create(db);

    // Create responses for user2
    const response2_1 = await new AssessmentResponseBuilder()
      .withInstanceId(instance2.id)
      .withQuestionId(question1.id)
      .withScore(6)
      .withNotes('Learning new technologies')
      .create(db);

    // Test multi-user assessment functionality
    // ... your test logic here ...

    return {
      users: { manager, user1, user2 },
      assessment: {
        type: assessmentType,
        period,
        categories: [category1, category2],
        template,
        questions: [question1, question2]
      },
      instances: [instance1, instance2],
      responses: [response1_1, response1_2, response2_1]
    };
  } finally {
    await cleanup.reset();
  }
}

// Example 7: Using the Main Builder with Partial Config
export async function examplePartialConfigTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    const builder = createTestDataBuilder(db);
    
    // Create only what you need
    const data = await builder.create({
      user: { email: 'test@example.com' },
      // assessmentType will be auto-created if needed by other entities
      assessmentPeriod: { name: 'Test Period' }
    });

    // The builder automatically creates dependencies
    expect(data.user).toBeDefined();
    expect(data.assessmentPeriod).toBeDefined();
    // assessmentType might be created if needed by other entities

    return data;
  } finally {
    await cleanup.reset();
  }
}

// Example 8: Reusing Builder Instances
export async function exampleReuseBuilderTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    const builder = createTestDataBuilder(db);
    
    // First test scenario
    const scenario1 = await builder.create({
      user: { email: 'user1@example.com' },
      assessmentType: { name: 'Type 1' }
    });

    // Clean up for next scenario
    await cleanup.reset();

    // Second test scenario
    const scenario2 = await builder.create({
      user: { email: 'user2@example.com' },
      assessmentType: { name: 'Type 2' }
    });

    return { scenario1, scenario2 };
  } finally {
    await cleanup.reset();
  }
}

// Example 9: Error Handling with Required Dependencies
export async function exampleErrorHandlingTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    // This will throw an error because assessmentTypeId is required
    const categoryBuilder = new AssessmentCategoryBuilder();
    
    try {
      categoryBuilder.build();
      throw new Error('Should have thrown an error');
    } catch (error) {
      expect((error as Error).message).toContain('AssessmentTypeId is required');
    }

    // This will work because we provide the required dependency
    const assessmentType = await new AssessmentTypeBuilder().create(db);
    const category = await categoryBuilder
      .withAssessmentTypeId(assessmentType.id)
      .create(db);

    expect(category.assessmentTypeId).toBe(assessmentType.id);

    return { assessmentType, category };
  } finally {
    await cleanup.reset();
  }
}

// Example 10: Performance Test with Large Dataset
export async function examplePerformanceTest(db: ReturnType<typeof drizzle>) {
  const cleanup = createDatabaseCleanup(db);
  
  try {
    const startTime = Date.now();
    
    // Create large dataset
    const users = [];
    const assessmentTypes = [];
    const periods = [];
    
    // Create 10 users
    for (let i = 0; i < 10; i++) {
      const user = await new UserBuilder()
        .withEmail(`user${i}@company.com`)
        .withFirstName(`User${i}`)
        .create(db);
      users.push(user);
    }

    // Create 5 assessment types
    for (let i = 0; i < 5; i++) {
      const type = await new AssessmentTypeBuilder()
        .withName(`Assessment Type ${i}`)
        .create(db);
      assessmentTypes.push(type);
    }

    // Create 3 periods
    for (let i = 0; i < 3; i++) {
      const period = await new AssessmentPeriodBuilder()
        .withName(`Period ${i}`)
        .create(db);
      periods.push(period);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Created ${users.length} users, ${assessmentTypes.length} types, ${periods.length} periods in ${duration}ms`);

    return { users, assessmentTypes, periods, duration };
  } finally {
    await cleanup.reset();
  }
} 