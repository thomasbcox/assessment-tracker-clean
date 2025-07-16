import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AssessmentTemplatesService, CreateTemplateData, TemplateWithTypeName } from '../assessment-templates.service';
import { db, assessmentTemplates, assessmentTypes } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/logger');

const mockDb = db as jest.Mocked<typeof db>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AssessmentTemplatesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a new template successfully', async () => {
      const templateData: CreateTemplateData = {
        assessmentTypeId: '1',
        name: 'Test Template',
        version: '1.0',
        description: 'A test template'
      };

      const mockTemplate: TemplateWithTypeName = {
        id: 1,
        assessmentTypeId: 1,
        assessmentTypeName: 'Leadership Assessment',
        name: 'Test Template',
        version: '1.0',
        description: 'A test template',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      };

      // Mock assessment type check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Leadership Assessment' }])
          })
        })
      } as any);

      // Mock duplicate check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1 }])
        })
      } as any);

      // Mock final select with join
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTemplate])
            })
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.createTemplate(templateData);

      expect(result).toEqual(mockTemplate);
      expect(mockDb.insert).toHaveBeenCalledWith(assessmentTemplates);
    });

    it('should throw error for duplicate name-version combination', async () => {
      const templateData: CreateTemplateData = {
        assessmentTypeId: '1',
        name: 'Existing Template',
        version: '1.0',
        description: 'A test template'
      };

      // Mock assessment type check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Leadership Assessment' }])
          })
        })
      } as any);

      // Mock duplicate check - return existing template
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Existing Template', version: '1.0' }])
          })
        })
      } as any);

      await expect(AssessmentTemplatesService.createTemplate(templateData))
        .rejects.toThrow('Template with this name and version already exists');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(AssessmentTemplatesService.createTemplate({
        assessmentTypeId: '1',
        name: 'Test',
        version: '1.0'
      })).rejects.toThrow('Database error');
      expect(mockLogger.dbError).toHaveBeenCalledWith('create assessment template', error);
    });
  });

  describe('getTemplateById', () => {
    it('should return template when found', async () => {
      const mockTemplate: TemplateWithTypeName = {
        id: 1,
        assessmentTypeId: 1,
        assessmentTypeName: 'Leadership Assessment',
        name: 'Test Template',
        version: '1.0',
        description: 'A test template',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTemplate])
            })
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.getTemplateById('1');

      expect(result).toEqual(mockTemplate);
    });

    it('should return null when template not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.getTemplateById('999');

      expect(result).toBeNull();
    });
  });

  describe('getAllTemplates', () => {
    it('should return all active templates', async () => {
      const mockTemplates: TemplateWithTypeName[] = [
        {
          id: 1,
          assessmentTypeId: 1,
          assessmentTypeName: 'Leadership Assessment',
          name: 'Template 1',
          version: '1.0',
          description: 'First template',
          isActive: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: null
        },
        {
          id: 2,
          assessmentTypeId: 2,
          assessmentTypeName: 'Team Assessment',
          name: 'Template 2',
          version: '1.0',
          description: 'Second template',
          isActive: 1,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: null
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockTemplates)
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.getAllTemplates();

      expect(result).toEqual(mockTemplates);
    });
  });

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      const updateData = {
        name: 'Updated Template',
        version: '2.0'
      };

      const mockTemplate: TemplateWithTypeName = {
        id: 1,
        assessmentTypeId: 1,
        assessmentTypeName: 'Leadership Assessment',
        name: 'Updated Template',
        version: '2.0',
        description: 'A test template',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      // Mock getTemplateById to return existing template
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTemplate])
            })
          })
        })
      } as any);

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockTemplate])
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.updateTemplate('1', updateData);

      expect(result).toEqual(mockTemplate);
    });

    it('should throw error when template not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      await expect(AssessmentTemplatesService.updateTemplate('999', { name: 'Updated' }))
        .rejects.toThrow('Template not found');
    });
  });

  describe('deactivateTemplate', () => {
    it('should deactivate template successfully', async () => {
      const mockTemplate: TemplateWithTypeName = {
        id: 1,
        assessmentTypeId: 1,
        assessmentTypeName: 'Leadership Assessment',
        name: 'Test Template',
        version: '1.0',
        description: 'A test template',
        isActive: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockTemplate])
          })
        })
      } as any);

      // Mock getTemplateById for return value
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTemplate])
            })
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.deactivateTemplate('1');

      expect(result).toEqual(mockTemplate);
      expect(result.isActive).toBe(0);
    });
  });

  describe('getTemplatesByType', () => {
    it('should return templates for specific type', async () => {
      const mockTemplates: TemplateWithTypeName[] = [
        {
          id: 1,
          assessmentTypeId: 1,
          assessmentTypeName: 'Leadership Assessment',
          name: 'Leadership Template',
          version: '1.0',
          description: 'Template for leadership',
          isActive: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: null
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockTemplates)
          })
        })
      } as any);

      const result = await AssessmentTemplatesService.getTemplatesByType('1');

      expect(result).toEqual(mockTemplates);
    });
  });
}); 