/**
 * ESLint rule to enforce clean test patterns
 * Discourages complex test data builders and encourages simple factory functions
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce clean test patterns using simple factory functions',
      category: 'Testing',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      avoidComplexBuilder: 'Avoid complex test data builders. Use simple factory functions instead.',
      preferSimpleFactory: 'Prefer simple factory functions over complex builders.',
      avoidSharedState: 'Avoid shared state in test utilities. Each function should be stateless.',
      preferComposition: 'Prefer composition over inheritance for test utilities.',
    },
  },

  create(context) {
    return {
      // Discourage complex builder classes
      ClassDeclaration(node) {
        if (node.id && node.id.name && 
            (node.id.name.includes('Builder') || node.id.name.includes('TestData'))) {
          context.report({
            node,
            messageId: 'avoidComplexBuilder',
          });
        }
      },

      // Discourage complex builder instantiation
      NewExpression(node) {
        if (node.callee.name && 
            (node.callee.name.includes('Builder') || node.callee.name.includes('TestData'))) {
          context.report({
            node,
            messageId: 'avoidComplexBuilder',
          });
        }
      },

      // Encourage simple factory functions
      VariableDeclaration(node) {
        if (node.kind === 'const' && node.declarations.length === 1) {
          const declaration = node.declarations[0];
          if (declaration.id.name && 
              (declaration.id.name.startsWith('create') || declaration.id.name.startsWith('make'))) {
            // This is good - simple factory function
            return;
          }
        }
      },

      // Discourage shared state in test utilities
      MemberExpression(node) {
        if (node.object.name === 'this' && 
            (node.property.name === 'result' || node.property.name === 'data')) {
          context.report({
            node,
            messageId: 'avoidSharedState',
          });
        }
      },

      // Discourage inheritance in test utilities
      ClassDeclaration(node) {
        if (node.superClass && 
            (node.superClass.name === 'BaseBuilder' || node.superClass.name.includes('Builder'))) {
          context.report({
            node,
            messageId: 'preferComposition',
          });
        }
      },
    };
  },
}; 