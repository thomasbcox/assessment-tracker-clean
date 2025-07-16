/**
 * @fileoverview Restricts imports in API routes to enforce service layer pattern
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
      description: "Restrict imports in API routes to only allow next/server, services, and types",
      category: "Architecture",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      forbiddenImport: "Import from '{{importPath}}' is not allowed in API routes. Only import from 'next/server', local services, or types.",
      forbiddenDatabaseImport: "Direct database imports are not allowed in API routes. Use service layer instead.",
      forbiddenUtilityImport: "Utility imports are not allowed in API routes. Use service layer instead."
    }
  },

  create(context) {
    const filename = context.getFilename();
    const isApiRoute = filename.includes('/api/') && filename.endsWith('route.ts');
    
    if (!isApiRoute) {
      return {};
    }

    const allowedImports = [
      'next/server',
      'next/headers',
      'next/cookies'
    ];

    const forbiddenPatterns = [
      /^@\/lib\/db/,           // Database imports
      /^@\/lib\/utils/,        // Utility imports
      /^@\/lib\/auth/,         // Direct auth imports (should use service)
      /^@\/lib\/mailer/,       // Direct mailer imports (should use service)
      /^drizzle-orm/,          // Direct ORM imports
      /^sqlite3/,              // Direct database imports
      /^bcrypt/,               // Direct crypto imports
      /^nodemailer/            // Direct email imports
    ];

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        
        // Check if it's a forbidden import
        if (isForbiddenImport(importPath)) {
          context.report({
            node,
            messageId: 'forbiddenImport',
            data: { importPath }
          });
        }
        
        // Check for forbidden patterns
        if (matchesForbiddenPattern(importPath)) {
          const messageId = getForbiddenMessageId(importPath);
          context.report({
            node,
            messageId,
            data: { importPath }
          });
        }
      }
    };

    function isForbiddenImport(importPath) {
      // Allow next/server imports
      if (allowedImports.includes(importPath)) {
        return false;
      }
      
      // Allow service imports
      if (importPath.includes('/services/') || 
          importPath.includes('.service') ||
          importPath.includes('@/lib/services/')) {
        return false;
      }
      
      // Allow type imports
      if (importPath.includes('/types/') || 
          importPath.includes('@/lib/types/')) {
        return false;
      }
      
      // Allow relative imports (for local types, etc.)
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        return false;
      }
      
      // Forbid everything else
      return true;
    }

    function matchesForbiddenPattern(importPath) {
      return forbiddenPatterns.some(pattern => pattern.test(importPath));
    }

    function getForbiddenMessageId(importPath) {
      if (importPath.includes('/db') || importPath.includes('drizzle-orm') || importPath.includes('sqlite3')) {
        return 'forbiddenDatabaseImport';
      }
      
      if (importPath.includes('/utils') || importPath.includes('/auth') || importPath.includes('/mailer')) {
        return 'forbiddenUtilityImport';
      }
      
      return 'forbiddenImport';
    }
  }
}; 