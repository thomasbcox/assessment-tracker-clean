module.exports = {
  meta: { type: 'problem' },
  create(context) {
    const filename = context.getFilename();
    // Only apply to test files
    if (!/\.test\.(t|j)sx?$/.test(filename)) return {};
    return {
      CallExpression(node) {
        // jest.spyOn(console, ...)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'jest' &&
          node.callee.property.name === 'spyOn' &&
          node.arguments[0] &&
          node.arguments[0].name === 'console'
        ) {
          context.report({ node, message: 'Do not mock console methods in logger tests. Use output capture and assertion instead.' });
        }
        // jest.mock('./logger') or jest.mock('console')
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'jest' &&
          node.callee.property.name === 'mock' &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal' &&
          (node.arguments[0].value === './logger' || node.arguments[0].value === 'console')
        ) {
          context.report({ node, message: 'Do not mock the logger or console in tests. Use output capture and assertion instead.' });
        }
      }
    };
  }
}; 