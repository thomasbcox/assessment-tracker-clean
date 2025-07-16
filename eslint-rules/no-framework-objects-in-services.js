/**
 * @fileoverview Prevents services from accepting framework objects
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
      description: "Services should accept plain data objects, not framework objects",
      category: "Architecture",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      frameworkObjectInService: "Service function '{{functionName}}' accepts framework object '{{objectType}}'. Services should accept plain data types only.",
      frameworkObjectInServiceParameter: "Parameter '{{paramName}}' in service function '{{functionName}}' has framework type '{{objectType}}'. Use plain data types instead."
    }
  },

  create(context) {
    const filename = context.getFilename();
    const isServiceFile = filename.includes('.service.ts') || 
                         filename.includes('/services/') ||
                         filename.includes('@/lib/services/');
    
    if (!isServiceFile) {
      return {};
    }

    const frameworkTypes = [
      'Request', 'NextRequest', 'Response', 'NextResponse',
      'IncomingMessage', 'ServerResponse'
    ];

    return {
      FunctionDeclaration(node) {
        checkFunctionParameters(node, node.id?.name || 'anonymous');
      },

      FunctionExpression(node) {
        if (node.parent && node.parent.type === 'VariableDeclarator') {
          checkFunctionParameters(node, node.parent.id.name);
        }
      },

      ArrowFunctionExpression(node) {
        if (node.parent && node.parent.type === 'VariableDeclarator') {
          checkFunctionParameters(node, node.parent.id.name);
        }
      },

      MethodDefinition(node) {
        checkFunctionParameters(node.value, node.key.name);
      }
    };

    function checkFunctionParameters(node, functionName) {
      if (!node.params || node.params.length === 0) {
        return;
      }

      node.params.forEach(param => {
        if (param.type === 'Identifier') {
          // Check if parameter has a type annotation
          const paramName = param.name;
          
          // Look for type annotations in the AST
          const typeAnnotation = findTypeAnnotation(param);
          if (typeAnnotation) {
            const typeName = extractTypeName(typeAnnotation);
            if (frameworkTypes.includes(typeName)) {
              context.report({
                node: param,
                messageId: 'frameworkObjectInServiceParameter',
                data: {
                  paramName,
                  functionName,
                  objectType: typeName
                }
              });
            }
          }
        }
      });
    }

    function findTypeAnnotation(node) {
      // Look for TypeScript type annotations
      if (node.typeAnnotation) {
        return node.typeAnnotation;
      }
      
      // Look for JSDoc type annotations
      const comments = context.getSourceCode().getCommentsBefore(node);
      for (const comment of comments) {
        if (comment.type === 'Block' && comment.value.includes('@param')) {
          const paramMatch = comment.value.match(/@param\s+\{([^}]+)\}\s+\w+/);
          if (paramMatch) {
            return paramMatch[1];
          }
        }
      }
      
      return null;
    }

    function extractTypeName(typeAnnotation) {
      if (typeof typeAnnotation === 'string') {
        return typeAnnotation.trim();
      }
      
      if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
        return typeAnnotation.typeName.name;
      }
      
      if (typeAnnotation.type === 'TSUnionType') {
        // Check if any of the union types are framework types
        return typeAnnotation.types.map(t => extractTypeName(t)).join(' | ');
      }
      
      return '';
    }
  }
}; 