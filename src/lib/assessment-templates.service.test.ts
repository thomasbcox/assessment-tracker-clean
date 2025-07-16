import { AssessmentTemplatesService, CreateTemplateData } from './assessment-templates.service';
import { db, assessmentTemplates, assessmentTypes } from '@/lib/db';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    dbError: jest.fn(),
  },
}));

describe('AssessmentTemplatesService', () => {
  let testTypeId: number;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(assessmentTemplates);
    await db.delete(assessmentTypes);

    // Create a test assessment type
    const [type] = await db.insert(assessmentTypes).values({
      name: 'Service Test Type',
      description: 'For service testing',
      purpose: 'Testing',
    }).returning();
    testTypeId = type.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(assessmentTemplates);
    await db.delete(assessmentTypes);
  });

  beforeEach(async () => {
    // Clear templates before each test
    await db.delete(assessmentTemplates);
  });

  describe('getAllTemplates', () => {
    it('should return all active templates with assessment type names', async () => {
      // Create test templates
      const testTemplates = [
        {
          assessmentTypeId: testTypeId,
          name: 'Service Test Template 1',
          version: 'v1.0',
          description: 'First service test template',
        },
        {
          assessmentTypeId: testTypeId,
          name: 'Service Test Template 2',
          version: 'v1.1',
          description: 'Second service test template',
        },
      ];

      await db.insert(assessmentTemplates).values(testTemplates);

      // Call the service
      const templates = await AssessmentTemplatesService.getAllTemplates();

      // Assertions
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(2);
      
      // Check that templates have assessment type names
      templates.forEach((template) => {
        expect(template.assessmentTypeName).toBeDefined();
        expect(template.assessmentTypeName).toBe('Service Test Type');
        expect(template.isActive).toBe(1);
      });
      
      // Check that returned templates match our test data
      const returnedNames = templates.map((template) => template.name);
      expect(returnedNames).toContain('Service Test Template 1');
      expect(returnedNames).toContain('Service Test Template 2');
    });

    it('should return empty array when no templates exist', async () => {
      const templates = await AssessmentTemplatesService.getAllTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
    });
  });

  describe('createTemplate', () => {
    it('should create a new template with valid data', async () => {
      const templateData: CreateTemplateData = {
        assessmentTypeId: testTypeId.toString(),
        name: 'New Service Template',
        version: 'v2.0',
        description: 'A new service test template',
      };

      const newTemplate = await AssessmentTemplatesService.createTemplate(templateData);

      expect(newTemplate.name).toBe(templateData.name);
      expect(newTemplate.version).toBe(templateData.version);
      expect(newTemplate.description).toBe(templateData.description);
      expect(newTemplate.assessmentTypeId).toBe(testTypeId);
      expect(newTemplate.id).toBeDefined();
      expect(newTemplate.assessmentTypeName).toBe('Service Test Type');
    });

    it('should throw error for missing required fields', async () => {
      const invalidData: CreateTemplateData = {
        name: 'Invalid Template',
        assessmentTypeId: '',
        version: '',
      };

      await expect(AssessmentTemplatesService.createTemplate(invalidData))
        .rejects.toThrow('Missing required fields');
    });

    it('should throw error for missing assessmentTypeId', async () => {
      const invalidData = {
        name: 'Missing Type Template',
        version: 'v1.0',
        description: 'Missing assessment type ID',
      } as CreateTemplateData;

      await expect(AssessmentTemplatesService.createTemplate(invalidData))
        .rejects.toThrow('Missing required fields');
    });

    it('should throw error for missing name', async () => {
      const invalidData = {
        assessmentTypeId: testTypeId.toString(),
        version: 'v1.0',
        description: 'Missing name',
      } as CreateTemplateData;

      await expect(AssessmentTemplatesService.createTemplate(invalidData))
        .rejects.toThrow('Missing required fields');
    });

    it('should throw error for missing version', async () => {
      const invalidData = {
        assessmentTypeId: testTypeId.toString(),
        name: 'Missing Version Template',
        description: 'Missing version',
      } as CreateTemplateData;

      await expect(AssessmentTemplatesService.createTemplate(invalidData))
        .rejects.toThrow('Missing required fields');
    });

    it('should throw error for invalid assessmentTypeId', async () => {
      const invalidData: CreateTemplateData = {
        assessmentTypeId: '99999', // Non-existent type ID
        name: 'Invalid Type Template',
        version: 'v1.0',
        description: 'Should fail',
      };

      await expect(AssessmentTemplatesService.createTemplate(invalidData))
        .rejects.toThrow('Invalid assessment type ID');
    });

    it('should throw error for duplicate name-version combination', async () => {
      // Create first template
      const templateData: CreateTemplateData = {
        assessmentTypeId: testTypeId.toString(),
        name: 'Duplicate Template',
        version: 'v1.0',
        description: 'First template',
      };

      await AssessmentTemplatesService.createTemplate(templateData);

      // Try to create duplicate
      const duplicateData: CreateTemplateData = {
        assessmentTypeId: testTypeId.toString(),
        name: 'Duplicate Template',
        version: 'v1.0',
        description: 'Duplicate template',
      };

      await expect(AssessmentTemplatesService.createTemplate(duplicateData))
        .rejects.toThrow('Template with this name and version already exists');
    });

    it('should allow same name with different version', async () => {
      // Create first template
      const templateData1: CreateTemplateData = {
        assessmentTypeId: testTypeId.toString(),
        name: 'Same Name Template',
        version: 'v1.0',
        description: 'First template',
      };

      await AssessmentTemplatesService.createTemplate(templateData1);

      // Create second template with same name but different version
      const templateData2: CreateTemplateData = {
        assessmentTypeId: testTypeId.toString(),
        name: 'Same Name Template',
        version: 'v2.0',
        description: 'Second template',
      };

      const secondTemplate = await AssessmentTemplatesService.createTemplate(templateData2);

      expect(secondTemplate.name).toBe(templateData2.name);
      expect(secondTemplate.version).toBe(templateData2.version);
    });
  });
}); 