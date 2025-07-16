#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Assessment Tracker Test Suite\n');

const testFiles = [
  'src/lib/auth.test.ts',
  'src/lib/db.test.ts',
  'src/lib/session.test.ts',
  'src/lib/utils.test.ts',
  'src/lib/logger.test.ts',
  'src/components/ui/button.test.tsx',
  'src/components/ui/input.test.tsx',
  'src/components/ui/card.test.tsx',
  'src/components/ui/error-boundary.test.tsx',
  'src/components/forms/login-form.test.tsx',
  'src/app/api/assessment-types/route.test.ts',
  'src/app/api/assessment-categories/route.test.ts',
  'src/app/api/assessment-templates/route.test.ts',
  'src/app/api/assessment-questions/route.test.ts',
  'src/app/api/assessment-periods/route.test.ts',
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('📋 Test Files to Run:');
testFiles.forEach(file => {
  console.log(`  - ${file}`);
});
console.log('');

// Run each test file
testFiles.forEach((testFile, index) => {
  console.log(`\n${index + 1}/${testFiles.length} Running: ${testFile}`);
  console.log('─'.repeat(50));
  
  try {
    const result = execSync(`npx jest ${testFile} --verbose --no-coverage`, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log(result);
    
    // Count tests from output
    const testMatch = result.match(/(\d+) tests? passed/);
    if (testMatch) {
      const testCount = parseInt(testMatch[1]);
      totalTests += testCount;
      passedTests += testCount;
    }
    
  } catch (error) {
    console.log(error.stdout || error.message);
    
    // Count failed tests from output
    const failMatch = error.stdout?.match(/(\d+) tests? failed/);
    if (failMatch) {
      failedTests += parseInt(failMatch[1]);
    }
    
    // Count passed tests from output
    const passMatch = error.stdout?.match(/(\d+) tests? passed/);
    if (passMatch) {
      const testCount = parseInt(passMatch[1]);
      totalTests += testCount;
      passedTests += testCount;
    }
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the output above.');
  process.exit(1);
} 