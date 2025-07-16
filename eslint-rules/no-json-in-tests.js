/**
 * @fileoverview Prevents .json() usage in test files
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
      description: "Prevent .json() usage in test files to avoid confusion with service responses",
      category: "Testing",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noJsonInTests: "Avoid using .json() in test files. Test service functions directly with plain data objects instead of mocking HTTP responses.",
      jsonInManualMock: "Consider using plain objects instead of .json() even in manual mocks for consistency."
    }
  },

  create(context) {
    const filename = context.getFilename();
    const isTestFile = filename.includes('.test.') || filename.includes('.spec.');
    
    if (!isTestFile) {
      return {};
    }

    return {
      MemberExpression(node) {
        if (node.property && node.property.name === 'json') {
          // Check if this is part of a manual mock (jest.mock, jest.fn, etc.)
          const isManualMock = isPartOfManualMock(node);
          
          if (isManualMock) {
            context.report({
              node,
              messageId: 'jsonInManualMock'
            });
          } else {
            context.report({
              node,
              messageId: 'noJsonInTests'
            });
          }
        }
      }
    };

    function isPartOfManualMock(node) {
      let current = node;
      
      // Walk up the AST to find if this is part of a mock
      while (current.parent) {
        if (current.parent.type === 'CallExpression') {
          const callee = current.parent.callee;
          
          // Check for jest.mock, jest.fn, mockImplementation, etc.
          if (callee.type === 'MemberExpression') {
            const objectName = callee.object.name;
            const propertyName = callee.property.name;
            
            if (objectName === 'jest' && 
                ['mock', 'fn', 'spyOn'].includes(propertyName)) {
              return true;
            }
            
            if (propertyName === 'mockImplementation' || 
                propertyName === 'mockReturnValue' ||
                propertyName === 'mockResolvedValue') {
              return true;
            }
          }
        }
        
        current = current.parent;
      }
      
      return false;
    }
  }
}; 