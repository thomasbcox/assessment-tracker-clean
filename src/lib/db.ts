import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
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

export const assessmentInstances = sqliteTable('assessment_instances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  periodId: integer('period_id').notNull(),
  type: text('type').notNull(),
  status: text('status').default('pending'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentQuestions = sqliteTable('assessment_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  isActive: integer('is_active').default(1),
});

export const assessmentResponses = sqliteTable('assessment_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assessmentId: integer('assessment_id').notNull(),
  questionId: integer('question_id').notNull(),
  score: integer('score').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const magicLinks = sqliteTable('magic_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const managerRelationships = sqliteTable('manager_relationships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  managerId: text('manager_id').notNull(),
  subordinateId: text('subordinate_id').notNull(),
  periodId: integer('period_id').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AssessmentPeriod = typeof assessmentPeriods.$inferSelect;
export type NewAssessmentPeriod = typeof assessmentPeriods.$inferInsert;
export type AssessmentInstance = typeof assessmentInstances.$inferSelect;
export type NewAssessmentInstance = typeof assessmentInstances.$inferInsert;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type NewAssessmentQuestion = typeof assessmentQuestions.$inferInsert;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type NewAssessmentResponse = typeof assessmentResponses.$inferInsert; 