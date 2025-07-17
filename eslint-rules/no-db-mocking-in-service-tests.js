/**
 * @fileoverview Forbids mocking the database or ORM in service layer test files
 * @author Assessment Tracker Team
 */

'use strict';

const DB_MODULES = [
  '@/lib/db',
  'drizzle-orm',
  'better-sqlite3',
  'sqlite3',
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid jest.mock or similar mocking of the database or ORM in service layer test files',
      category: 'Testing',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noDbMocking: 'Do not mock the database or ORM in service layer tests. Use a real in-memory SQLite database and the test data builder.'
    }
  },

  create(context) {
    const filename = context.getFilename();
    const isServiceTest =
      filename.includes('/src/lib/services/') &&
      (filename.endsWith('.test.ts') || filename.endsWith('.test.js') || filename.endsWith('.spec.ts') || filename.endsWith('.spec.js'));

    if (!isServiceTest) {
      return {};
    }

    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'jest' &&
          node.callee.property.name === 'mock' &&
          node.arguments &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal' &&
          DB_MODULES.includes(node.arguments[0].value)
        ) {
          context.report({
            node,
            messageId: 'noDbMocking'
          });
        }
      }
    };
  }
}; 