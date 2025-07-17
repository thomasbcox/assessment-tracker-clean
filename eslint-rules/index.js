// Custom ESLint Rules for Assessment Tracker
// Enforces service-layer-first architecture and prevents anti-patterns

const noLogicInApiRoutes = require('./no-logic-in-api-routes');
const noFrameworkObjectsInServices = require('./no-framework-objects-in-services');
const noJsonInTests = require('./no-json-in-tests');
const validateTestInputs = require('./validate-test-inputs');
const restrictApiRouteImports = require('./restrict-api-route-imports');
const noDbMockingInServiceTests = require('./no-db-mocking-in-service-tests');

module.exports = {
  rules: {
    'no-logic-in-api-routes': noLogicInApiRoutes,
    'no-framework-objects-in-services': noFrameworkObjectsInServices,
    'no-json-in-tests': noJsonInTests,
    'validate-test-inputs': validateTestInputs,
    'restrict-api-route-imports': restrictApiRouteImports,
    'no-db-mocking-in-service-tests': noDbMockingInServiceTests
  },
  
  configs: {
    recommended: {
      rules: {
        'assessment-tracker/no-logic-in-api-routes': 'error',
        'assessment-tracker/no-framework-objects-in-services': 'error',
        'assessment-tracker/no-json-in-tests': 'warn',
        'assessment-tracker/validate-test-inputs': 'warn',
        'assessment-tracker/restrict-api-route-imports': 'error',
        'assessment-tracker/no-db-mocking-in-service-tests': 'error'
      }
    }
  }
}; 