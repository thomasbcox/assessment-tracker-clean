import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanup } from '../test-utils-clean';
import { createAssessmentType, getActiveAssessmentTypes } from './assessment-types';

describe('Assessment Types Service', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('createAssessmentType', () => {
    it('should create an assessment type with valid data', async () => {
      const typeData = {
        name: 'Performance Review',
        description: 'Annual performance evaluation',
        purpose: 'Employee development'
      };

      const assessmentType = await createAssessmentType(typeData);

      expect(assessmentType).toBeDefined();
      expect(assessmentType.name).toBe(typeData.name);
      expect(assessmentType.description).toBe(typeData.description);
      expect(assessmentType.purpose).toBe(typeData.purpose);
      expect(assessmentType.isActive).toBe(1);
      expect(assessmentType.id).toBeDefined();
      expect(assessmentType.createdAt).toBeDefined();
    });

    it('should create assessment type without description and purpose', async () => {
      const typeData = {
        name: 'Simple Review'
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
        name: 'Performance Review',
        description: 'Test description'
      };

      await createAssessmentType(typeData);

      await expect(createAssessmentType(typeData)).rejects.toThrow();
    });
  });

  describe('getActiveAssessmentTypes', () => {
    it('should return all active assessment types', async () => {
      await createAssessmentType({ name: 'Performance Review' });
      await createAssessmentType({ name: '360 Feedback' });
      await createAssessmentType({ name: 'Skills Assessment' });

      const types = await getActiveAssessmentTypes();

      expect(types).toHaveLength(3);
      expect(types.some(t => t.name === 'Performance Review')).toBe(true);
      expect(types.some(t => t.name === '360 Feedback')).toBe(true);
      expect(types.some(t => t.name === 'Skills Assessment')).toBe(true);
    });

    it('should return empty array when no types exist', async () => {
      const types = await getActiveAssessmentTypes();

      expect(types).toHaveLength(0);
    });
  });
}); 