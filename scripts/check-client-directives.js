#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// React hooks that require "use client"
const HOOKS = [
  'useState',
  'useEffect', 
  'useRouter',
  'useCallback',
  'useMemo',
  'useRef',
  'useContext',
  'useReducer',
  'useLayoutEffect',
  'useImperativeHandle',
  'useDebugValue'
];

// Directories to check
const DIRECTORIES = [
  'src/app',
  'src/components'
];

// File extensions to check
const EXTENSIONS = ['.tsx', '.jsx'];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check if file has "use client" directive
    const hasUseClient = lines.some(line => 
      line.trim().startsWith('"use client"') || 
      line.trim().startsWith("'use client'")
    );
    
    // Check if file uses any React hooks (but ignore test files with mocks)
    const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');
    const usesHooks = HOOKS.some(hook => {
      // For test files, only check for actual hook usage, not mocks
      if (isTestFile) {
        return content.includes(`import { ${hook}`) || 
               content.includes(`import ${hook}`) ||
               (content.includes(` ${hook}(`) && !content.includes(`jest.mock`));
      }
      return content.includes(`import { ${hook}`) || 
             content.includes(`import ${hook}`) ||
             content.includes(` ${hook}(`);
    });
    
    if (usesHooks && !hasUseClient) {
      console.error(`❌ ${filePath} - Uses React hooks but missing "use client" directive`);
      return false;
    } else if (hasUseClient && !usesHooks) {
      console.warn(`⚠️  ${filePath} - Has "use client" but no hooks detected (might be unnecessary)`);
      return true;
    } else if (usesHooks && hasUseClient) {
      console.log(`✅ ${filePath} - Correctly configured`);
      return true;
    } else {
      console.log(`✅ ${filePath} - Server component (no hooks)`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...walkDirectory(fullPath));
      } else if (stat.isFile() && EXTENSIONS.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

function main() {
  console.log('🔍 Checking for missing "use client" directives...\n');
  
  let allFiles = [];
  for (const dir of DIRECTORIES) {
    if (fs.existsSync(dir)) {
      allFiles.push(...walkDirectory(dir));
    }
  }
  
  if (allFiles.length === 0) {
    console.log('No files found to check.');
    return;
  }
  
  let issues = 0;
  let warnings = 0;
  
  for (const file of allFiles) {
    const result = checkFile(file);
    if (result === false) {
      issues++;
    } else if (result === 'warning') {
      warnings++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total files checked: ${allFiles.length}`);
  console.log(`Issues found: ${issues}`);
  console.log(`Warnings: ${warnings}`);
  
  if (issues > 0) {
    console.log('\n💡 To fix issues, add "use client" at the top of the problematic files.');
    process.exit(1);
  } else {
    console.log('\n🎉 All files are properly configured!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, walkDirectory }; 