// Standardized Error Handling for Assessment Tracker
// Follows industry best practices for error handling in service layers

import { ServiceError } from '../types/service-interfaces';

// ============================================================================
// ERROR CODES
// ============================================================================

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Database Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Generic Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HttpStatusCodes = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

export function createValidationError(message: string, field?: string, details?: any): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.VALIDATION_ERROR,
    HttpStatusCodes.BAD_REQUEST,
    { field, details }
  );
}

export function createNotFoundError(resource: string, id?: string | number): ServiceError {
  const message = id 
    ? `${resource} with id ${id} not found`
    : `${resource} not found`;
  
  return new ServiceError(
    message,
    ErrorCodes.RESOURCE_NOT_FOUND,
    HttpStatusCodes.NOT_FOUND,
    { resource, id }
  );
}

export function createConflictError(message: string, details?: any): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.RESOURCE_CONFLICT,
    HttpStatusCodes.CONFLICT,
    details
  );
}

export function createUnauthorizedError(message: string = 'Unauthorized'): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.UNAUTHORIZED,
    HttpStatusCodes.UNAUTHORIZED
  );
}

export function createForbiddenError(message: string = 'Forbidden'): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.FORBIDDEN,
    HttpStatusCodes.FORBIDDEN
  );
}

export function createDatabaseError(message: string, details?: any): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.DATABASE_ERROR,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    details
  );
}

export function createBusinessRuleError(message: string, details?: any): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.BUSINESS_RULE_VIOLATION,
    HttpStatusCodes.UNPROCESSABLE_ENTITY,
    details
  );
}

export function createRateLimitError(message: string = 'Rate limit exceeded'): ServiceError {
  return new ServiceError(
    message,
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    HttpStatusCodes.TOO_MANY_REQUESTS
  );
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function isServiceError(error: any): error is ServiceError {
  return error instanceof ServiceError;
}

export function handleServiceError(error: any): ServiceError {
  if (isServiceError(error)) {
    return error;
  }
  
  // Convert unknown errors to ServiceError
  if (error instanceof Error) {
    return new ServiceError(
      error.message,
      ErrorCodes.UNKNOWN_ERROR,
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      { originalError: error.name }
    );
  }
  
  // Handle non-Error objects
  return new ServiceError(
    String(error),
    ErrorCodes.UNKNOWN_ERROR,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    { originalError: typeof error }
  );
}

export function getErrorResponse(error: ServiceError) {
  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details })
    }
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  validateRequired(email, fieldName);
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError(`Invalid email format for ${fieldName}`, fieldName);
  }
}

export function validateStringLength(value: string, fieldName: string, minLength: number, maxLength?: number): void {
  validateRequired(value, fieldName);
  
  if (value.length < minLength) {
    throw createValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
  }
  
  if (maxLength && value.length > maxLength) {
    throw createValidationError(`${fieldName} must be no more than ${maxLength} characters`, fieldName);
  }
}

export function validateEnum(value: any, fieldName: string, allowedValues: readonly string[]): void {
  validateRequired(value, fieldName);
  
  if (!allowedValues.includes(value)) {
    throw createValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName,
      { allowedValues, receivedValue: value }
    );
  }
}

export function validateNumberRange(value: number, fieldName: string, min?: number, max?: number): void {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'number' || isNaN(value)) {
    throw createValidationError(`${fieldName} must be a valid number`, fieldName);
  }
  
  if (min !== undefined && value < min) {
    throw createValidationError(`${fieldName} must be at least ${min}`, fieldName);
  }
  
  if (max !== undefined && value > max) {
    throw createValidationError(`${fieldName} must be no more than ${max}`, fieldName);
  }
}

// ============================================================================
// BUSINESS RULE VALIDATORS
// ============================================================================

export function validateUserRole(role: string): void {
  const allowedRoles = ['super_admin', 'admin', 'manager', 'user'] as const;
  validateEnum(role, 'role', allowedRoles);
}

export function validateAssessmentStatus(status: string): void {
  const allowedStatuses = ['pending', 'in_progress', 'completed', 'archived'] as const;
  validateEnum(status, 'status', allowedStatuses);
}

export function validateQuestionType(questionType: string): void {
  const allowedTypes = ['multiple_choice', 'text', 'rating', 'boolean'] as const;
  validateEnum(questionType, 'questionType', allowedTypes);
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

export function logServiceError(error: ServiceError, context?: any): void {
  const logData = {
    code: error.code,
    statusCode: error.statusCode,
    message: error.message,
    details: error.details,
    context
  };
  
  // Use appropriate log level based on status code
  if (error.statusCode >= 500) {
    console.error('Service Error (5xx):', logData);
  } else if (error.statusCode >= 400) {
    console.warn('Service Error (4xx):', logData);
  } else {
    console.info('Service Error:', logData);
  }
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export function createSuccessResponse<T>(data: T, statusCode: number = HttpStatusCodes.OK) {
  return {
    success: true,
    data,
    statusCode
  };
}

export function createErrorResponse(error: ServiceError) {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details })
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ErrorCodes,
  HttpStatusCodes,
  createValidationError,
  createNotFoundError,
  createConflictError,
  createUnauthorizedError,
  createForbiddenError,
  createDatabaseError,
  createBusinessRuleError,
  createRateLimitError,
  isServiceError,
  handleServiceError,
  getErrorResponse,
  validateRequired,
  validateEmail,
  validateStringLength,
  validateEnum,
  validateNumberRange,
  validateUserRole,
  validateAssessmentStatus,
  validateQuestionType,
  logServiceError,
  createSuccessResponse,
  createErrorResponse
}; 