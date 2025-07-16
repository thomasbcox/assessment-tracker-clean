import { testDb, transactionDb, testData } from './test-utils';
import { db, users, assessmentTypes } from './db';

describe('Test Utilities', () => {
  describe('Layer 2: In-Memory SQLite', () => {
    it('should create and cleanup test database', async () => {
      const database = testDb.getDatabase();
      expect(database).toBeDefined();
      
      // Test that cleanup works
      await testDb.cleanup();
      
      // Verify tables are empty
      const allUsers = await database.select().from(users);
      expect(allUsers).toHaveLength(0);
    });

    it('should create test data with unique identifiers', () => {
      const user1 = testData.createUser();
      const user2 = testData.createUser();
      
      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).not.toBe(user2.email);
    });

    it('should allow data overrides', () => {
      const customUser = testData.createUser({
        email: 'custom@example.com',
        role: 'admin'
      });
      
      expect(customUser.email).toBe('custom@example.com');
      expect(customUser.role).toBe('admin');
      expect(customUser.firstName).toBe('Test'); // Default value
    });
  });

  describe('Layer 3: Transaction-Based Testing', () => {
    it('should rollback transactions automatically', async () => {
      const result = await transactionDb.withTransaction(async (db) => {
        // Create a user within transaction
        const user = testData.createUser();
        await db.insert(users).values(user);
        
        // Verify user exists within transaction
        const userList = await db.select().from(users);
        expect(userList).toHaveLength(1);
        
        return 'success';
      });
      
      expect(result).toBe('success');
      
      // Verify user was rolled back (doesn't exist outside transaction)
      const allUsers = await db.select().from(users);
      expect(allUsers).toHaveLength(0);
    });

    it('should handle transaction errors', async () => {
      await expect(
        transactionDb.withTransaction(async (db) => {
          // Create a user
          const user = testData.createUser();
          await db.insert(users).values(user);
          
          // Throw an error
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      // Verify no data persisted after error
      const allUsers = await db.select().from(users);
      expect(allUsers).toHaveLength(0);
    });
  });

  describe('Test Data Factory', () => {
    it('should create assessment types', () => {
      const assessmentType = testData.createAssessmentType({
        name: 'Custom Type',
        purpose: 'Custom Purpose'
      });
      
      expect(assessmentType.name).toBe('Custom Type');
      expect(assessmentType.purpose).toBe('Custom Purpose');
      expect(assessmentType.isActive).toBe(1);
    });

    it('should create assessment categories', () => {
      const category = testData.createAssessmentCategory({
        name: 'Custom Category',
        displayOrder: 5
      });
      
      expect(category.name).toBe('Custom Category');
      expect(category.displayOrder).toBe(5);
      expect(category.assessmentTypeId).toBe(1); // Default value
    });

    it('should create magic links', () => {
      const magicLink = testData.createMagicLink({
        email: 'test@example.com',
        token: 'custom-token'
      });
      
      expect(magicLink.email).toBe('test@example.com');
      expect(magicLink.token).toBe('custom-token');
      expect(magicLink.isUsed).toBe(0);
    });
  });
}); 