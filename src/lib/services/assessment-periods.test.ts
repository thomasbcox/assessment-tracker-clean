import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestAssessmentPeriod, createMultipleAssessmentPeriods, cleanup } from '../test-utils-clean';
import * as assessmentPeriodService from './assessment-periods';
import { db } from '../db';
import { assessmentPeriods } from '../db';

describe('AssessmentPeriodService', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('createAssessmentPeriod', () => {
    it('should create an assessment period with valid data', async () => {
      const periodData = {
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1
      };

      const period = await assessmentPeriodService.createAssessmentPeriod(periodData);

      expect(period.name).toBe(periodData.name);
      expect(period.startDate).toBe(periodData.startDate);
      expect(period.endDate).toBe(periodData.endDate);
      expect(period.isActive).toBe(periodData.isActive);
      expect(period.id).toBeDefined();
      expect(period.createdAt).toBeDefined();
      expect(period.updatedAt).toBeDefined();
    });

    it('should create inactive assessment period', async () => {
      const periodData = {
        name: 'Q2 2024',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isActive: 0
      };

      const period = await assessmentPeriodService.createAssessmentPeriod(periodData);

      expect(period.isActive).toBe(0);
    });

    it('should throw error for duplicate name', async () => {
      const periodData = {
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1
      };

      await assessmentPeriodService.createAssessmentPeriod(periodData);

      await expect(assessmentPeriodService.createAssessmentPeriod(periodData)).rejects.toThrow();
    });

    it('should throw error for invalid date format', async () => {
      const periodData = {
        name: 'Invalid Period',
        startDate: 'invalid-date',
        endDate: '2024-03-31',
        isActive: 1
      };

      await expect(assessmentPeriodService.createAssessmentPeriod(periodData)).rejects.toThrow();
    });

    it('should throw error when end date is before start date', async () => {
      const periodData = {
        name: 'Invalid Period',
        startDate: '2024-03-31',
        endDate: '2024-01-01',
        isActive: 1
      };

      await expect(assessmentPeriodService.createAssessmentPeriod(periodData)).rejects.toThrow();
    });
  });

  describe('getAssessmentPeriodById', () => {
    it('should return assessment period by ID', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

      const period = await assessmentPeriodService.getAssessmentPeriodById(createdPeriod.id);

      expect(period).toBeDefined();
      expect(period?.id).toBe(createdPeriod.id);
      expect(period?.name).toBe('Q1 2024');
      expect(period?.startDate).toBe('2024-01-01');
      expect(period?.endDate).toBe('2024-03-31');
    });

    it('should return null for non-existent ID', async () => {
      const period = await assessmentPeriodService.getAssessmentPeriodById(999);

      expect(period).toBeNull();
    });
  });

  describe('getAllAssessmentPeriods', () => {
    it('should return all assessment periods ordered by start date', async () => {
      await createMultipleAssessmentPeriods([
        { name: 'Q2 2024', startDate: '2024-04-01', endDate: '2024-06-30' },
        { name: 'Q1 2024', startDate: '2024-01-01', endDate: '2024-03-31' },
        { name: 'Q3 2024', startDate: '2024-07-01', endDate: '2024-09-30' }
      ]);

      const periods = await assessmentPeriodService.getAllAssessmentPeriods();

      expect(periods).toHaveLength(3);
      expect(periods[0].name).toBe('Q1 2024');
      expect(periods[1].name).toBe('Q2 2024');
      expect(periods[2].name).toBe('Q3 2024');
    });

    it('should return empty array when no periods exist', async () => {
      const periods = await assessmentPeriodService.getAllAssessmentPeriods();

      expect(periods).toHaveLength(0);
    });
  });

  describe('updateAssessmentPeriod', () => {
    it('should update assessment period data', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

      const updateData = {
        name: 'Updated Q1 2024',
        endDate: '2024-04-30'
      };

      const updatedPeriod = await assessmentPeriodService.updateAssessmentPeriod(createdPeriod.id, updateData);

      expect(updatedPeriod.name).toBe('Updated Q1 2024');
      expect(updatedPeriod.endDate).toBe('2024-04-30');
      expect(updatedPeriod.startDate).toBe('2024-01-01'); // Should not change
      expect(updatedPeriod.id).toBe(createdPeriod.id);
    });

    it('should update isActive status', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        isActive: 1
      });

      const updatedPeriod = await assessmentPeriodService.updateAssessmentPeriod(createdPeriod.id, {
        isActive: 0
      });

      expect(updatedPeriod.isActive).toBe(0);
    });

    it('should throw error for non-existent ID', async () => {
      await expect(assessmentPeriodService.updateAssessmentPeriod(999, { name: 'Test' })).rejects.toThrow();
    });

    it('should throw error for duplicate name', async () => {
      await createTestAssessmentPeriod({ name: 'Period 1' });
      const period2 = await createTestAssessmentPeriod({ name: 'Period 2' });

      await expect(assessmentPeriodService.updateAssessmentPeriod(period2.id, { name: 'Period 1' })).rejects.toThrow();
    });
  });

  describe('deleteAssessmentPeriod', () => {
    it('should delete assessment period', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024'
      });

      await assessmentPeriodService.deleteAssessmentPeriod(createdPeriod.id);

      const period = await assessmentPeriodService.getAssessmentPeriodById(createdPeriod.id);
      expect(period).toBeNull();
    });

    it('should throw error for non-existent ID', async () => {
      await expect(assessmentPeriodService.deleteAssessmentPeriod(999)).rejects.toThrow();
    });
  });

  describe('getActiveAssessmentPeriods', () => {
    it('should return only active assessment periods', async () => {
      await createMultipleAssessmentPeriods([
        { name: 'Active Period 1', isActive: 1 },
        { name: 'Active Period 2', isActive: 1 },
        { name: 'Inactive Period', isActive: 0 }
      ]);

      const activePeriods = await assessmentPeriodService.getActiveAssessmentPeriods();

      expect(activePeriods).toHaveLength(2);
      expect(activePeriods.every(period => period.isActive === 1)).toBe(true);
      expect(activePeriods.some(period => period.name === 'Active Period 1')).toBe(true);
      expect(activePeriods.some(period => period.name === 'Active Period 2')).toBe(true);
      expect(activePeriods.some(period => period.name === 'Inactive Period')).toBe(false);
    });

    it('should return empty array when no active periods exist', async () => {
      await createTestAssessmentPeriod({ name: 'Inactive Period', isActive: 0 });

      const activePeriods = await assessmentPeriodService.getActiveAssessmentPeriods();

      expect(activePeriods).toHaveLength(0);
    });
  });

  describe('getCurrentAssessmentPeriod', () => {
    it('should return current assessment period', async () => {
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      await createTestAssessmentPeriod({
        name: 'Current Period',
        startDate,
        endDate,
        isActive: 1
      });

      const currentPeriod = await assessmentPeriodService.getCurrentAssessmentPeriod();

      expect(currentPeriod).toBeDefined();
      expect(currentPeriod?.name).toBe('Current Period');
    });

    it('should return null when no current period exists', async () => {
      await createTestAssessmentPeriod({
        name: 'Past Period',
        startDate: '2020-01-01',
        endDate: '2020-03-31',
        isActive: 1
      });

      const currentPeriod = await assessmentPeriodService.getCurrentAssessmentPeriod();

      expect(currentPeriod).toBeNull();
    });
  });

  describe('getAssessmentPeriodByName', () => {
    it('should return assessment period by name', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

      const period = await assessmentPeriodService.getAssessmentPeriodByName('Q1 2024');

      expect(period).toBeDefined();
      expect(period?.id).toBe(createdPeriod.id);
      expect(period?.name).toBe('Q1 2024');
    });

    it('should return null for non-existent name', async () => {
      const period = await assessmentPeriodService.getAssessmentPeriodByName('Non-existent Period');

      expect(period).toBeNull();
    });
  });
}); 