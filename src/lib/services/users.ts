import { db, users, assessmentInstances, assessmentPeriods, type User } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import {
  createNotFoundError,
  createDatabaseError,
  createValidationError,
  validateRequired,
  validateEmail,
  validateUserRole,
  logServiceError
} from '@/lib/utils/error-handling';

export interface UserStats {
  total: number;
  completed: number;
  pending: number;
}

export interface UserAssessment {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  dueDate: string;
  periodName: string;
  templateId: number;
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    validateRequired(userId, 'userId');
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  } catch (error) {
    logServiceError(error as any, { userId });
    throw createDatabaseError('Failed to fetch user', { userId });
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    validateRequired(userId, 'userId');
    
    // Get all assessment instances for the user
    const instances = await db
      .select()
      .from(assessmentInstances)
      .where(eq(assessmentInstances.userId, userId));

    // Get active assessment periods
    const activePeriods = await db
      .select()
      .from(assessmentPeriods)
      .where(eq(assessmentPeriods.isActive, 1));

    // Count instances by status for active periods
    const activeInstanceIds = activePeriods.map(period => period.id);
    const activeInstances = instances.filter(instance => 
      activeInstanceIds.includes(instance.periodId)
    );

    const total = activeInstances.length;
    const completed = activeInstances.filter(instance => instance.completedAt !== null).length;
    const pending = total - completed;

    return {
      total,
      completed,
      pending,
    };
  } catch (error) {
    logServiceError(error as any, { userId });
    throw createDatabaseError('Failed to fetch user statistics', { userId });
  }
}

export async function getUserAssessments(userId: string): Promise<UserAssessment[]> {
  try {
    validateRequired(userId, 'userId');
    
    // Get assessment instances for the user with related data
    const instances = await db
      .select({
        id: assessmentInstances.id,
        userId: assessmentInstances.userId,
        periodId: assessmentInstances.periodId,
        templateId: assessmentInstances.templateId,
        status: assessmentInstances.status,
        completedAt: assessmentInstances.completedAt,
        createdAt: assessmentInstances.createdAt,
        periodName: assessmentPeriods.name,
        periodStartDate: assessmentPeriods.startDate,
        periodEndDate: assessmentPeriods.endDate,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(assessmentInstances)
      .innerJoin(assessmentPeriods, eq(assessmentInstances.periodId, assessmentPeriods.id))
      .innerJoin(users, eq(assessmentInstances.userId, users.id))
      .where(eq(assessmentInstances.userId, userId));

    // Transform the data to match the frontend expectations
    const assessments = instances.map(instance => ({
      id: instance.id.toString(),
      title: `Assessment #${instance.id}`,
      description: `Assessment for ${instance.periodName} period`,
      status: instance.status as 'draft' | 'active' | 'completed' | 'archived',
      createdAt: instance.createdAt || '',
      updatedAt: instance.completedAt || instance.createdAt || '',
      assignedTo: instance.userEmail,
      dueDate: instance.periodEndDate,
      periodName: instance.periodName,
      templateId: instance.templateId,
    }));

    return assessments;
  } catch (error) {
    logServiceError(error as any, { userId });
    throw createDatabaseError('Failed to fetch user assessments', { userId });
  }
}

export async function createUser(userData: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}): Promise<User> {
  try {
    // Validate input
    validateRequired(userData.id, 'id');
    validateRequired(userData.email, 'email');
    validateEmail(userData.email);
    validateUserRole(userData.role);
    
    const [newUser] = await db.insert(users).values({
      ...userData,
      isActive: 1,
    }).returning();

    return newUser;
  } catch (error) {
    logServiceError(error as any, { email: userData.email });
    throw createDatabaseError('Failed to create user', { email: userData.email });
  }
}

export async function updateUser(userId: string, userData: {
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: number;
}): Promise<User> {
  try {
    validateRequired(userId, 'userId');
    if (userData.role) {
      validateUserRole(userData.role);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw createNotFoundError('User', userId);
    }

    return updatedUser;
  } catch (error) {
    logServiceError(error as any, { userId });
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    throw createDatabaseError('Failed to update user', { userId });
  }
}

export async function deactivateUser(userId: string): Promise<User> {
  try {
    validateRequired(userId, 'userId');
    
    const [deactivatedUser] = await db
      .update(users)
      .set({ isActive: 0 })
      .where(eq(users.id, userId))
      .returning();

    if (!deactivatedUser) {
      throw createNotFoundError('User', userId);
    }

    return deactivatedUser;
  } catch (error) {
    logServiceError(error as any, { userId });
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    throw createDatabaseError('Failed to deactivate user', { userId });
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    validateRequired(userId, 'userId');
    
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    logServiceError(error as any, { userId });
    throw createDatabaseError('Failed to delete user', { userId });
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(users.createdAt);

    return allUsers;
  } catch (error) {
    logServiceError(error as any);
    throw createDatabaseError('Failed to fetch users');
  }
}

export function validateUserData(data: { email: string; role: string; firstName?: string; lastName?: string }): { isValid: boolean; error?: string } {
  try {
    validateRequired(data.email, 'email');
    validateEmail(data.email);
    validateUserRole(data.role);
    
    return { isValid: true };
  } catch (error) {
    if (error instanceof Error) {
      return { isValid: false, error: error.message };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
} 