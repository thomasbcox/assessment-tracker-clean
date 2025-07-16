// Mock database for Layer 1 testing (unit tests)
export const db = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  where: jest.fn(),
  eq: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
  get: jest.fn(),
};

// Mock table schemas
export const users = { name: 'users' };
export const assessmentTypes = { name: 'assessment_types' };
export const assessmentCategories = { name: 'assessment_categories' };
export const assessmentTemplates = { name: 'assessment_templates' };
export const assessmentQuestions = { name: 'assessment_questions' };
export const assessmentPeriods = { name: 'assessment_periods' };
export const magicLinks = { name: 'magic_links' };
export const managerRelationships = { name: 'manager_relationships' };
export const assessmentInstances = { name: 'assessment_instances' };
export const assessmentResponses = { name: 'assessment_responses' };

// Mock Drizzle ORM functions
export const eq = jest.fn();
export const asc = jest.fn();
export const desc = jest.fn();
export const and = jest.fn();
export const or = jest.fn();
export const count = jest.fn();
export const sum = jest.fn();
export const avg = jest.fn();

// Reset all mocks
export function resetDatabaseMocks() {
  jest.clearAllMocks();
  Object.values(db).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
  [eq, asc, desc, and, or, count, sum, avg].forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
} 