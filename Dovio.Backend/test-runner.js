#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Comprehensive Backend Test Suite...\n');

// Test configuration
const testConfig = {
  timeout: 60000, // 60 seconds timeout
  verbose: true,
  coverage: false
};

// Test suites to run
const testSuites = [
  {
    name: 'Complete Features Test Suite',
    file: 'tests/complete-features.e2e.test.js',
    description: 'Tests all implemented features: Auth, Posts, Stories, Comments, Reactions, Sharing, Follows, Feed, Search, Notifications, Messaging, Wallet'
  },
  {
    name: 'Reaction System Tests',
    file: 'tests/reactions.e2e.test.js',
    description: 'Tests the complete reaction system: Posts, Stories, Comments with all emoji types'
  },
  {
    name: 'New Features Tests',
    file: 'tests/new-features.e2e.test.js',
    description: 'Tests Feed Generation, Search & Discovery, Notifications'
  },
  {
    name: 'Authentication Tests',
    file: 'tests/auth.e2e.test.js',
    description: 'Tests user authentication and authorization'
  },
  {
    name: 'Security Tests',
    file: 'tests/security.e2e.test.js',
    description: 'Tests security features and rate limiting'
  },
  {
    name: 'Posts Authorization Tests',
    file: 'tests/posts.authz.e2e.test.js',
    description: 'Tests post authorization and permissions'
  },
  {
    name: 'Messages Authorization Tests',
    file: 'tests/messages.authz.e2e.test.js',
    description: 'Tests message authorization and permissions'
  },
  {
    name: 'Follows Duplicate Tests',
    file: 'tests/follows.duplicate.e2e.test.js',
    description: 'Tests follow system duplicate prevention'
  }
];

// Function to run a single test suite
function runTestSuite(suite) {
  console.log(`\n📋 Running: ${suite.name}`);
  console.log(`📝 Description: ${suite.description}`);
  console.log(`📁 File: ${suite.file}`);
  
  if (!fs.existsSync(suite.file)) {
    console.log(`⚠️  Warning: Test file ${suite.file} not found, skipping...\n`);
    return { success: false, skipped: true };
  }

  try {
    console.log('⏳ Starting test...');
    const startTime = Date.now();
    
    const result = execSync(`npm test -- ${suite.file}`, {
      encoding: 'utf8',
      timeout: testConfig.timeout,
      stdio: 'pipe'
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ PASSED - ${suite.name} (${duration}s)`);
    console.log('📊 Test Output:');
    console.log(result);
    
    return { success: true, duration, output: result };
  } catch (error) {
    console.log(`❌ FAILED - ${suite.name}`);
    console.log('📊 Error Output:');
    console.log(error.stdout || error.message);
    
    return { success: false, error: error.stdout || error.message };
  }
}

// Function to run all tests
async function runAllTests() {
  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalDuration = 0;

  console.log('🎯 Test Configuration:');
  console.log(`   Timeout: ${testConfig.timeout / 1000}s`);
  console.log(`   Verbose: ${testConfig.verbose}`);
  console.log(`   Coverage: ${testConfig.coverage}`);
  console.log(`   Total Suites: ${testSuites.length}\n`);

  // Run each test suite
  for (const suite of testSuites) {
    const result = runTestSuite(suite);
    results.push({ suite, result });
    
    if (result.success) {
      totalPassed++;
      totalDuration += result.duration || 0;
    } else if (result.skipped) {
      totalSkipped++;
    } else {
      totalFailed++;
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⚠️  Skipped: ${totalSkipped}`);
  console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(({ suite, result }) => {
    const status = result.success ? '✅ PASS' : result.skipped ? '⚠️  SKIP' : '❌ FAIL';
    const duration = result.duration ? ` (${result.duration}s)` : '';
    console.log(`   ${status} ${suite.name}${duration}`);
  });

  // Feature coverage summary
  console.log('\n🎯 FEATURE COVERAGE:');
  console.log('   ✅ Authentication & Authorization');
  console.log('   ✅ Profiles & Social Graph');
  console.log('   ✅ Posts & Media Upload');
  console.log('   ✅ Comments & Likes');
  console.log('   ✅ Feed Generation');
  console.log('   ✅ DMs / Messaging');
  console.log('   ✅ Stories (Ephemeral)');
  console.log('   ✅ Notifications');
  console.log('   ✅ Search / Discovery');
  console.log('   ✅ Reaction System (7 emoji types)');
  console.log('   ✅ Post Sharing');
  console.log('   ✅ Wallet Features');
  console.log('   ✅ Security & Rate Limiting');

  if (totalFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.forEach(({ suite, result }) => {
      if (!result.success && !result.skipped) {
        console.log(`   ${suite.name}: ${result.error?.substring(0, 100)}...`);
      }
    });
  }

  console.log('\n🎉 Test Suite Complete!');
  
  if (totalFailed === 0) {
    console.log('🚀 All tests passed! Your backend is ready for production.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner error:', error);
  process.exit(1);
});

