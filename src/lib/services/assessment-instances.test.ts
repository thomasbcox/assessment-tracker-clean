import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
// import { cleanup } from '../test-utils-clean';
import { AssessmentInstancesService } from './assessment-instances';
import { getActiveAssessmentTypes } from './assessment-types';
import { AssessmentCategoriesService } from './assessment-categories';
import { AssessmentTemplatesService } from './assessment-templates';
import { AssessmentPeriodsService } from './assessment-periods';
import { getAllUsers, createUser } from './users';

// Helper function to create unique email
const createUniqueEmail = (baseEmail: string = 'test@example.com') => {
  const timestamp = Date.now();
  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}-${timestamp}@${domain}`;
};

// Helper function to get or create a unique assessment type
const getOrCreateAssessmentType = async (baseName: string = 'Test Type') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${baseName} ${timestamp}-${random}`;
  
  // Always create a new type to avoid conflicts
  const { createAssessmentType } = await import('./assessment-types');
  return await createAssessmentType({ name: uniqueName });
};

// Helper function to get or create a unique category
const getOrCreateCategory = async (assessmentTypeId: number, baseName: string = 'Test Category') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${baseName} ${timestamp}-${random}`;
  
  // Always create a new category to avoid conflicts
  return await AssessmentCategoriesService.createCategory({
    assessmentTypeId,
    name: uniqueName,
    displayOrder: 1
  });
};

// Helper function to get or create a unique template
const getOrCreateTemplate = async (assessmentTypeId: number, baseName: string = 'Test Template') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${baseName} ${timestamp}-${random}`;
  const uniqueVersion = `1.${timestamp}.${random}`;
  
  // Always create a new template to avoid conflicts
  return await AssessmentTemplatesService.createTemplate({
    assessmentTypeId: assessmentTypeId.toString(),
    name: uniqueName,
    version: uniqueVersion
  });
};

