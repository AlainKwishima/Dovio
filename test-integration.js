/**
 * Integration Test Script for Dovio
 * Tests backend connectivity and all major features
 * Run with: node test-integration.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

let accessToken = null;
let refreshToken = null;
let testUserId = null;
let testPostId = null;
let testStoryId = null;
let testConversationId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'info');
  const result = await makeRequest('/health', { skipAuth: true });
  
  if (result.ok) {
    log('✓ Backend is running and healthy', 'success');
    return true;
  } else {
    log(`✗ Health check failed: ${result.error || result.status}`, 'error');
    log('  Make sure backend is running: cd Dovio.Backend && npm run dev', 'warning');
    return false;
  }
}

// Test 2: Registration
async function testRegistration() {
  log('\n📋 Test 2: User Registration', 'info');
  
  const testEmail = `test${Date.now()}@dovio.test`;
  const userData = {
    fullNames: 'Test User',
    email: testEmail,
    password: 'Test123!@#',
    dob: '2000-01-01',
    address: 'Test Address',
    phoneNumber: '+1234567890',
    occupation: 'Tester',
    hobbies: 'Testing',
  };

  const result = await makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
    skipAuth: true,
  });

  if (result.ok || result.status === 201) {
    log(`✓ Registration successful for ${testEmail}`, 'success');
    log(`  Note: Email verification may be required`, 'warning');
    return { success: true, email: testEmail, password: userData.password };
  } else {
    log(`✗ Registration failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false };
  }
}

// Test 3: Login
async function testLogin(email, password) {
  log('\n📋 Test 3: User Login', 'info');
  
  const result = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });

  if (result.ok && result.data?.data) {
    accessToken = result.data.data.accessToken;
    refreshToken = result.data.data.refreshToken;
    testUserId = result.data.data.user?.userId || result.data.data.user?.id;
    log('✓ Login successful', 'success');
    log(`  Access Token: ${accessToken?.substring(0, 20)}...`, 'info');
    log(`  User ID: ${testUserId}`, 'info');
    return true;
  } else {
    log(`✗ Login failed: ${JSON.stringify(result.data)}`, 'error');
    if (result.status === 403) {
      log('  Email verification required. Check development logs for token.', 'warning');
    }
    return false;
  }
}

// Test 4: Get User Profile
async function testGetProfile() {
  log('\n📋 Test 4: Get User Profile', 'info');
  
  const result = await makeRequest('/api/users/profile');

  if (result.ok) {
    log('✓ Profile retrieved successfully', 'success');
    log(`  User: ${result.data?.data?.fullNames || result.data?.data?.username}`, 'info');
    return true;
  } else {
    log(`✗ Get profile failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 5: Create Post
async function testCreatePost() {
  log('\n📋 Test 5: Create Post', 'info');
  
  const postData = {
    postText: 'Test post from integration test! 🚀',
    mediaURLs: ['https://picsum.photos/800/600'],
  };

  const result = await makeRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });

  if (result.ok || result.status === 201) {
    testPostId = result.data?.data?.postId || result.data?.data?.id;
    log('✓ Post created successfully', 'success');
    log(`  Post ID: ${testPostId}`, 'info');
    return true;
  } else {
    log(`✗ Create post failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 6: Get Feed
async function testGetFeed() {
  log('\n📋 Test 6: Get Feed', 'info');
  
  const result = await makeRequest('/api/feed?page=1&limit=10');

  if (result.ok) {
    const posts = result.data?.data?.data || result.data?.data || [];
    log(`✓ Feed retrieved: ${posts.length} posts`, 'success');
    return true;
  } else {
    log(`✗ Get feed failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 7: Add Reaction (Like)
async function testAddReaction() {
  log('\n📋 Test 7: Add Reaction (Like Post)', 'info');
  
  if (!testPostId) {
    log('⊘ Skipping: No post ID available', 'warning');
    return false;
  }

  const reactionData = {
    entityType: 'post',
    entityId: testPostId,
    type: 'like',
  };

  const result = await makeRequest('/api/reactions', {
    method: 'POST',
    body: JSON.stringify(reactionData),
  });

  if (result.ok || result.status === 201) {
    log('✓ Reaction added successfully', 'success');
    return true;
  } else {
    log(`✗ Add reaction failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 8: Create Comment
async function testCreateComment() {
  log('\n📋 Test 8: Create Comment', 'info');
  
  if (!testPostId) {
    log('⊘ Skipping: No post ID available', 'warning');
    return false;
  }

  const commentData = {
    postId: testPostId,
    content: 'Great post! 👍',
  };

  const result = await makeRequest('/api/comments', {
    method: 'POST',
    body: JSON.stringify(commentData),
  });

  if (result.ok || result.status === 201) {
    log('✓ Comment created successfully', 'success');
    return true;
  } else {
    log(`✗ Create comment failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 9: Create Story
async function testCreateStory() {
  log('\n📋 Test 9: Create Story', 'info');
  
  const storyData = {
    media: {
      id: `media-${Date.now()}`,
      type: 'image',
      url: 'https://picsum.photos/1080/1920',
      size: 0,
    },
    content: 'Test story! 📸',
    duration: 5000,
  };

  const result = await makeRequest('/api/stories', {
    method: 'POST',
    body: JSON.stringify(storyData),
  });

  if (result.ok || result.status === 201) {
    testStoryId = result.data?.data?.storyId || result.data?.data?.id;
    log('✓ Story created successfully', 'success');
    log(`  Story ID: ${testStoryId}`, 'info');
    return true;
  } else {
    log(`✗ Create story failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 10: Get Stories
async function testGetStories() {
  log('\n📋 Test 10: Get Stories', 'info');
  
  const result = await makeRequest('/api/stories?page=1&limit=10');

  if (result.ok) {
    const stories = result.data?.data?.data || result.data?.data || [];
    log(`✓ Stories retrieved: ${stories.length} stories`, 'success');
    return true;
  } else {
    log(`✗ Get stories failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 11: Save Post (Bookmark)
async function testSavePost() {
  log('\n📋 Test 11: Save Post (Bookmark)', 'info');
  
  if (!testPostId) {
    log('⊘ Skipping: No post ID available', 'warning');
    return false;
  }

  const result = await makeRequest(`/api/posts/${testPostId}/save`, {
    method: 'POST',
  });

  if (result.ok || result.status === 201 || result.status === 200) {
    log('✓ Post saved successfully', 'success');
    return true;
  } else {
    log(`✗ Save post failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 12: Share Post
async function testSharePost() {
  log('\n📋 Test 12: Share Post', 'info');
  
  if (!testPostId) {
    log('⊘ Skipping: No post ID available', 'warning');
    return false;
  }

  const shareData = {
    postId: testPostId,
    type: 'repost',
    content: 'Sharing this awesome post!',
  };

  const result = await makeRequest('/api/shares', {
    method: 'POST',
    body: JSON.stringify(shareData),
  });

  if (result.ok || result.status === 201) {
    log('✓ Post shared successfully', 'success');
    return true;
  } else {
    log(`✗ Share post failed: ${JSON.stringify(result.data)}`, 'error');
    return false;
  }
}

// Test 13: File Upload
async function testFileUpload() {
  log('\n📋 Test 13: File Upload', 'info');
  log('⊘ Skipping: File upload requires actual file (test manually)', 'warning');
  return false;
}

// Test 14: Messaging
async function testMessaging() {
  log('\n📋 Test 14: Messaging', 'info');
  log('⊘ Skipping: Requires another user (test manually)', 'warning');
  return false;
}

// Main test runner
async function runAllTests() {
  log('\n========================================', 'info');
  log('🚀 Dovio Integration Test Suite', 'info');
  log('========================================', 'info');
  log(`Testing backend at: ${API_BASE_URL}`, 'info');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 1: Health Check (critical)
  if (!(await testHealthCheck())) {
    log('\n❌ Backend is not accessible. Please start the backend server.', 'error');
    log('   Run: cd Dovio.Backend && npm run dev', 'warning');
    process.exit(1);
  }
  results.passed++;

  // Test 2 & 3: Registration and Login
  const regResult = await testRegistration();
  if (regResult.success) {
    results.passed++;
    
    // Wait a bit for registration to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (await testLogin(regResult.email, regResult.password)) {
      results.passed++;
    } else {
      results.failed++;
      log('\n⚠️  Login failed. Features requiring authentication will be skipped.', 'warning');
    }
  } else {
    results.failed++;
    results.skipped++; // Login skipped
    log('\n⚠️  Registration failed. Using mock data or existing account may be needed.', 'warning');
  }

  // Tests requiring authentication
  if (accessToken) {
    // Test 4: Get Profile
    results[await testGetProfile() ? 'passed' : 'failed']++;
    
    // Test 5: Create Post
    results[await testCreatePost() ? 'passed' : 'failed']++;
    
    // Test 6: Get Feed
    results[await testGetFeed() ? 'passed' : 'failed']++;
    
    // Test 7: Add Reaction
    results[await testAddReaction() ? 'passed' : 'failed']++;
    
    // Test 8: Create Comment
    results[await testCreateComment() ? 'passed' : 'failed']++;
    
    // Test 9: Create Story
    results[await testCreateStory() ? 'passed' : 'failed']++;
    
    // Test 10: Get Stories
    results[await testGetStories() ? 'passed' : 'failed']++;
    
    // Test 11: Save Post
    results[await testSavePost() ? 'passed' : 'failed']++;
    
    // Test 12: Share Post
    results[await testSharePost() ? 'passed' : 'failed']++;
    
    // Tests 13-14: Manual tests
    testFileUpload();
    testMessaging();
    results.skipped += 2;
  } else {
    log('\n⊘ Skipping authenticated tests (no access token)', 'warning');
    results.skipped += 9;
  }

  // Summary
  log('\n========================================', 'info');
  log('📊 Test Summary', 'info');
  log('========================================', 'info');
  log(`✓ Passed:  ${results.passed}`, 'success');
  log(`✗ Failed:  ${results.failed}`, 'error');
  log(`⊘ Skipped: ${results.skipped}`, 'warning');
  log(`Total:     ${results.passed + results.failed + results.skipped}`, 'info');

  if (results.failed === 0 && results.passed > 0) {
    log('\n🎉 All tests passed! Integration is working correctly.', 'success');
  } else if (results.failed > 0) {
    log('\n⚠️  Some tests failed. Check the errors above for details.', 'warning');
  }

  log('\n========================================\n', 'info');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
