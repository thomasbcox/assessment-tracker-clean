import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
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
  type User,
  type NewUser,
  type AssessmentType,
  type NewAssessmentType,
  type AssessmentPeriod,
  type NewAssessmentPeriod,
  type AssessmentCategory,
  type NewAssessmentCategory,
  type AssessmentTemplate,
  type NewAssessmentTemplate,
  type AssessmentQuestion,
  type NewAssessmentQuestion,
  type AssessmentInstance,
  type NewAssessmentInstance,
  type AssessmentResponse,
  type NewAssessmentResponse,
  type ManagerRelationship,
  type NewManagerRelationship,
  type Invitation,
  type NewInvitation,
  type MagicLink,
  type NewMagicLink,
} from './db';

// ============================================================================
// SIMPLE TEST DATA BUILDER
// ============================================================================

export interface TestDataConfig {
  user?: Partial<NewUser>;
  assessmentType?: Partial<NewAssessmentType>;
  assessmentPeriod?: Partial<NewAssessmentPeriod>;
  assessmentCategory?: Partial<NewAssessmentCategory>;
  assessmentTemplate?: Partial<NewAssessmentTemplate>;
  assessmentInstance?: Partial<NewAssessmentInstance>;
  assessmentQuestion?: Partial<NewAssessmentQuestion>;
  assessmentResponse?: Partial<NewAssessmentResponse>;
  managerRelationship?: Partial<NewManagerRelationship>;
  invitation?: Partial<NewInvitation>;
  magicLink?: Partial<NewMagicLink>;
}

export interface TestDataResult {
  user?: User;
  assessmentType?: AssessmentType;
  assessmentPeriod?: AssessmentPeriod;
  assessmentCategory?: AssessmentCategory;
  assessmentTemplate?: AssessmentTemplate;
  assessmentInstance?: AssessmentInstance;
  assessmentQuestion?: AssessmentQuestion;
  assessmentResponse?: AssessmentResponse;
  managerRelationship?: ManagerRelationship;
  invitation?: Invitation;
  magicLink?: MagicLink;
}

// Add a static global counter for uniqueness
let globalTestDataCounter = 1;

export class SimpleTestDataBuilder {
  private db: ReturnType<typeof drizzle>;
  private result: TestDataResult = {};
  private counter = 1;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  private getUniqueId(): number {
    return globalTestDataCounter++;
  }

  private getUniqueString(prefix: string): string {
    return `${prefix}_${Date.now()}_${globalTestDataCounter++}`;
  }

  private getUniqueEmail(): string {
    return `user_${Date.now()}_${globalTestDataCounter++}@example.com`;
  }

