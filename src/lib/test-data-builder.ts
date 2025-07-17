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
// BASE BUILDER CLASS
// ============================================================================

abstract class BaseBuilder<T, TInsert> {
  protected data: Partial<TInsert> = {};
  protected counter = 1;

  protected getUniqueId(): number {
    return this.counter++;
  }

  protected getUniqueString(prefix: string): string {
    return `${prefix}-${Date.now()}-${this.getUniqueId()}`;
  }

  protected getUniqueEmail(): string {
    return `test-${Date.now()}-${this.getUniqueId()}@example.com`;
  }

  abstract build(): TInsert;
  abstract create(db: ReturnType<typeof drizzle>): Promise<T>;
}

// ============================================================================
// GROUP 1: DIMENSION TABLES (NO FOREIGN KEYS)
// ============================================================================

export class UserBuilder extends BaseBuilder<User, NewUser> {
  withId(id: string) {
    this.data.id = id;
    return this;
  }

  withEmail(email: string) {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string) {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string) {
    this.data.lastName = lastName;
    return this;
  }

  withRole(role: 'user' | 'manager' | 'admin' | 'superadmin') {
    this.data.role = role;
    return this;
  }

  withIsActive(isActive: number) {
    this.data.isActive = isActive;
    return this;
  }

  build(): NewUser {
    return {
      id: this.data.id || this.getUniqueString('user'),
      email: this.data.email || this.getUniqueEmail(),
      firstName: this.data.firstName || 'Test',
      lastName: this.data.lastName || 'User',
      role: this.data.role || 'user',
      isActive: this.data.isActive ?? 1,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<User> {
    const userData = this.build();
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
}

export class AssessmentTypeBuilder extends BaseBuilder<AssessmentType, NewAssessmentType> {
  withName(name: string) {
    this.data.name = name;
    return this;
  }

  withDescription(description: string) {
    this.data.description = description;
    return this;
  }

  withPurpose(purpose: string) {
    this.data.purpose = purpose;
    return this;
  }

  withIsActive(isActive: number) {
    this.data.isActive = isActive;
    return this;
  }

  build(): NewAssessmentType {
    return {
      name: this.data.name || `Assessment Type ${this.getUniqueId()}`,
      description: this.data.description || 'Test assessment type',
      purpose: this.data.purpose || 'Testing purposes',
      isActive: this.data.isActive ?? 1,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentType> {
    const typeData = this.build();
    const [type] = await db.insert(assessmentTypes).values(typeData).returning();
    return type;
  }
}

export class AssessmentPeriodBuilder extends BaseBuilder<AssessmentPeriod, NewAssessmentPeriod> {
  withName(name: string) {
    this.data.name = name;
    return this;
  }

  withStartDate(startDate: string) {
    this.data.startDate = startDate;
    return this;
  }

  withEndDate(endDate: string) {
    this.data.endDate = endDate;
    return this;
  }

  withIsActive(isActive: number) {
    this.data.isActive = isActive;
    return this;
  }

  build(): NewAssessmentPeriod {
    const periodId = this.getUniqueId();
    return {
      name: this.data.name || `Period ${periodId}`,
      startDate: this.data.startDate || '2024-01-01',
      endDate: this.data.endDate || '2024-12-31',
      isActive: this.data.isActive ?? 0,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentPeriod> {
    const periodData = this.build();
    const [period] = await db.insert(assessmentPeriods).values(periodData).returning();
    return period;
  }
}

// ============================================================================
// GROUP 2: TABLES WITH FOREIGN KEYS TO GROUP 1
// ============================================================================

export class AssessmentCategoryBuilder extends BaseBuilder<AssessmentCategory, NewAssessmentCategory> {
  withAssessmentTypeId(assessmentTypeId: number) {
    this.data.assessmentTypeId = assessmentTypeId;
    return this;
  }

  withName(name: string) {
    this.data.name = name;
    return this;
  }

  withDescription(description: string) {
    this.data.description = description;
    return this;
  }

  withDisplayOrder(displayOrder: number) {
    this.data.displayOrder = displayOrder;
    return this;
  }

  withIsActive(isActive: number) {
    this.data.isActive = isActive;
    return this;
  }

  build(): NewAssessmentCategory {
    if (!this.data.assessmentTypeId) {
      throw new Error('AssessmentTypeId is required for AssessmentCategory');
    }

    return {
      assessmentTypeId: this.data.assessmentTypeId,
      name: this.data.name || `Category ${this.getUniqueId()}`,
      description: this.data.description || 'Test category',
      displayOrder: this.data.displayOrder ?? this.getUniqueId(),
      isActive: this.data.isActive ?? 1,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentCategory> {
    const categoryData = this.build();
    const [category] = await db.insert(assessmentCategories).values(categoryData).returning();
    return category;
  }
}

export class AssessmentTemplateBuilder extends BaseBuilder<AssessmentTemplate, NewAssessmentTemplate> {
  withAssessmentTypeId(assessmentTypeId: number) {
    this.data.assessmentTypeId = assessmentTypeId;
    return this;
  }

  withName(name: string) {
    this.data.name = name;
    return this;
  }

  withVersion(version: string) {
    this.data.version = version;
    return this;
  }

  withDescription(description: string) {
    this.data.description = description;
    return this;
  }

  withIsActive(isActive: number) {
    this.data.isActive = isActive;
    return this;
  }

  build(): NewAssessmentTemplate {
    if (!this.data.assessmentTypeId) {
      throw new Error('AssessmentTypeId is required for AssessmentTemplate');
    }

    return {
      assessmentTypeId: this.data.assessmentTypeId,
      name: this.data.name || `Template ${this.getUniqueId()}`,
      version: this.data.version || '1.0',
      description: this.data.description || 'Test template',
      isActive: this.data.isActive ?? 1,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentTemplate> {
    const templateData = this.build();
    const [template] = await db.insert(assessmentTemplates).values(templateData).returning();
    return template;
  }
}

export class AssessmentInstanceBuilder extends BaseBuilder<AssessmentInstance, NewAssessmentInstance> {
  withUserId(userId: string) {
    this.data.userId = userId;
    return this;
  }

  withPeriodId(periodId: number) {
    this.data.periodId = periodId;
    return this;
  }

  withTemplateId(templateId: number) {
    this.data.templateId = templateId;
    return this;
  }

  withStatus(status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    this.data.status = status;
    return this;
  }

  withStartedAt(startedAt: string) {
    this.data.startedAt = startedAt;
    return this;
  }

  withCompletedAt(completedAt: string) {
    this.data.completedAt = completedAt;
    return this;
  }

  withDueDate(dueDate: string) {
    this.data.dueDate = dueDate;
    return this;
  }

  build(): NewAssessmentInstance {
    if (!this.data.userId || !this.data.periodId || !this.data.templateId) {
      throw new Error('UserId, PeriodId, and TemplateId are required for AssessmentInstance');
    }

    return {
      userId: this.data.userId,
      periodId: this.data.periodId,
      templateId: this.data.templateId,
      status: this.data.status || 'pending',
      startedAt: this.data.startedAt,
      completedAt: this.data.completedAt,
      dueDate: this.data.dueDate,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentInstance> {
    const instanceData = this.build();
    const [instance] = await db.insert(assessmentInstances).values(instanceData).returning();
    return instance;
  }
}

export class MagicLinkBuilder extends BaseBuilder<MagicLink, NewMagicLink> {
  withEmail(email: string) {
    this.data.email = email;
    return this;
  }

  withToken(token: string) {
    this.data.token = token;
    return this;
  }

  withExpiresAt(expiresAt: string) {
    this.data.expiresAt = expiresAt;
    return this;
  }

  withUsed(used: number) {
    this.data.used = used;
    return this;
  }

  build(): NewMagicLink {
    return {
      email: this.data.email || this.getUniqueEmail(),
      token: this.data.token || this.getUniqueString('token'),
      expiresAt: this.data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      used: this.data.used ?? 0,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<MagicLink> {
    const linkData = this.build();
    const [link] = await db.insert(magicLinks).values(linkData).returning();
    return link;
  }
}

// ============================================================================
// GROUP 3: TABLES WITH FOREIGN KEYS TO GROUP 2
// ============================================================================

export class AssessmentQuestionBuilder extends BaseBuilder<AssessmentQuestion, NewAssessmentQuestion> {
  withTemplateId(templateId: number) {
    this.data.templateId = templateId;
    return this;
  }

  withCategoryId(categoryId: number) {
    this.data.categoryId = categoryId;
    return this;
  }

  withQuestionText(questionText: string) {
    this.data.questionText = questionText;
    return this;
  }

  withDisplayOrder(displayOrder: number) {
    this.data.displayOrder = displayOrder;
    return this;
  }

  withIsActive(isActive: number) {
    this.data.isActive = isActive;
    return this;
  }

  build(): NewAssessmentQuestion {
    if (!this.data.templateId || !this.data.categoryId) {
      throw new Error('TemplateId and CategoryId are required for AssessmentQuestion');
    }

    return {
      templateId: this.data.templateId,
      categoryId: this.data.categoryId,
      questionText: this.data.questionText || `Question ${this.getUniqueId()}`,
      displayOrder: this.data.displayOrder ?? this.getUniqueId(),
      isActive: this.data.isActive ?? 1,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentQuestion> {
    const questionData = this.build();
    const [question] = await db.insert(assessmentQuestions).values(questionData).returning();
    return question;
  }
}

export class ManagerRelationshipBuilder extends BaseBuilder<ManagerRelationship, NewManagerRelationship> {
  withManagerId(managerId: string) {
    this.data.managerId = managerId;
    return this;
  }

  withSubordinateId(subordinateId: string) {
    this.data.subordinateId = subordinateId;
    return this;
  }

  withPeriodId(periodId: number) {
    this.data.periodId = periodId;
    return this;
  }

  build(): NewManagerRelationship {
    if (!this.data.managerId || !this.data.subordinateId || !this.data.periodId) {
      throw new Error('ManagerId, SubordinateId, and PeriodId are required for ManagerRelationship');
    }

    return {
      managerId: this.data.managerId,
      subordinateId: this.data.subordinateId,
      periodId: this.data.periodId,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<ManagerRelationship> {
    const relationshipData = this.build();
    const [relationship] = await db.insert(managerRelationships).values(relationshipData).returning();
    return relationship;
  }
}

export class InvitationBuilder extends BaseBuilder<Invitation, NewInvitation> {
  withManagerId(managerId: string) {
    this.data.managerId = managerId;
    return this;
  }

  withTemplateId(templateId: number) {
    this.data.templateId = templateId;
    return this;
  }

  withPeriodId(periodId: number) {
    this.data.periodId = periodId;
    return this;
  }

  withEmail(email: string) {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string) {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string) {
    this.data.lastName = lastName;
    return this;
  }

  withStatus(status: 'pending' | 'accepted' | 'declined' | 'expired') {
    this.data.status = status;
    return this;
  }

  withToken(token: string) {
    this.data.token = token;
    return this;
  }

  withExpiresAt(expiresAt: string) {
    this.data.expiresAt = expiresAt;
    return this;
  }

  build(): NewInvitation {
    if (!this.data.managerId || !this.data.templateId || !this.data.periodId || !this.data.email) {
      throw new Error('ManagerId, TemplateId, PeriodId, and Email are required for Invitation');
    }

    return {
      managerId: this.data.managerId,
      templateId: this.data.templateId,
      periodId: this.data.periodId,
      email: this.data.email,
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      status: this.data.status || 'pending',
      token: this.data.token || this.getUniqueString('invitation'),
      expiresAt: this.data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reminderCount: this.data.reminderCount ?? 0,
      lastReminderSent: this.data.lastReminderSent,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<Invitation> {
    const invitationData = this.build();
    const [invitation] = await db.insert(invitations).values(invitationData).returning();
    return invitation;
  }
}

// ============================================================================
// GROUP 4: TABLES WITH FOREIGN KEYS TO GROUP 3
// ============================================================================

export class AssessmentResponseBuilder extends BaseBuilder<AssessmentResponse, NewAssessmentResponse> {
  withInstanceId(instanceId: number) {
    this.data.instanceId = instanceId;
    return this;
  }

  withQuestionId(questionId: number) {
    this.data.questionId = questionId;
    return this;
  }

  withScore(score: number) {
    this.data.score = score;
    return this;
  }

  withNotes(notes: string) {
    this.data.notes = notes;
    return this;
  }

  build(): NewAssessmentResponse {
    if (!this.data.instanceId || !this.data.questionId || this.data.score === undefined) {
      throw new Error('InstanceId, QuestionId, and Score are required for AssessmentResponse');
    }

    return {
      instanceId: this.data.instanceId,
      questionId: this.data.questionId,
      score: this.data.score,
      notes: this.data.notes,
    };
  }

  async create(db: ReturnType<typeof drizzle>): Promise<AssessmentResponse> {
    const responseData = this.build();
    const [response] = await db.insert(assessmentResponses).values(responseData).returning();
    return response;
  }
}

// ============================================================================
// MAIN TEST DATA BUILDER
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

export class TestDataBuilder {
  private db: ReturnType<typeof drizzle>;
  private result: TestDataResult = {};

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  async create(config: TestDataConfig = {}): Promise<TestDataResult> {
    // Group 1: Dimension tables (no foreign keys)
    if (config.user) {
      const userBuilder = new UserBuilder();
      if (config.user.email) userBuilder.withEmail(config.user.email);
      if (config.user.firstName) userBuilder.withFirstName(config.user.firstName);
      if (config.user.lastName) userBuilder.withLastName(config.user.lastName);
      if (config.user.role && ['user', 'manager', 'admin', 'superadmin'].includes(config.user.role)) {
        userBuilder.withRole(config.user.role as 'user' | 'manager' | 'admin' | 'superadmin');
      }
      if (config.user.isActive !== undefined && config.user.isActive !== null) {
        userBuilder.withIsActive(config.user.isActive);
      }
      this.result.user = await userBuilder.create(this.db);
    }

    if (config.assessmentType) {
      this.result.assessmentType = await new AssessmentTypeBuilder()
        .withName(config.assessmentType.name || 'Test Type')
        .create(this.db);
    }

    if (config.assessmentPeriod) {
      this.result.assessmentPeriod = await new AssessmentPeriodBuilder()
        .withName(config.assessmentPeriod.name || 'Test Period')
        .create(this.db);
    }

    if (config.magicLink) {
      this.result.magicLink = await new MagicLinkBuilder()
        .withEmail(config.magicLink.email || 'test@example.com')
        .create(this.db);
    }

    // Group 2: Tables with foreign keys to Group 1
    if (config.assessmentCategory) {
      if (!this.result.assessmentType) {
        this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
      }
      this.result.assessmentCategory = await new AssessmentCategoryBuilder()
        .withAssessmentTypeId(this.result.assessmentType.id)
        .withName(config.assessmentCategory.name || 'Test Category')
        .create(this.db);
    }

    if (config.assessmentTemplate) {
      if (!this.result.assessmentType) {
        this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
      }
      this.result.assessmentTemplate = await new AssessmentTemplateBuilder()
        .withAssessmentTypeId(this.result.assessmentType.id)
        .withName(config.assessmentTemplate.name || 'Test Template')
        .create(this.db);
    }

    if (config.assessmentInstance) {
      if (!this.result.user) {
        this.result.user = await new UserBuilder().create(this.db);
      }
      if (!this.result.assessmentPeriod) {
        this.result.assessmentPeriod = await new AssessmentPeriodBuilder().create(this.db);
      }
      if (!this.result.assessmentTemplate) {
        if (!this.result.assessmentType) {
          this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
        }
        this.result.assessmentTemplate = await new AssessmentTemplateBuilder()
          .withAssessmentTypeId(this.result.assessmentType.id)
          .create(this.db);
      }
      this.result.assessmentInstance = await new AssessmentInstanceBuilder()
        .withUserId(this.result.user.id)
        .withPeriodId(this.result.assessmentPeriod.id)
        .withTemplateId(this.result.assessmentTemplate.id)
        .withStatus((config.assessmentInstance.status && ['pending', 'in_progress', 'completed', 'cancelled'].includes(config.assessmentInstance.status)) 
          ? config.assessmentInstance.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
          : 'pending')
        .create(this.db);
    }

    // Group 3: Tables with foreign keys to Group 2
    if (config.assessmentQuestion) {
      if (!this.result.assessmentTemplate) {
        if (!this.result.assessmentType) {
          this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
        }
        this.result.assessmentTemplate = await new AssessmentTemplateBuilder()
          .withAssessmentTypeId(this.result.assessmentType.id)
          .create(this.db);
      }
      if (!this.result.assessmentCategory) {
        this.result.assessmentCategory = await new AssessmentCategoryBuilder()
          .withAssessmentTypeId(this.result.assessmentType!.id)
          .create(this.db);
      }
      this.result.assessmentQuestion = await new AssessmentQuestionBuilder()
        .withTemplateId(this.result.assessmentTemplate.id)
        .withCategoryId(this.result.assessmentCategory.id)
        .withQuestionText(config.assessmentQuestion.questionText || 'Test Question')
        .create(this.db);
    }

    if (config.managerRelationship) {
      if (!this.result.user) {
        this.result.user = await new UserBuilder().create(this.db);
      }
      const subordinateUser = await new UserBuilder().create(this.db);
      if (!this.result.assessmentPeriod) {
        this.result.assessmentPeriod = await new AssessmentPeriodBuilder().create(this.db);
      }
      this.result.managerRelationship = await new ManagerRelationshipBuilder()
        .withManagerId(this.result.user.id)
        .withSubordinateId(subordinateUser.id)
        .withPeriodId(this.result.assessmentPeriod.id)
        .create(this.db);
    }

    if (config.invitation) {
      if (!this.result.user) {
        this.result.user = await new UserBuilder().create(this.db);
      }
      if (!this.result.assessmentTemplate) {
        if (!this.result.assessmentType) {
          this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
        }
        this.result.assessmentTemplate = await new AssessmentTemplateBuilder()
          .withAssessmentTypeId(this.result.assessmentType.id)
          .create(this.db);
      }
      if (!this.result.assessmentPeriod) {
        this.result.assessmentPeriod = await new AssessmentPeriodBuilder().create(this.db);
      }
      this.result.invitation = await new InvitationBuilder()
        .withManagerId(this.result.user.id)
        .withTemplateId(this.result.assessmentTemplate.id)
        .withPeriodId(this.result.assessmentPeriod.id)
        .withEmail(config.invitation.email || 'invite@example.com')
        .create(this.db);
    }

    // Group 4: Tables with foreign keys to Group 3
    if (config.assessmentResponse) {
      if (!this.result.assessmentInstance) {
        if (!this.result.user) {
          this.result.user = await new UserBuilder().create(this.db);
        }
        if (!this.result.assessmentPeriod) {
          this.result.assessmentPeriod = await new AssessmentPeriodBuilder().create(this.db);
        }
        if (!this.result.assessmentTemplate) {
          if (!this.result.assessmentType) {
            this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
          }
          this.result.assessmentTemplate = await new AssessmentTemplateBuilder()
            .withAssessmentTypeId(this.result.assessmentType.id)
            .create(this.db);
        }
        this.result.assessmentInstance = await new AssessmentInstanceBuilder()
          .withUserId(this.result.user.id)
          .withPeriodId(this.result.assessmentPeriod.id)
          .withTemplateId(this.result.assessmentTemplate.id)
          .create(this.db);
      }
      if (!this.result.assessmentQuestion) {
        if (!this.result.assessmentTemplate) {
          if (!this.result.assessmentType) {
            this.result.assessmentType = await new AssessmentTypeBuilder().create(this.db);
          }
          this.result.assessmentTemplate = await new AssessmentTemplateBuilder()
            .withAssessmentTypeId(this.result.assessmentType.id)
            .create(this.db);
        }
        if (!this.result.assessmentCategory) {
          this.result.assessmentCategory = await new AssessmentCategoryBuilder()
            .withAssessmentTypeId(this.result.assessmentType!.id)
            .create(this.db);
        }
        this.result.assessmentQuestion = await new AssessmentQuestionBuilder()
          .withTemplateId(this.result.assessmentTemplate.id)
          .withCategoryId(this.result.assessmentCategory.id)
          .create(this.db);
      }
      this.result.assessmentResponse = await new AssessmentResponseBuilder()
        .withInstanceId(this.result.assessmentInstance.id)
        .withQuestionId(this.result.assessmentQuestion.id)
        .withScore(config.assessmentResponse.score ?? 5)
        .withNotes(config.assessmentResponse.notes || 'Test response notes')
        .create(this.db);
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

export class DatabaseCleanup {
  private db: ReturnType<typeof drizzle>;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  /**
   * Truncate all tables in dependency-aware order (reverse of creation order)
   */
  async truncateAll(): Promise<void> {
    // Group 4: Tables with foreign keys to Group 3
    await this.db.delete(assessmentResponses);
    
    // Group 3: Tables with foreign keys to Group 2
    await this.db.delete(assessmentQuestions);
    await this.db.delete(managerRelationships);
    await this.db.delete(invitations);
    
    // Group 2: Tables with foreign keys to Group 1
    await this.db.delete(assessmentCategories);
    await this.db.delete(assessmentTemplates);
    await this.db.delete(assessmentInstances);
    await this.db.delete(magicLinks);
    
    // Group 1: Dimension tables (no foreign keys)
    await this.db.delete(assessmentPeriods);
    await this.db.delete(assessmentTypes);
    await this.db.delete(users);
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
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function createTestDataBuilder(db: ReturnType<typeof drizzle>): TestDataBuilder {
  return new TestDataBuilder(db);
}

export function createDatabaseCleanup(db: ReturnType<typeof drizzle>): DatabaseCleanup {
  return new DatabaseCleanup(db);
} 