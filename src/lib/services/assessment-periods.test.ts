import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestAssessmentPeriod, cleanup } from '../test-utils-clean';
import { AssessmentPeriodsService } from './assessment-periods';
import { db } from '../db';
import { assessmentPeriods } from '../db';

describe('AssessmentPeriodService', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('createPeriod', () => {
    it('should create an assessment period with valid data', async () => {
      const periodData = {
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1
      };

      const period = await AssessmentPeriodsService.createPeriod(periodData);

      expect(period.name).toBe(periodData.name);
      expect(period.startDate).toBe(periodData.startDate);
      expect(period.endDate).toBe(periodData.endDate);
      expect(period.isActive).toBe(periodData.isActive);
      expect(period.id).toBeDefined();
      expect(period.createdAt).toBeDefined();
    });

    it('should create inactive assessment period', async () => {
      const periodData = {
        name: 'Q2 2024',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isActive: 0
      };

      const period = await AssessmentPeriodsService.createPeriod(periodData);

      expect(period.isActive).toBe(0);
    });

    it('should throw error for duplicate name', async () => {
      const periodData = {
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 1
      };

      await AssessmentPeriodsService.createPeriod(periodData);

      await expect(AssessmentPeriodsService.createPeriod(periodData)).rejects.toThrow();
    });

    it('should throw error for invalid date format', async () => {
      const periodData = {
        name: 'Invalid Period',
        startDate: 'invalid-date',
        endDate: '2024-03-31',
        isActive: 1
      };

      await expect(AssessmentPeriodsService.createPeriod(periodData)).rejects.toThrow();
    });

    it('should throw error when end date is before start date', async () => {
      const periodData = {
        name: 'Invalid Period',
        startDate: '2024-03-31',
        endDate: '2024-01-01',
        isActive: 1
      };

      await expect(AssessmentPeriodsService.createPeriod(periodData)).rejects.toThrow();
    });
  });

  describe('getPeriodById', () => {
    it('should return assessment period by ID', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

      const period = await AssessmentPeriodsService.getPeriodById(createdPeriod.id);

      expect(period).toBeDefined();
      expect(period?.id).toBe(createdPeriod.id);
      expect(period?.name).toBe('Q1 2024');
      expect(period?.startDate).toBe('2024-01-01');
      expect(period?.endDate).toBe('2024-03-31');
    });

    it('should return null for non-existent ID', async () => {
      const period = await AssessmentPeriodsService.getPeriodById(999);

      expect(period).toBeNull();
    });
  });

  describe('getAllPeriods', () => {
    it('should return all assessment periods ordered by start date', async () => {
      await AssessmentPeriodsService.createPeriod({ name: 'Q2 2024', startDate: '2024-04-01', endDate: '2024-06-30' });
      await AssessmentPeriodsService.createPeriod({ name: 'Q1 2024', startDate: '2024-01-01', endDate: '2024-03-31' });
      await AssessmentPeriodsService.createPeriod({ name: 'Q3 2024', startDate: '2024-07-01', endDate: '2024-09-30' });

      const periods = await AssessmentPeriodsService.getAllPeriods();

      expect(periods).toHaveLength(3);
      expect(periods[0].name).toBe('Q1 2024');
      expect(periods[1].name).toBe('Q2 2024');
      expect(periods[2].name).toBe('Q3 2024');
    });

    it('should return empty array when no periods exist', async () => {
      const periods = await AssessmentPeriodsService.getAllPeriods();

      expect(periods).toHaveLength(0);
    });
  });

  describe('updatePeriod', () => {
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

      const updatedPeriod = await AssessmentPeriodsService.updatePeriod(createdPeriod.id, updateData);

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

      const updatedPeriod = await AssessmentPeriodsService.updatePeriod(createdPeriod.id, {
        isActive: 0
      });

      expect(updatedPeriod.isActive).toBe(0);
    });

    it('should throw error for non-existent ID', async () => {
      await expect(AssessmentPeriodsService.updatePeriod(999, { name: 'Test' })).rejects.toThrow();
    });

    it('should throw error for duplicate name', async () => {
      await createTestAssessmentPeriod({ name: 'Period 1' });
      const period2 = await createTestAssessmentPeriod({ name: 'Period 2' });

      await expect(AssessmentPeriodsService.updatePeriod(period2.id, { name: 'Period 1' })).rejects.toThrow();
    });
  });

  describe('deletePeriod', () => {
    it('should delete assessment period', async () => {
      const createdPeriod = await createTestAssessmentPeriod({
        name: 'Q1 2024'
      });

      await AssessmentPeriodsService.deletePeriod(createdPeriod.id);

      const period = await AssessmentPeriodsService.getPeriodById(createdPeriod.id);
      expect(period).toBeNull();
    });

    it('should throw error for non-existent ID', async () => {
      await expect(AssessmentPeriodsService.deletePeriod(999)).rejects.toThrow();
    });
  });

  describe('getActivePeriod', () => {
    it('should return only active assessment period', async () => {
      await AssessmentPeriodsService.createPeriod({ name: 'Active Period 1', startDate: '2024-01-01', endDate: '2024-03-31', isActive: 1 });
      await AssessmentPeriodsService.createPeriod({ name: 'Inactive Period', startDate: '2024-04-01', endDate: '2024-06-30', isActive: 0 });

      const activePeriod = await AssessmentPeriodsService.getActivePeriod();

      expect(activePeriod).toBeDefined();
      expect(activePeriod?.name).toBe('Active Period 1');
      expect(activePeriod?.isActive).toBe(1);
    });

    it('should return null when no active period exists', async () => {
      await AssessmentPeriodsService.createPeriod({ name: 'Inactive Period', startDate: '2024-01-01', endDate: '2024-03-31', isActive: 0 });

      const activePeriod = await AssessmentPeriodsService.getActivePeriod();

      expect(activePeriod).toBeNull();
    });
  });

  describe('setActivePeriod', () => {
    it('should set a period as active and deactivate others', async () => {
      const period1 = await AssessmentPeriodsService.createPeriod({ name: 'Period 1', startDate: '2024-01-01', endDate: '2024-03-31', isActive: 1 });
      const period2 = await AssessmentPeriodsService.createPeriod({ name: 'Period 2', startDate: '2024-04-01', endDate: '2024-06-30', isActive: 0 });

      const activatedPeriod = await AssessmentPeriodsService.setActivePeriod(period2.id);

      expect(activatedPeriod.id).toBe(period2.id);
      expect(activatedPeriod.isActive).toBe(1);

      // Check that period1 is now inactive
      const updatedPeriod1 = await AssessmentPeriodsService.getPeriodById(period1.id);
      expect(updatedPeriod1?.isActive).toBe(0);
    });
  });
}); 