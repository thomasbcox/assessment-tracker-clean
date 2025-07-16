/**
 * @fileoverview Validates test inputs against TypeScript interfaces
 * @author Assessment Tracker Team
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when test inputs don't match imported TypeScript interfaces",
      category: "Testing",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      inlineObjectInTest: "Consider using a typed variable instead of inline object literal for test input. Import and use types like '{{suggestedType}}'.",
      missingTypeImport: "Test input should use imported types. Consider importing '{{suggestedType}}' from service interfaces."
    }
  },

  create(context) {
    const filename = context.getFilename();
    const isTestFile = filename.includes('.test.') || filename.includes('.spec.');
    
    if (!isTestFile) {
      return {};
    }

    // Common service input types to suggest
    const serviceInputTypes = [
      'CreateUserInput', 'UpdateUserInput',
      'CreateTemplateInput', 'UpdateTemplateInput',
      'CreateInstanceInput', 'UpdateInstanceInput',
      'CreateResponseInput', 'UpdateResponseInput',
      'CreatePeriodInput', 'UpdatePeriodInput',
      'CreateCategoryInput', 'UpdateCategoryInput',
      'CreateQuestionInput', 'UpdateQuestionInput'
    ];

    return {
      CallExpression(node) {
        // Check if this is a service function call
        if (isServiceFunctionCall(node)) {
          // Check arguments for inline object literals
          node.arguments.forEach((arg, index) => {
            if (arg.type === 'ObjectExpression') {
              suggestTypedInput(arg, node, index);
            }
          });
        }
      }
    };

    function isServiceFunctionCall(node) {
      const functionName = getFunctionName(node);
      
      // Check if it's a service function
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

    function suggestTypedInput(objectNode, callNode, argIndex) {
      const functionName = getFunctionName(callNode);
      
      // Try to infer the expected type based on function name
      const suggestedType = inferInputType(functionName, argIndex);
      
      if (suggestedType) {
        context.report({
          node: objectNode,
          messageId: 'inlineObjectInTest',
          data: { suggestedType }
        });
      } else {
        context.report({
          node: objectNode,
          messageId: 'missingTypeImport',
          data: { suggestedType: 'appropriate input type' }
        });
      }
    }

    function inferInputType(functionName, argIndex) {
      // Map function names to expected input types
      const typeMap = {
        'createUser': 'CreateUserInput',
        'updateUser': 'UpdateUserInput',
        'createTemplate': 'CreateTemplateInput',
        'updateTemplate': 'UpdateTemplateInput',
        'createInstance': 'CreateInstanceInput',
        'updateInstance': 'UpdateInstanceInput',
        'createResponse': 'CreateResponseInput',
        'updateResponse': 'UpdateResponseInput',
        'createPeriod': 'CreatePeriodInput',
        'updatePeriod': 'UpdatePeriodInput',
        'createCategory': 'CreateCategoryInput',
        'updateCategory': 'UpdateCategoryInput',
        'createQuestion': 'CreateQuestionInput',
        'updateQuestion': 'UpdateQuestionInput'
      };

      // Extract the function name without the service prefix
      const cleanFunctionName = functionName.replace(/^.*\./, '');
      return typeMap[cleanFunctionName] || null;
    }
  }
}; 