/**
 * @fileoverview Prevents business logic in API routes
 * @author Assessment Tracker Team
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent business logic in API routes - enforce service layer pattern",
      category: "Architecture",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noLogicInApiRoutes: "API routes should only parse requests and call service functions. Move business logic to the service layer.",
      tooManyServiceCalls: "API routes should make at most one service call. Consider combining operations in the service layer.",
      forbiddenFunctionCall: "Function call '{{functionName}}' is not allowed in API routes. Use service layer instead."
    }
  },

  create(context) {
    const filename = context.getFilename();
    const isApiRoute = filename.includes('/api/') && filename.endsWith('route.ts');
    
    if (!isApiRoute) {
      return {};
    }

    let serviceCallCount = 0;
    const allowedFunctions = [
      'json', 'text', 'formData', 'url', 'headers', 'cookies',
      'NextResponse.json', 'NextResponse.redirect', 'NextResponse.rewrite'
    ];

    return {
      CallExpression(node) {
        const functionName = getFunctionName(node);
        
        // Count service calls (functions from lib/services or lib/*.service)
        if (isServiceCall(node)) {
          serviceCallCount++;
          if (serviceCallCount > 1) {
            context.report({
              node,
              messageId: 'tooManyServiceCalls'
            });
          }
        }
        
        // Check for forbidden function calls
        if (!isAllowedFunction(functionName) && !isServiceCall(node)) {
          context.report({
            node,
            messageId: 'forbiddenFunctionCall',
            data: { functionName }
          });
        }
      },

      'Program:exit'() {
        if (serviceCallCount === 0) {
          context.report({
            loc: { line: 1, column: 1 },
            messageId: 'noLogicInApiRoutes'
          });
        }
      }
    };

    function getFunctionName(node) {
      if (node.callee.type === 'Identifier') {
        return node.callee.name;
      }
      if (node.callee.type === 'MemberExpression') {
        const object = node.callee.object.name || '';
        const property = node.callee.property.name || '';
        return `${object}.${property}`;
      }
      return '';
    }

    function isServiceCall(node) {
      const functionName = getFunctionName(node);
      
      // Check if it's a service function call
      if (functionName.includes('Service.') || functionName.includes('service.')) {
        return true;
      }
      
      // Check for common service function patterns
      const servicePatterns = [
        'getUserById', 'createUser', 'updateUser', 'deleteUser',
        'getTemplateById', 'createTemplate', 'updateTemplate', 'deleteTemplate',
        'getInstanceById', 'createInstance', 'updateInstance', 'deleteInstance',
        'getResponseById', 'createResponse', 'updateResponse', 'deleteResponse',
        'getPeriodById', 'createPeriod', 'updatePeriod', 'deletePeriod',
        'getCategoryById', 'createCategory', 'updateCategory', 'deleteCategory',
        'getQuestionById', 'createQuestion', 'updateQuestion', 'deleteQuestion'
      ];
      
      return servicePatterns.some(pattern => functionName.includes(pattern));
    }

    function isAllowedFunction(functionName) {
      return allowedFunctions.includes(functionName);
    }
  }
}; 