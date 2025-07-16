// Service Interfaces for Assessment Tracker
// All services follow consistent patterns for maintainability and testability

import { z } from 'zod';

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ServiceError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// USER SERVICE INTERFACES
// ============================================================================

export const CreateUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'user'])
});

export const UpdateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'user']).optional(),
  isActive: z.number().optional()
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: number;
  createdAt: string;
}

export interface UserStats {
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  totalResponses: number;
  averageScore: number;
  lastAssessmentDate: string | null;
}

export interface IUserService {
  // CRUD Operations
  createUser(input: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, input: UpdateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Query Operations
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  getInactiveUsers(): Promise<User[]>;
  
  // Business Operations
  getUserStats(userId: string): Promise<UserStats>;
  getUserAssessments(userId: string): Promise<any[]>;
  deactivateUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
  
  // Validation
  validateUserData(data: CreateUserInput): ValidationResult;
}

// ============================================================================
// ASSESSMENT TEMPLATES SERVICE INTERFACES
// ============================================================================

export const CreateTemplateSchema = z.object({
  assessmentTypeId: z.string(),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional()
});

export const UpdateTemplateSchema = z.object({
  assessmentTypeId: z.string().optional(),
  name: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  description: z.string().optional()
});

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

export interface TemplateWithTypeName {
  id: number;
  assessmentTypeId: number;
  assessmentTypeName: string;
  name: string;
  version: string;
  description: string | null;
  isActive: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IAssessmentTemplatesService {
  // CRUD Operations
  createTemplate(input: CreateTemplateInput): Promise<TemplateWithTypeName>;
  getTemplateById(id: string): Promise<TemplateWithTypeName | null>;
  updateTemplate(id: string, input: UpdateTemplateInput): Promise<TemplateWithTypeName>;
  deleteTemplate(id: string): Promise<void>;
  
  // Query Operations
  getAllTemplates(): Promise<TemplateWithTypeName[]>;
  getActiveTemplates(): Promise<TemplateWithTypeName[]>;
  getTemplatesByType(typeId: string): Promise<TemplateWithTypeName[]>;
  
  // Business Operations
  deactivateTemplate(id: string): Promise<TemplateWithTypeName>;
  
  // Validation
  validateTemplateData(data: CreateTemplateInput): ValidationResult;
}

// ============================================================================
// ASSESSMENT INSTANCES SERVICE INTERFACES
// ============================================================================

export const CreateInstanceSchema = z.object({
  userId: z.string(),
  templateId: z.number(),
  periodId: z.number(),
  status: z.enum(['pending', 'in_progress', 'completed', 'archived']).optional(),
  completedAt: z.string().optional()
});

export const UpdateInstanceSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'archived']).optional(),
  score: z.number().optional(),
  completedAt: z.string().optional()
});

export type CreateInstanceInput = z.infer<typeof CreateInstanceSchema>;
export type UpdateInstanceInput = z.infer<typeof UpdateInstanceSchema>;

