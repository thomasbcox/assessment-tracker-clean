import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanup } from '../test-utils-clean';
import { AssessmentTemplatesService } from './assessment-templates';
import { createAssessmentType } from './assessment-types';

describe('Assessment Templates Service', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('createTemplate', () => {
    it('should create a template with valid data', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0',
        description: 'Test description'
      };

      const template = await AssessmentTemplatesService.createTemplate(templateData);

      expect(template).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.version).toBe(templateData.version);
      expect(template.description).toBe(templateData.description);
      expect(template.assessmentTypeId).toBe(assessmentType.id);
      expect(template.assessmentTypeName).toBe(assessmentType.name);
      expect(template.isActive).toBe(1);
    });

    it('should create a template without description', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      };

      const template = await AssessmentTemplatesService.createTemplate(templateData);

      expect(template).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.version).toBe(templateData.version);
      expect(template.description).toBeNull();
    });

    it('should throw error for missing required fields', async () => {
      const templateData = {
        name: 'Test Template'
        // Missing assessmentTypeId and version
      };

      await expect(AssessmentTemplatesService.createTemplate(templateData as any)).rejects.toThrow();
    });

    it('should throw error for non-existent assessment type', async () => {
      const templateData = {
        assessmentTypeId: '999',
        name: 'Test Template',
        version: '1.0'
      };

      await expect(AssessmentTemplatesService.createTemplate(templateData)).rejects.toThrow();
    });

    it('should throw error for duplicate name-version combination', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      };

      await AssessmentTemplatesService.createTemplate(templateData);

      await expect(AssessmentTemplatesService.createTemplate(templateData)).rejects.toThrow();
    });
  });

  describe('getAllTemplates', () => {
    it('should return all active templates', async () => {
      const assessmentType1 = await createAssessmentType({ name: 'Type 1' });
      const assessmentType2 = await createAssessmentType({ name: 'Type 2' });
      
      await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType1.id.toString(),
        name: 'Template 1',
        version: '1.0'
      });
      await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType2.id.toString(),
        name: 'Template 2',
        version: '1.0'
      });

      const templates = await AssessmentTemplatesService.getAllTemplates();

      expect(templates).toHaveLength(2);
      expect(templates.some(t => t.name === 'Template 1')).toBe(true);
      expect(templates.some(t => t.name === 'Template 2')).toBe(true);
    });

    it('should return empty array when no templates exist', async () => {
      const templates = await AssessmentTemplatesService.getAllTemplates();

      expect(templates).toHaveLength(0);
    });
  });

  describe('getTemplateById', () => {
    it('should return template by ID', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      };

      const createdTemplate = await AssessmentTemplatesService.createTemplate(templateData);
      const template = await AssessmentTemplatesService.getTemplateById(createdTemplate.id.toString());

      expect(template).toBeDefined();
      expect(template?.id).toBe(createdTemplate.id);
      expect(template?.name).toBe(templateData.name);
      expect(template?.assessmentTypeName).toBe(assessmentType.name);
    });

    it('should return null for non-existent template', async () => {
      const template = await AssessmentTemplatesService.getTemplateById('999');

      expect(template).toBeNull();
    });
  });

  describe('updateTemplate', () => {
    it('should update template with valid data', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Original Template',
        version: '1.0'
      };

      const createdTemplate = await AssessmentTemplatesService.createTemplate(templateData);

      const updateData = {
        name: 'Updated Template',
        version: '2.0',
        description: 'Updated description'
      };

      const updatedTemplate = await AssessmentTemplatesService.updateTemplate(createdTemplate.id.toString(), updateData);

      expect(updatedTemplate.name).toBe(updateData.name);
      expect(updatedTemplate.version).toBe(updateData.version);
      expect(updatedTemplate.description).toBe(updateData.description);
    });

    it('should throw error for non-existent template', async () => {
      await expect(AssessmentTemplatesService.updateTemplate('999', { name: 'Test' })).rejects.toThrow();
    });

    it('should throw error for invalid assessment type ID', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      };

      const createdTemplate = await AssessmentTemplatesService.createTemplate(templateData);

      await expect(AssessmentTemplatesService.updateTemplate(createdTemplate.id.toString(), { assessmentTypeId: '999' })).rejects.toThrow();
    });
  });

  describe('deactivateTemplate', () => {
    it('should deactivate template', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templateData = {
        assessmentTypeId: assessmentType.id.toString(),
        name: 'Test Template',
        version: '1.0'
      };

      const createdTemplate = await AssessmentTemplatesService.createTemplate(templateData);
      const deactivatedTemplate = await AssessmentTemplatesService.deactivateTemplate(createdTemplate.id.toString());

      expect(deactivatedTemplate.isActive).toBe(0);
    });

    it('should throw error for non-existent template', async () => {
      await expect(AssessmentTemplatesService.deactivateTemplate('999')).rejects.toThrow();
    });
  });

  describe('getTemplatesByType', () => {
    it('should return templates for specific assessment type', async () => {
      const assessmentType1 = await createAssessmentType({ name: 'Type 1' });
      const assessmentType2 = await createAssessmentType({ name: 'Type 2' });
      
      await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType1.id.toString(),
        name: 'Template 1',
        version: '1.0'
      });
      await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType1.id.toString(),
        name: 'Template 2',
        version: '2.0'
      });
      await AssessmentTemplatesService.createTemplate({
        assessmentTypeId: assessmentType2.id.toString(),
        name: 'Template 3',
        version: '1.0'
      });

      const templates = await AssessmentTemplatesService.getTemplatesByType(assessmentType1.id.toString());

      expect(templates).toHaveLength(2);
      expect(templates.every(t => t.assessmentTypeId === assessmentType1.id)).toBe(true);
      expect(templates.some(t => t.name === 'Template 1')).toBe(true);
      expect(templates.some(t => t.name === 'Template 2')).toBe(true);
    });

    it('should return empty array when no templates exist for type', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const templates = await AssessmentTemplatesService.getTemplatesByType(assessmentType.id.toString());

      expect(templates).toHaveLength(0);
    });
  });
}); 