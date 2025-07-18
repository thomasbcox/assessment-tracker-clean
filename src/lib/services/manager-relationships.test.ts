import { ManagerRelationshipsService } from './manager-relationships';
import { createTestUser, createTestAssessmentPeriod, createCompleteManagerRelationship, cleanupTestData, getOrCreateTestUser, getOrCreateTestAssessmentPeriod } from '../test-utils-clean';

describe('ManagerRelationshipsService', () => {
  // Temporarily disable cleanup to test with existing data
  // beforeEach(async () => {
  //   await cleanupTestData();
  // });

  // afterEach(async () => {
  //   await cleanupTestData();
  // });

  describe('createRelationship', () => {
    it('should create a manager relationship with valid data', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      const relationship = await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      expect(relationship).toBeDefined();
      expect(relationship.managerId).toBe(manager.id);
      expect(relationship.subordinateId).toBe(subordinate.id);
      expect(relationship.periodId).toBe(period.id);
    });

    it('should throw error for non-existent manager', async () => {
      const subordinate = await getOrCreateTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-2@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      await expect(ManagerRelationshipsService.createRelationship({
        managerId: 'non-existent-manager',
        subordinateId: subordinate.id,
        periodId: period.id
      })).rejects.toThrow();
    });

    it('should throw error for non-existent subordinate', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-2@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      await expect(ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: 'non-existent-subordinate',
        periodId: period.id
      })).rejects.toThrow();
    });

    it('should throw error for non-existent period', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-3@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-3@example.com`
      });

      await expect(ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: 999
      })).rejects.toThrow();
    });

    it('should throw error for self-relationship', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-4@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      await expect(ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: manager.id,
        periodId: period.id
      })).rejects.toThrow();
    });

    it('should throw error for duplicate relationship', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-5@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-5@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      // Create first relationship
      await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      // Try to create duplicate
      await expect(ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      })).rejects.toThrow();
    });
  });

  describe('getRelationshipById', () => {
    it('should return relationship by ID', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-6@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-6@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      const relationship = await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      const foundRelationship = await ManagerRelationshipsService.getRelationshipById(relationship.id);

      expect(foundRelationship).toBeDefined();
      expect(foundRelationship).not.toBeNull();
      if (foundRelationship) {
        expect(foundRelationship.id).toBe(relationship.id);
      }
    });

    it('should return null for non-existent ID', async () => {
      const relationship = await ManagerRelationshipsService.getRelationshipById(999);
      expect(relationship).toBeNull();
    });
  });

  describe('getSubordinatesByManager', () => {
    it('should return subordinates for a manager', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-7@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-7@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      const subordinates = await ManagerRelationshipsService.getSubordinatesByManager(manager.id, period.id);

      expect(subordinates.length).toBeGreaterThan(0);
      expect(subordinates.some(sub => sub.subordinateId === subordinate.id)).toBe(true);
    });

    it('should return empty array for manager with no subordinates', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-8@example.com`
      });

      const subordinates = await ManagerRelationshipsService.getSubordinatesByManager(manager.id);
      expect(subordinates).toHaveLength(0);
    });
  });

  describe('getManagerBySubordinate', () => {
    it('should return manager for a subordinate', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-9@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-9@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      const foundManager = await ManagerRelationshipsService.getManagerBySubordinate(subordinate.id, period.id);

      expect(foundManager).toBeDefined();
      expect(foundManager).not.toBeNull();
      if (foundManager) {
        expect(foundManager.managerId).toBe(manager.id);
      }
    });

    it('should return null for subordinate with no manager', async () => {
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-10@example.com`
      });

      const manager = await ManagerRelationshipsService.getManagerBySubordinate(subordinate.id);
      expect(manager).toBeNull();
    });
  });

  describe('updateRelationship', () => {
    it('should update an existing relationship', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-11@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-11@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      const relationship = await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      const updatedRelationship = await ManagerRelationshipsService.updateRelationship(relationship.id, {
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      expect(updatedRelationship).toBeDefined();
      expect(updatedRelationship.id).toBe(relationship.id);
    });

    it('should throw error for non-existent relationship', async () => {
      await expect(ManagerRelationshipsService.updateRelationship(999, {
        managerId: 'manager-id',
        subordinateId: 'subordinate-id',
        periodId: 1
      })).rejects.toThrow();
    });
  });

  describe('deleteRelationship', () => {
    it('should delete an existing relationship', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-12@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-12@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      const relationship = await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      await ManagerRelationshipsService.deleteRelationship(relationship.id);

      const foundRelationship = await ManagerRelationshipsService.getRelationshipById(relationship.id);
      expect(foundRelationship).toBeNull();
    });

    it('should not throw error for non-existent relationship', async () => {
      await expect(ManagerRelationshipsService.deleteRelationship(999)).resolves.not.toThrow();
    });
  });

  describe('getRelationshipsByPeriod', () => {
    it('should return relationships for a specific period', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-13@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-13@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      const relationship = await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      const relationships = await ManagerRelationshipsService.getRelationshipsByPeriod(period.id);

      expect(relationships.length).toBeGreaterThan(0);
      expect(relationships.some(rel => rel.id === relationship.id)).toBe(true);
    });

    it('should return empty array for period with no relationships', async () => {
      // Create a new period that won't have any relationships
      const period = await createTestAssessmentPeriod();

      const relationships = await ManagerRelationshipsService.getRelationshipsByPeriod(period.id);
      expect(relationships).toHaveLength(0);
    });
  });

  describe('getRelationshipHierarchy', () => {
    it('should return manager and subordinates for a user', async () => {
      const manager = await createTestUser({ 
        role: 'manager',
        email: `manager-${Date.now()}-14@example.com`
      });
      const subordinate = await createTestUser({ 
        role: 'user',
        email: `subordinate-${Date.now()}-14@example.com`
      });
      const period = await getOrCreateTestAssessmentPeriod();

      await ManagerRelationshipsService.createRelationship({
        managerId: manager.id,
        subordinateId: subordinate.id,
        periodId: period.id
      });

      const hierarchy = await ManagerRelationshipsService.getRelationshipHierarchy(manager.id, period.id);

      expect(hierarchy).toBeDefined();
      expect(hierarchy.manager).toBeDefined();
      expect(hierarchy.subordinates.length).toBeGreaterThan(0);
      expect(hierarchy.subordinates.some(sub => sub.subordinateId === subordinate.id)).toBe(true);
    });
  });
}); 