export interface AssessmentInstance {
  id: number;
  userId: string;
  templateId: number;
  periodId: number;
  status: string;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface IAssessmentInstancesService {
  // CRUD Operations
  createInstance(input: CreateInstanceInput): Promise<AssessmentInstance>;
  getInstanceById(id: number): Promise<AssessmentInstance | null>;
  updateInstance(id: number, input: UpdateInstanceInput): Promise<AssessmentInstance>;
  deleteInstance(id: number): Promise<void>;
  
  // Query Operations
  getInstancesByUser(userId: string): Promise<AssessmentInstance[]>;
  getInstancesByStatus(status: string): Promise<AssessmentInstance[]>;
  getInstancesByPeriod(periodId: number): Promise<AssessmentInstance[]>;
  getInstancesByTemplate(templateId: number): Promise<AssessmentInstance[]>;
  
  // Business Operations
  updateInstanceStatus(id: number, status: string, completedAt?: string): Promise<AssessmentInstance>;
  
  // Validation
  validateInstanceData(data: CreateInstanceInput): ValidationResult;
}

// ============================================================================
// ASSESSMENT RESPONSES SERVICE INTERFACES
// ============================================================================

export const CreateResponseSchema = z.object({
  userId: z.string(),
  instanceId: z.number(),
  questionId: z.number(),
  answer: z.string(),
  score: z.number().optional()
});

export const UpdateResponseSchema = z.object({
  answer: z.string().optional(),
  score: z.number().optional()
});

export type CreateResponseInput = z.infer<typeof CreateResponseSchema>;
export type UpdateResponseInput = z.infer<typeof UpdateResponseSchema>;

export interface AssessmentResponse {
  id: number;
  userId: string;
  instanceId: number;
  questionId: number;
  answer: string;
  score: number | null;
  createdAt: string;
}

export interface IAssessmentResponsesService {
  // CRUD Operations
  createResponse(input: CreateResponseInput): Promise<AssessmentResponse>;
  getResponseById(id: number): Promise<AssessmentResponse | null>;
  updateResponse(id: number, input: UpdateResponseInput): Promise<AssessmentResponse>;
  deleteResponse(id: number): Promise<void>;
  
  // Query Operations
  getResponsesByInstance(instanceId: number): Promise<AssessmentResponse[]>;
  getResponsesByUser(userId: string): Promise<AssessmentResponse[]>;
  getResponsesByQuestion(questionId: number): Promise<AssessmentResponse[]>;
  
  // Business Operations
  submitResponse(input: CreateResponseInput): Promise<AssessmentResponse>;
  getInstanceScore(instanceId: number): Promise<number>;
  
  // Validation
  validateResponseData(data: CreateResponseInput): ValidationResult;
}

// ============================================================================
// ASSESSMENT PERIODS SERVICE INTERFACES
// ============================================================================

export const CreatePeriodSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.number().optional()
});

export const UpdatePeriodSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.number().optional()
});

export type CreatePeriodInput = z.infer<typeof CreatePeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof UpdatePeriodSchema>;

export interface AssessmentPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: number;
  createdAt: string;
}

export interface IAssessmentPeriodsService {
  // CRUD Operations
  createPeriod(input: CreatePeriodInput): Promise<AssessmentPeriod>;
  getPeriodById(id: number): Promise<AssessmentPeriod | null>;
  updatePeriod(id: number, input: UpdatePeriodInput): Promise<AssessmentPeriod>;
  deletePeriod(id: number): Promise<void>;
  
  // Query Operations
  getAllPeriods(): Promise<AssessmentPeriod[]>;
  getActivePeriod(): Promise<AssessmentPeriod | null>;
  
  // Business Operations
  setActivePeriod(id: number): Promise<AssessmentPeriod>;
  
  // Validation
  validatePeriodData(data: CreatePeriodInput): ValidationResult;
}

// ============================================================================
// ASSESSMENT CATEGORIES SERVICE INTERFACES
// ============================================================================

export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.number().optional()
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.number().optional()
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export interface AssessmentCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: number;
  createdAt: string;
}

export interface IAssessmentCategoriesService {
  // CRUD Operations
  createCategory(input: CreateCategoryInput): Promise<AssessmentCategory>;
  getCategoryById(id: number): Promise<AssessmentCategory | null>;
  updateCategory(id: number, input: UpdateCategoryInput): Promise<AssessmentCategory>;
  deleteCategory(id: number): Promise<void>;
  
  // Query Operations
  getAllCategories(): Promise<AssessmentCategory[]>;
  getActiveCategories(): Promise<AssessmentCategory[]>;
  
  // Business Operations
  activateCategory(id: number): Promise<AssessmentCategory>;
  deactivateCategory(id: number): Promise<AssessmentCategory>;
  
  // Validation
  validateCategoryData(data: CreateCategoryInput): ValidationResult;
}

// ============================================================================
// ASSESSMENT QUESTIONS SERVICE INTERFACES
// ============================================================================

