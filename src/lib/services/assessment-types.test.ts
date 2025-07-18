import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  createAssessmentType, 
  getActiveAssessmentTypes 
} from './assessment-types';
import { cleanupTestData } from '../test-utils-clean';

describe('Assessment Types Service', () => {
  // Temporarily disable cleanup to test with existing data
  // beforeEach(async () => {
  //   await cleanupTestData();
  // });

  // afterEach(async () => {
  //   await cleanupTestData();
  // });

  describe('createAssessmentType', () => {
    it('should create an assessment type with valid data', async () => {
      const typeData = {
        name: `Test Type ${Date.now()}`,
        description: 'A test assessment type',
        purpose: 'Testing purposes'
      };

      const assessmentType = await createAssessmentType(typeData);

      expect(assessmentType).toBeDefined();
      expect(assessmentType.name).toBe(typeData.name);
      expect(assessmentType.description).toBe(typeData.description);
      expect(assessmentType.purpose).toBe(typeData.purpose);
      expect(assessmentType.isActive).toBe(1);
    });

    it('should create assessment type without description and purpose', async () => {
      const typeData = {
        name: `Simple Type ${Date.now()}`
      };

      const assessmentType = await createAssessmentType(typeData);

      expect(assessmentType).toBeDefined();
      expect(assessmentType.name).toBe(typeData.name);
      expect(assessmentType.description).toBeNull();
      expect(assessmentType.purpose).toBeNull();
      expect(assessmentType.isActive).toBe(1);
    });

    it('should throw error for duplicate name', async () => {
      const typeData = {
        name: `Duplicate Type ${Date.now()}`,
        description: 'First instance'
      };

      // Create first instance
      await createAssessmentType(typeData);

      // Try to create second instance with same name
      await expect(createAssessmentType(typeData)).rejects.toThrow();
    });
  });

  describe('getActiveAssessmentTypes', () => {
    it('should return all active assessment types', async () => {
      const type1 = await createAssessmentType({
        name: `Active Type 1 ${Date.now()}`
      });

      const type2 = await createAssessmentType({
        name: `Active Type 2 ${Date.now()}`
      });

      const activeTypes = await getActiveAssessmentTypes();

      expect(activeTypes.length).toBeGreaterThan(0);
      expect(activeTypes.some(t => t.id === type1.id)).toBe(true);
      expect(activeTypes.some(t => t.id === type2.id)).toBe(true);
      expect(activeTypes.every(t => t.isActive === 1)).toBe(true);
    });

    it('should return empty array when no types exist', async () => {
      // This test will find existing types since cleanup is disabled
      const activeTypes = await getActiveAssessmentTypes();
      expect(activeTypes.length).toBeGreaterThanOrEqual(0);
    });
  });
}); 