  async create(config: TestDataConfig = {}): Promise<TestDataResult> {
    // Group 1: Dimension tables (no foreign keys)
    if (config.user) {
      const userData: NewUser = {
        id: config.user.id || this.getUniqueString('user'),
        email: config.user.email || this.getUniqueEmail(),
        firstName: config.user.firstName || 'Test',
        lastName: config.user.lastName || 'User',
        role: config.user.role || 'user',
        isActive: config.user.isActive ?? 1,
      };
      const [user] = await this.db.insert(users).values(userData).returning();
      this.result.user = user;
    }

    if (config.assessmentType) {
      const typeData: NewAssessmentType = {
        name: config.assessmentType.name || `Assessment Type ${this.getUniqueId()}`,
        description: config.assessmentType.description || 'Test assessment type',
        purpose: config.assessmentType.purpose || 'Testing purposes',
        isActive: config.assessmentType.isActive ?? 1,
      };
      const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
      this.result.assessmentType = type;
    }

    if (config.assessmentPeriod) {
      const periodData: NewAssessmentPeriod = {
        name: config.assessmentPeriod.name || `Period ${this.getUniqueId()}`,
        startDate: config.assessmentPeriod.startDate || '2024-01-01',
        endDate: config.assessmentPeriod.endDate || '2024-12-31',
        isActive: config.assessmentPeriod.isActive ?? 0,
      };
      const [period] = await this.db.insert(assessmentPeriods).values(periodData).returning();
      this.result.assessmentPeriod = period;
    }

    if (config.magicLink) {
      const linkData: NewMagicLink = {
        email: config.magicLink.email || this.getUniqueEmail(),
        token: config.magicLink.token || this.getUniqueString('token'),
        expiresAt: config.magicLink.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: config.magicLink.used ?? 0,
      };
      const [link] = await this.db.insert(magicLinks).values(linkData).returning();
      this.result.magicLink = link;
    }

    // Group 2: Tables with foreign keys to Group 1
    if (config.assessmentCategory) {
      if (!this.result.assessmentType) {
        const typeData: NewAssessmentType = {
          name: `Assessment Type ${this.getUniqueId()}`,
          description: 'Test assessment type',
          purpose: 'Testing purposes',
          isActive: 1,
        };
        const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
        this.result.assessmentType = type;
      }

      const categoryData: NewAssessmentCategory = {
        assessmentTypeId: this.result.assessmentType!.id,
        name: config.assessmentCategory.name || `Category ${this.getUniqueId()}`,
        description: config.assessmentCategory.description || 'Test category',
        displayOrder: config.assessmentCategory.displayOrder ?? this.getUniqueId(),
        isActive: config.assessmentCategory.isActive ?? 1,
      };
      const [category] = await this.db.insert(assessmentCategories).values(categoryData).returning();
      this.result.assessmentCategory = category;
    }

    if (config.assessmentTemplate) {
      if (!this.result.assessmentType) {
        const typeData: NewAssessmentType = {
          name: `Assessment Type ${this.getUniqueId()}`,
          description: 'Test assessment type',
          purpose: 'Testing purposes',
          isActive: 1,
        };
        const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
        this.result.assessmentType = type;
      }

      const templateData: NewAssessmentTemplate = {
        assessmentTypeId: this.result.assessmentType!.id,
        name: config.assessmentTemplate.name || `Template ${this.getUniqueId()}`,
        version: config.assessmentTemplate.version || '1.0',
        description: config.assessmentTemplate.description || 'Test template',
        isActive: config.assessmentTemplate.isActive ?? 1,
      };
      const [template] = await this.db.insert(assessmentTemplates).values(templateData).returning();
      this.result.assessmentTemplate = template;
    }

    // Group 2: Tables with foreign keys to Group 1
    if (config.assessmentInstance) {
      if (!this.result.user) {
        const userData: NewUser = {
          id: this.getUniqueString('user'),
          email: this.getUniqueEmail(),
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isActive: 1,
        };
        const [user] = await this.db.insert(users).values(userData).returning();
        this.result.user = user;
      }

      if (!this.result.assessmentPeriod) {
        const periodData: NewAssessmentPeriod = {
          name: `Period ${this.getUniqueId()}`,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          isActive: 0,
        };
        const [period] = await this.db.insert(assessmentPeriods).values(periodData).returning();
        this.result.assessmentPeriod = period;
      }

      if (!this.result.assessmentTemplate) {
        if (!this.result.assessmentType) {
          const typeData: NewAssessmentType = {
            name: `Assessment Type ${this.getUniqueId()}`,
            description: 'Test assessment type',
            purpose: 'Testing purposes',
            isActive: 1,
          };
          const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
          this.result.assessmentType = type;
        }

        const templateData: NewAssessmentTemplate = {
          assessmentTypeId: this.result.assessmentType!.id,
          name: `Template ${this.getUniqueId()}`,
          version: '1.0',
          description: 'Test template',
          isActive: 1,
        };
        const [template] = await this.db.insert(assessmentTemplates).values(templateData).returning();
        this.result.assessmentTemplate = template;
      }

      const instanceData: NewAssessmentInstance = {
        userId: this.result.user.id,
        periodId: this.result.assessmentPeriod.id,
        templateId: this.result.assessmentTemplate.id,
        status: config.assessmentInstance.status || 'pending',
        startedAt: config.assessmentInstance.startedAt,
        completedAt: config.assessmentInstance.completedAt,
        dueDate: config.assessmentInstance.dueDate,
      };
      const [instance] = await this.db.insert(assessmentInstances).values(instanceData).returning();
      this.result.assessmentInstance = instance;
    }

    // Group 3: Tables with foreign keys to Group 2
    if (config.assessmentQuestion) {
      if (!this.result.assessmentTemplate) {
        if (!this.result.assessmentType) {
          const typeData: NewAssessmentType = {
            name: `Assessment Type ${this.getUniqueId()}`,
            description: 'Test assessment type',
            purpose: 'Testing purposes',
            isActive: 1,
          };
          const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
          this.result.assessmentType = type;
        }

        const templateData: NewAssessmentTemplate = {
          assessmentTypeId: this.result.assessmentType!.id,
          name: `Template ${this.getUniqueId()}`,
          version: '1.0',
          description: 'Test template',
          isActive: 1,
        };
        const [template] = await this.db.insert(assessmentTemplates).values(templateData).returning();
        this.result.assessmentTemplate = template;
      }

      if (!this.result.assessmentCategory) {
        if (!this.result.assessmentType) {
          const typeData: NewAssessmentType = {
            name: `Assessment Type ${this.getUniqueId()}`,
            description: 'Test assessment type',
            purpose: 'Testing purposes',
            isActive: 1,
          };
          const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
          this.result.assessmentType = type;
        }

        const categoryData: NewAssessmentCategory = {
          assessmentTypeId: this.result.assessmentType!.id,
          name: `Category ${this.getUniqueId()}`,
          description: 'Test category',
          displayOrder: this.getUniqueId(),
          isActive: 1,
        };
        const [category] = await this.db.insert(assessmentCategories).values(categoryData).returning();
        this.result.assessmentCategory = category;
      }

      const questionData: NewAssessmentQuestion = {
        templateId: this.result.assessmentTemplate.id,
        categoryId: this.result.assessmentCategory.id,
        questionText: config.assessmentQuestion.questionText || `Question ${this.getUniqueId()}`,
        displayOrder: config.assessmentQuestion.displayOrder ?? this.getUniqueId(),
        isActive: config.assessmentQuestion.isActive ?? 1,
      };
      const [question] = await this.db.insert(assessmentQuestions).values(questionData).returning();
      this.result.assessmentQuestion = question;
    }

    if (config.managerRelationship) {
      if (!this.result.user) {
        const userData: NewUser = {
          id: this.getUniqueString('user'),
          email: this.getUniqueEmail(),
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isActive: 1,
        };
        const [user] = await this.db.insert(users).values(userData).returning();
        this.result.user = user;
      }

      // Create subordinate user
      const subordinateData: NewUser = {
        id: this.getUniqueString('user'),
        email: this.getUniqueEmail(),
        firstName: 'Subordinate',
        lastName: 'User',
        role: 'user',
        isActive: 1,
      };
      const [subordinate] = await this.db.insert(users).values(subordinateData).returning();

      if (!this.result.assessmentPeriod) {
        const periodData: NewAssessmentPeriod = {
          name: `Period ${this.getUniqueId()}`,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          isActive: 0,
        };
        const [period] = await this.db.insert(assessmentPeriods).values(periodData).returning();
        this.result.assessmentPeriod = period;
      }

      const relationshipData: NewManagerRelationship = {
        managerId: this.result.user.id,
        subordinateId: subordinate.id,
        periodId: this.result.assessmentPeriod.id,
      };
      const [relationship] = await this.db.insert(managerRelationships).values(relationshipData).returning();
      this.result.managerRelationship = relationship;
    }

    if (config.invitation) {
      if (!this.result.user) {
        const userData: NewUser = {
          id: this.getUniqueString('user'),
          email: this.getUniqueEmail(),
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isActive: 1,
        };
        const [user] = await this.db.insert(users).values(userData).returning();
        this.result.user = user;
      }

      if (!this.result.assessmentTemplate) {
        if (!this.result.assessmentType) {
          const typeData: NewAssessmentType = {
            name: `Assessment Type ${this.getUniqueId()}`,
            description: 'Test assessment type',
            purpose: 'Testing purposes',
            isActive: 1,
          };
          const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
          this.result.assessmentType = type;
        }

        const templateData: NewAssessmentTemplate = {
          assessmentTypeId: this.result.assessmentType!.id,
          name: `Template ${this.getUniqueId()}`,
          version: '1.0',
          description: 'Test template',
          isActive: 1,
        };
        const [template] = await this.db.insert(assessmentTemplates).values(templateData).returning();
        this.result.assessmentTemplate = template;
      }

      if (!this.result.assessmentPeriod) {
        const periodData: NewAssessmentPeriod = {
          name: `Period ${this.getUniqueId()}`,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          isActive: 0,
        };
        const [period] = await this.db.insert(assessmentPeriods).values(periodData).returning();
        this.result.assessmentPeriod = period;
      }

      const invitationData: NewInvitation = {
        managerId: this.result.user.id,
        templateId: this.result.assessmentTemplate.id,
        periodId: this.result.assessmentPeriod.id,
        email: config.invitation.email || 'invite@example.com',
        firstName: config.invitation.firstName,
        lastName: config.invitation.lastName,
        status: config.invitation.status || 'pending',
        token: config.invitation.token || this.getUniqueString('invitation'),
        expiresAt: config.invitation.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: config.invitation.reminderCount ?? 0,
        lastReminderSent: config.invitation.lastReminderSent,
      };
      const [invitation] = await this.db.insert(invitations).values(invitationData).returning();
      this.result.invitation = invitation;
    }

    // Group 4: Tables with foreign keys to Group 3
    if (config.assessmentResponse) {
      if (!this.result.assessmentInstance) {
        if (!this.result.user) {
          const userData: NewUser = {
            id: this.getUniqueString('user'),
            email: this.getUniqueEmail(),
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            isActive: 1,
          };
          const [user] = await this.db.insert(users).values(userData).returning();
          this.result.user = user;
        }

        if (!this.result.assessmentPeriod) {
          const periodData: NewAssessmentPeriod = {
            name: `Period ${this.getUniqueId()}`,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            isActive: 0,
          };
          const [period] = await this.db.insert(assessmentPeriods).values(periodData).returning();
          this.result.assessmentPeriod = period;
        }

        if (!this.result.assessmentTemplate) {
          if (!this.result.assessmentType) {
            const typeData: NewAssessmentType = {
              name: `Assessment Type ${this.getUniqueId()}`,
              description: 'Test assessment type',
              purpose: 'Testing purposes',
              isActive: 1,
            };
            const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
            this.result.assessmentType = type;
          }

          const templateData: NewAssessmentTemplate = {
            assessmentTypeId: this.result.assessmentType!.id,
            name: `Template ${this.getUniqueId()}`,
            version: '1.0',
            description: 'Test template',
            isActive: 1,
          };
          const [template] = await this.db.insert(assessmentTemplates).values(templateData).returning();
          this.result.assessmentTemplate = template;
        }

        const instanceData: NewAssessmentInstance = {
          userId: this.result.user.id,
          periodId: this.result.assessmentPeriod.id,
          templateId: this.result.assessmentTemplate.id,
          status: 'in_progress',
        };
        const [instance] = await this.db.insert(assessmentInstances).values(instanceData).returning();
        this.result.assessmentInstance = instance;
      }

      if (!this.result.assessmentQuestion) {
        if (!this.result.assessmentTemplate) {
          if (!this.result.assessmentType) {
            const typeData: NewAssessmentType = {
              name: `Assessment Type ${this.getUniqueId()}`,
              description: 'Test assessment type',
              purpose: 'Testing purposes',
              isActive: 1,
            };
            const [type] = await this.db.insert(assessmentTypes).values(typeData).returning();
            this.result.assessmentType = type;
          }

          const templateData: NewAssessmentTemplate = {
            assessmentTypeId: this.result.assessmentType!.id,
            name: `Template ${this.getUniqueId()}`,
            version: '1.0',
            description: 'Test template',
            isActive: 1,
          };
          const [template] = await this.db.insert(assessmentTemplates).values(templateData).returning();
          this.result.assessmentTemplate = template;
        }

        if (!this.result.assessmentCategory) {
          const categoryData: NewAssessmentCategory = {
            assessmentTypeId: this.result.assessmentType!.id,
            name: `Category ${this.getUniqueId()}`,
            description: 'Test category',
            displayOrder: this.getUniqueId(),
            isActive: 1,
          };
          const [category] = await this.db.insert(assessmentCategories).values(categoryData).returning();
          this.result.assessmentCategory = category;
        }

        const questionData: NewAssessmentQuestion = {
          templateId: this.result.assessmentTemplate.id,
          categoryId: this.result.assessmentCategory.id,
          questionText: `Question ${this.getUniqueId()}`,
          displayOrder: this.getUniqueId(),
          isActive: 1,
        };
        const [question] = await this.db.insert(assessmentQuestions).values(questionData).returning();
        this.result.assessmentQuestion = question;
      }

      const responseData: NewAssessmentResponse = {
        instanceId: this.result.assessmentInstance.id,
        questionId: this.result.assessmentQuestion.id,
        score: config.assessmentResponse.score || 5,
        notes: config.assessmentResponse.notes,
      };
      const [response] = await this.db.insert(assessmentResponses).values(responseData).returning();
      this.result.assessmentResponse = response;
    }

    return this.result;
  }