export const CreateQuestionSchema = z.object({
  templateId: z.number(),
  categoryId: z.number(),
  questionText: z.string().min(1),
  questionType: z.enum(['multiple_choice', 'text', 'rating', 'boolean']),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.number().optional()
});

export const UpdateQuestionSchema = z.object({
  categoryId: z.number().optional(),
  questionText: z.string().min(1).optional(),
  questionType: z.enum(['multiple_choice', 'text', 'rating', 'boolean']).optional(),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.number().optional()
});

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

export interface AssessmentQuestion {
  id: number;
  templateId: number;
  categoryId: number;
  questionText: string;
  questionType: string;
  options: string | null;
  isRequired: number;
  isActive: number;
  createdAt: string;
}

export interface IAssessmentQuestionsService {
  // CRUD Operations
  createQuestion(input: CreateQuestionInput): Promise<AssessmentQuestion>;
  getQuestionById(id: number): Promise<AssessmentQuestion | null>;
  updateQuestion(id: number, input: UpdateQuestionInput): Promise<AssessmentQuestion>;
  deleteQuestion(id: number): Promise<void>;
  
  // Query Operations
  getQuestionsByTemplate(templateId: number): Promise<AssessmentQuestion[]>;
  getQuestionsByCategory(categoryId: number): Promise<AssessmentQuestion[]>;
  getActiveQuestions(): Promise<AssessmentQuestion[]>;
  
  // Business Operations
  activateQuestion(id: number): Promise<AssessmentQuestion>;
  deactivateQuestion(id: number): Promise<AssessmentQuestion>;
  
  // Validation
  validateQuestionData(data: CreateQuestionInput): ValidationResult;
}

// ============================================================================
// ADMIN SERVICE INTERFACES
// ============================================================================

export const CreateAdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'user']),
  isActive: z.number().optional()
});

export const UpdateAdminUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'user']).optional(),
  isActive: z.number().optional()
});

export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof UpdateAdminUserSchema>;

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: number | null;
  createdAt: string;
}

export interface IAdminService {
  // CRUD Operations
  createUser(input: CreateAdminUserInput): Promise<AdminUser>;
  getUserById(userId: string): Promise<AdminUser | null>;
  updateUser(userId: string, input: UpdateAdminUserInput): Promise<AdminUser>;
  deleteUser(userId: string): Promise<void>;
  
  // Query Operations
  getAllUsers(): Promise<AdminUser[]>;
  getUsersByRole(role: string): Promise<AdminUser[]>;
  getActiveUsers(): Promise<AdminUser[]>;
  getInactiveUsers(): Promise<AdminUser[]>;
  
  // Business Operations
  searchUsers(query: string): Promise<AdminUser[]>;
  deactivateUser(userId: string): Promise<AdminUser>;
  activateUser(userId: string): Promise<AdminUser>;
  
  // Validation
  validateUserData(data: CreateAdminUserInput): ValidationResult;
}

// ============================================================================
// AUTH SERVICE INTERFACES
// ============================================================================

export const AuthCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;

export interface AuthResult {
  success: boolean;
  user: User | null;
  message: string;
}

export interface IAuthService {
  // Authentication Operations
  authenticateUser(email: string, password: string): Promise<AuthResult>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  
  // User Management
  createUser(input: CreateUserInput): Promise<User>;
  updateUser(id: string, input: UpdateUserInput): Promise<User>;
  deactivateUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
  
  // Validation
  validateUserData(data: CreateUserInput): ValidationResult;
}

// ============================================================================
// EMAIL SERVICE INTERFACES
// ============================================================================

export const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional()
});

export type EmailInput = z.infer<typeof EmailSchema>;

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  // Email Operations
  sendEmail(input: EmailInput): Promise<EmailResult>;
  sendWelcomeEmail(user: User): Promise<EmailResult>;
  sendAssessmentInvitation(user: User, assessment: any): Promise<EmailResult>;
  sendAssessmentReminder(user: User, assessment: any): Promise<EmailResult>;
  
  // Validation
  validateEmailData(data: EmailInput): ValidationResult;
} 