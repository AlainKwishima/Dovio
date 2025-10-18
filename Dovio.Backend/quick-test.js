#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Quick Backend Test Verification\n');

try {
  console.log('📋 Running basic test suite...');
  const result = execSync('npm test', { 
    encoding: 'utf8', 
    stdio: 'inherit',
    timeout: 30000 
  });
  
  console.log('\n✅ Basic tests completed successfully!');
  console.log('\n🎯 Available test commands:');
  console.log('   npm test              - Run all existing tests');
  console.log('   npm run test:all      - Run comprehensive test suite');
  console.log('   npm run test:features - Test all implemented features');
  console.log('   npm run test:reactions - Test reaction system');
  console.log('   npm run test:new      - Test new features (feed, search, notifications)');
  console.log('   npm run test:watch    - Run tests in watch mode');
  
  console.log('\n🎉 Your backend is ready for testing!');
  
} catch (error) {
  console.log('\n❌ Tests failed. Please check the errors above.');
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure MongoDB is running');
  console.log('   2. Check your .env file configuration');
  console.log('   3. Run "npm install" to ensure all dependencies are installed');
  console.log('   4. Check the test output for specific error messages');
  
  process.exit(1);
}

