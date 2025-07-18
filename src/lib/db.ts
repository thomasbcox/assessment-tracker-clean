import { drizzle } from 'drizzle-orm/better-sqlite3';
const Database = require('better-sqlite3');
import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
} from 'drizzle-orm/sqlite-core';

// Database connection
const sqlite = new Database('dev.db');
export const db = drizzle(sqlite);

// Schema definitions
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentPeriods = sqliteTable('assessment_periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isActive: integer('is_active').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentTypes = sqliteTable('assessment_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  purpose: text('purpose'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentCategories = sqliteTable('assessment_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assessmentTypeId: integer('assessment_type_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  displayOrder: integer('display_order').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentTemplates = sqliteTable('assessment_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assessmentTypeId: integer('assessment_type_id').notNull(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  description: text('description'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameVersionIdx: index('name_version_idx').on(table.name, table.version),
}));

export const assessmentQuestions = sqliteTable('assessment_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').notNull(),
  categoryId: integer('category_id').notNull(),
  questionText: text('question_text').notNull(),
  displayOrder: integer('display_order').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentInstances = sqliteTable('assessment_instances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  periodId: integer('period_id').notNull(),
  templateId: integer('template_id').notNull(),
  status: text('status').default('pending'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  dueDate: text('due_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentResponses = sqliteTable('assessment_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  instanceId: integer('instance_id').notNull(),
  questionId: integer('question_id').notNull(),
  score: integer('score').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const managerRelationships = sqliteTable('manager_relationships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  managerId: text('manager_id').notNull(),
  subordinateId: text('subordinate_id').notNull(),
  periodId: integer('period_id').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const invitations = sqliteTable('invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  managerId: text('manager_id').notNull(),
  templateId: integer('template_id').notNull(),
  periodId: integer('period_id').notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  status: text('status').default('pending'),
  token: text('token').notNull().unique(),
  invitedAt: text('invited_at').default(sql`CURRENT_TIMESTAMP`),
  acceptedAt: text('accepted_at'),
  expiresAt: text('expires_at').notNull(),
  reminderCount: integer('reminder_count').default(0),
  lastReminderSent: text('last_reminder_sent'),
});

export const magicLinks = sqliteTable('magic_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AssessmentPeriod = typeof assessmentPeriods.$inferSelect;
export type NewAssessmentPeriod = typeof assessmentPeriods.$inferInsert;
export type AssessmentType = typeof assessmentTypes.$inferSelect;
export type NewAssessmentType = typeof assessmentTypes.$inferInsert;
export type AssessmentCategory = typeof assessmentCategories.$inferSelect;
export type NewAssessmentCategory = typeof assessmentCategories.$inferInsert;
export type AssessmentTemplate = typeof assessmentTemplates.$inferSelect;
export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type NewAssessmentQuestion = typeof assessmentQuestions.$inferInsert;
export type AssessmentInstance = typeof assessmentInstances.$inferSelect;
export type NewAssessmentInstance = typeof assessmentInstances.$inferInsert;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type NewAssessmentResponse = typeof assessmentResponses.$inferInsert;
export type ManagerRelationship = typeof managerRelationships.$inferSelect;
export type NewManagerRelationship = typeof managerRelationships.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type MagicLink = typeof magicLinks.$inferSelect;
export type NewMagicLink = typeof magicLinks.$inferInsert; 