  getResult(): TestDataResult {
    return this.result;
  }
}

// ============================================================================
// DATABASE CLEANUP UTILITIES
// ============================================================================

export class SimpleDatabaseCleanup {
  private db: ReturnType<typeof drizzle>;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  /**
   * Truncate all tables in dependency-aware order (reverse of creation order)
   */
  async truncateAll(): Promise<void> {
    // Use raw SQL to properly handle foreign key constraints
    await this.db.run('DELETE FROM assessment_responses');
    await this.db.run('DELETE FROM assessment_questions');
    await this.db.run('DELETE FROM manager_relationships');
    await this.db.run('DELETE FROM invitations');
    await this.db.run('DELETE FROM assessment_instances'); // moved up before templates
    await this.db.run('DELETE FROM assessment_categories');
    await this.db.run('DELETE FROM assessment_templates');
    await this.db.run('DELETE FROM magic_links');
    await this.db.run('DELETE FROM assessment_periods');
    await this.db.run('DELETE FROM assessment_types');
    await this.db.run('DELETE FROM users');
  }

  /**
   * Reset auto-increment counters (SQLite specific)
   */
  async resetCounters(): Promise<void> {
    await this.db.run('DELETE FROM sqlite_sequence');
  }

  /**
   * Complete database reset
   */
  async reset(): Promise<void> {
    await this.truncateAll();
    await this.resetCounters();
    globalTestDataCounter = 1;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function createSimpleTestDataBuilder(db: ReturnType<typeof drizzle>): SimpleTestDataBuilder {
  return new SimpleTestDataBuilder(db);
}

export function createSimpleDatabaseCleanup(db: ReturnType<typeof drizzle>): SimpleDatabaseCleanup {
  return new SimpleDatabaseCleanup(db);
} 