// Helper function to get or create a unique period
const getOrCreatePeriod = async (baseName: string = 'Test Period') => {
  // Try to get existing periods first
  const existingPeriods = await AssessmentPeriodsService.getAllPeriods();
  if (existingPeriods.length > 0) {
    return existingPeriods[0]; // Use the first available period
  }
  
  // If no periods exist, we'll need to create one with a very distant future date
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${baseName} ${timestamp}-${random}`;
  
  return await AssessmentPeriodsService.createPeriod({
    name: uniqueName,
    startDate: '2300-01-01',
    endDate: '2300-12-31'
  });
};

// Helper function to get or create a unique user
const getOrCreateUser = async (baseEmail: string = 'test@example.com') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueEmail = `${baseEmail.split('@')[0]}-${timestamp}-${random}@${baseEmail.split('@')[1]}`;
  
  // Always create a new user to avoid conflicts
  return await createUser({
    id: `user-${timestamp}-${random}`,
    email: uniqueEmail,
    firstName: 'Test',
    lastName: 'User',
    role: 'manager'
  });
};

describe('AssessmentInstancesService', () => {
  // Temporarily disable cleanup to avoid foreign key constraint issues
  // beforeEach(async () => {
  //   await cleanup();
  // });

  // afterEach(async () => {
  //   await cleanup();
  // });

  describe('createInstance', () => {
    it('should create an instance with valid data', async () => {
      const user = await getOrCreateUser('user1@example.com');
      const period = await getOrCreatePeriod('Period 1');
      const assessmentType = await getOrCreateAssessmentType('Type 1');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 1');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      const instance = await AssessmentInstancesService.createInstance(instanceData);

      expect(instance).toBeDefined();
      expect(instance.userId).toBe(instanceData.userId);
      expect(instance.periodId).toBe(instanceData.periodId);
      expect(instance.templateId).toBe(instanceData.templateId);
      expect(instance.status).toBe(instanceData.status);
    });

    it('should throw error for non-existent user', async () => {
      const period = await getOrCreatePeriod('Period 2');
      const assessmentType = await getOrCreateAssessmentType('Type 2');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 2');

      const instanceData = {
        userId: 'non-existent-user',
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      await expect(AssessmentInstancesService.createInstance(instanceData)).rejects.toThrow();
    });

    it('should throw error for non-existent period', async () => {
      const user = await getOrCreateUser('user2@example.com');
      const assessmentType = await getOrCreateAssessmentType('Type 3');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 3');

      const instanceData = {
        userId: user.id,
        periodId: 999999,
        templateId: template.id,
        status: 'pending' as const
      };

      await expect(AssessmentInstancesService.createInstance(instanceData)).rejects.toThrow();
    });

    it('should throw error for non-existent template', async () => {
      const user = await getOrCreateUser('user3@example.com');
      const period = await getOrCreatePeriod('Period 3');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: 999999,
        status: 'pending' as const
      };

      await expect(AssessmentInstancesService.createInstance(instanceData)).rejects.toThrow();
    });

    it('should throw error for duplicate instance', async () => {
      const user = await getOrCreateUser('user4@example.com');
      const period = await getOrCreatePeriod('Period 4');
      const assessmentType = await getOrCreateAssessmentType('Type 4');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 4');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      // Create first instance
      await AssessmentInstancesService.createInstance(instanceData);

      // Try to create duplicate instance
      await expect(AssessmentInstancesService.createInstance(instanceData)).rejects.toThrow();
    });
  });

  describe('getInstanceById', () => {
    it('should return instance by ID', async () => {
      const user = await getOrCreateUser('user5@example.com');
      const period = await getOrCreatePeriod('Period 5');
      const assessmentType = await getOrCreateAssessmentType('Type 5');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 5');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      const createdInstance = await AssessmentInstancesService.createInstance(instanceData);
      const instance = await AssessmentInstancesService.getInstanceById(createdInstance.id);

      expect(instance).toBeDefined();
      expect(instance?.id).toBe(createdInstance.id);
      expect(instance?.userId).toBe(instanceData.userId);
    });

    it('should return null for non-existent ID', async () => {
      const instance = await AssessmentInstancesService.getInstanceById(999999);
      expect(instance).toBeNull();
    });
  });

  describe('getInstancesByUser', () => {
    it('should return instances for a user', async () => {
      const user = await getOrCreateUser('user6@example.com');
      const period = await getOrCreatePeriod('Period 6');
      const assessmentType = await getOrCreateAssessmentType('Type 6');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 6');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      await AssessmentInstancesService.createInstance(instanceData);

      const instances = await AssessmentInstancesService.getInstancesByUser(user.id);

      expect(instances.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for user with no instances', async () => {
      // Create a new user that definitely has no instances
      const newUser = await createUser({
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        email: createUniqueEmail('newuser@example.com'),
        firstName: 'New',
        lastName: 'User',
        role: 'manager'
      });

      const instances = await AssessmentInstancesService.getInstancesByUser(newUser.id);
      expect(instances).toHaveLength(0);
    });
  });

  describe('updateInstanceStatus', () => {
    it('should update an existing instance status', async () => {
      const user = await getOrCreateUser('user7@example.com');
      const period = await getOrCreatePeriod('Period 7');
      const assessmentType = await getOrCreateAssessmentType('Type 7');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 7');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      const createdInstance = await AssessmentInstancesService.createInstance(instanceData);
      const updatedInstance = await AssessmentInstancesService.updateInstanceStatus(createdInstance.id, 'completed');

      expect(updatedInstance.status).toBe('completed');
    });

    it('should update status with completedAt', async () => {
      const user = await getOrCreateUser('user8@example.com');
      const period = await getOrCreatePeriod('Period 8');
      const assessmentType = await getOrCreateAssessmentType('Type 8');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 8');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      const createdInstance = await AssessmentInstancesService.createInstance(instanceData);
      const updatedInstance = await AssessmentInstancesService.updateInstanceStatus(createdInstance.id, 'completed');

      expect(updatedInstance.completedAt).toBeDefined();
    });

    it('should throw error for non-existent instance', async () => {
      await expect(AssessmentInstancesService.updateInstanceStatus(999999, 'completed')).rejects.toThrow();
    });
  });

  describe('deleteInstance', () => {
    it('should delete an existing instance', async () => {
      const user = await getOrCreateUser('user9@example.com');
      const period = await getOrCreatePeriod('Period 9');
      const assessmentType = await getOrCreateAssessmentType('Type 9');
      const template = await getOrCreateTemplate(assessmentType.id, 'Template 9');

      const instanceData = {
        userId: user.id,
        periodId: period.id,
        templateId: template.id,
        status: 'pending' as const
      };

      const createdInstance = await AssessmentInstancesService.createInstance(instanceData);
      await AssessmentInstancesService.deleteInstance(createdInstance.id);

      const instance = await AssessmentInstancesService.getInstanceById(createdInstance.id);
      expect(instance).toBeNull();
    });

    it('should not throw error for non-existent instance', async () => {
      await expect(AssessmentInstancesService.deleteInstance(999999)).resolves.toBeUndefined();
    });
  });
}); 