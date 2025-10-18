import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test data
let testUsers = {
  user1: {
    userId: '',
    email: 'testuser1@example.com',
    password: 'securePassword123!',
    fullNames: 'Test User One',
    dob: '1990-01-01',
    address: '123 Test Street',
    phoneNumber: '+1234567890',
    occupation: 'Software Developer',
    hobbies: 'Reading, Programming',
    accessToken: '',
    refreshToken: ''
  },
  user2: {
    userId: '',
    email: 'testuser2@example.com', 
    password: 'securePassword123!',
    fullNames: 'Test User Two',
    dob: '1985-05-15',
    address: '456 Test Avenue',
    phoneNumber: '+0987654321',
    occupation: 'Designer',
    hobbies: 'Drawing, Music',
    accessToken: '',
    refreshToken: ''
  }
};

let testData = {
  posts: [],
  messages: [],
  follows: [],
  stories: [],
  comments: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const color = colors[type] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`✓ ${testName}${details ? ' - ' + details : ''}`, 'green');
  } else {
    failedTests++;
    log(`✗ ${testName}${details ? ' - ' + details : ''}`, 'red');
  }
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    } else if (data && method === 'GET') {
      config.params = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

async function testHealthCheck() {
  log('=== Testing Health Check ===', 'blue');
  
  const response = await makeRequest('GET', '/health');
  logTest('Health Check', response.success && response.status === 200, 
    response.success ? 'API is running' : response.error);
}

async function testAuthentication() {
  log('=== Testing Authentication ===', 'blue');
  
  // Test user registration for both users
  for (const [key, user] of Object.entries(testUsers)) {
    const registerData = {
      email: user.email,
      password: user.password,
      fullNames: user.fullNames,
      dob: user.dob,
      address: user.address,
      phoneNumber: user.phoneNumber,
      occupation: user.occupation,
      hobbies: user.hobbies
    };
    
    const registerResponse = await makeRequest('POST', '/auth/register', registerData);
    logTest(`Registration for ${user.fullNames}`, registerResponse.success);
    
    if (registerResponse.success) {
      testUsers[key].userId = registerResponse.data.data.user.userId;
      testUsers[key].accessToken = registerResponse.data.data.accessToken;
      testUsers[key].refreshToken = registerResponse.data.data.refreshToken;
    }
  }
  
  // Test login for both users
  for (const [key, user] of Object.entries(testUsers)) {
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: user.email,
      password: user.password
    });
    logTest(`Login for ${user.fullNames}`, loginResponse.success);
    
    if (loginResponse.success) {
      testUsers[key].accessToken = loginResponse.data.data.accessToken;
      testUsers[key].refreshToken = loginResponse.data.data.refreshToken;
    }
  }
  
  // Test refresh token
  if (testUsers.user1.refreshToken) {
    const refreshResponse = await makeRequest('POST', '/auth/refresh-token', {
      refreshToken: testUsers.user1.refreshToken
    });
    logTest('Refresh Token', refreshResponse.success);
  }
  
  // Test invalid login
  const invalidLoginResponse = await makeRequest('POST', '/auth/login', {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  });
  logTest('Invalid Login (should fail)', !invalidLoginResponse.success);
}

async function testUserOperations() {
  log('=== Testing User Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  
  // Get user profile
  const profileResponse = await makeRequest('GET', '/users/profile', null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Get User Profile', profileResponse.success);
  
  // Update user profile
  const updateResponse = await makeRequest('PUT', '/users/profile', {
    fullNames: 'Updated Test User One',
    hobbies: 'Reading, Programming, Gaming'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Update User Profile', updateResponse.success);
  
  // Add wallet transaction
  const walletResponse = await makeRequest('POST', '/users/wallet/update', {
    amount: 100,
    operation: 'credit',
    description: 'Test credit'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Update Wallet', walletResponse.success);
  
  // Add activity
  const activityResponse = await makeRequest('POST', '/users/activity', {
    activity: 'Logged in to test the app'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Add Activity', activityResponse.success);
  
  // Add active time
  const activeTimeResponse = await makeRequest('POST', '/users/active-time', {
    date: '2025-10-11',
    beginningTime: '09:00',
    endTime: '17:00'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Add Active Time', activeTimeResponse.success);
}

async function testPostOperations() {
  log('=== Testing Post Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  const user2Token = testUsers.user2.accessToken;
  
  // Create post by user1
  const createPostResponse = await makeRequest('POST', '/posts', {
    postText: 'This is a test post from user 1',
    mediaURLs: ['https://example.com/image1.jpg']
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Create Post', createPostResponse.success);
  
  if (createPostResponse.success) {
    testData.posts.push(createPostResponse.data.data.post);
  }
  
  // Get all posts (public)
  const getPostsResponse = await makeRequest('GET', '/posts');
  logTest('Get All Posts (Public)', getPostsResponse.success);
  
  // Get specific post
  if (testData.posts.length > 0) {
    const postId = testData.posts[0].postId;
    const getPostResponse = await makeRequest('GET', `/posts/${postId}`);
    logTest('Get Specific Post', getPostResponse.success);
    
    // Update post (by owner)
    const updatePostResponse = await makeRequest('PUT', `/posts/${postId}`, {
      postText: 'Updated test post content'
    }, {
      'Authorization': `Bearer ${user1Token}`
    });
    logTest('Update Post (Owner)', updatePostResponse.success);
    
    // Try to update post by non-owner (should fail)
    const unauthorizedUpdateResponse = await makeRequest('PUT', `/posts/${postId}`, {
      postText: 'Unauthorized update attempt'
    }, {
      'Authorization': `Bearer ${user2Token}`
    });
    logTest('Update Post (Non-Owner - should fail)', !unauthorizedUpdateResponse.success);
  }
}

async function testFollowOperations() {
  log('=== Testing Follow Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  const user2Token = testUsers.user2.accessToken;
  const user2Id = testUsers.user2.userId;
  const user1Id = testUsers.user1.userId;
  
  // User1 follows User2
  const followResponse = await makeRequest('POST', '/follows', {
    followeeId: user2Id
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Follow User', followResponse.success);
  
  // Try duplicate follow (should fail)
  const duplicateFollowResponse = await makeRequest('POST', '/follows', {
    followeeId: user2Id
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Duplicate Follow (should fail)', !duplicateFollowResponse.success);
  
  // Check follow status
  const checkFollowResponse = await makeRequest('GET', `/follows/check/${user2Id}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Check Follow Status', checkFollowResponse.success);
  
  // Get followers of User2
  const followersResponse = await makeRequest('GET', `/follows/followers/${user2Id}`, null, {
    'Authorization': `Bearer ${user2Token}`
  });
  logTest('Get Followers', followersResponse.success);
  
  // Get following of User1
  const followingResponse = await makeRequest('GET', `/follows/following/${user1Id}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Get Following', followingResponse.success);
  
  // Unfollow
  const unfollowResponse = await makeRequest('DELETE', `/follows/${user2Id}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Unfollow User', unfollowResponse.success);
}

async function testMessageOperations() {
  log('=== Testing Message Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  const user2Token = testUsers.user2.accessToken;
  const user2Id = testUsers.user2.userId;
  const user1Id = testUsers.user1.userId;
  
  // Send message from User1 to User2
  const sendMessageResponse = await makeRequest('POST', '/messages', {
    receiverId: user2Id,
    content: 'Hello User2, this is a test message!'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Send Message', sendMessageResponse.success);
  
  if (sendMessageResponse.success) {
    testData.messages.push(sendMessageResponse.data.data.message);
  }
  
  // Get messages for User2
  const getMessagesResponse = await makeRequest('GET', '/messages', null, {
    'Authorization': `Bearer ${user2Token}`
  });
  logTest('Get Messages', getMessagesResponse.success);
  
  // Get conversation between users
  const conversationResponse = await makeRequest('GET', `/messages/conversation/${user1Id}`, null, {
    'Authorization': `Bearer ${user2Token}`
  });
  logTest('Get Conversation', conversationResponse.success);
  
  // Delete message (by sender)
  if (testData.messages.length > 0) {
    const messageId = testData.messages[0].messageId;
    const deleteMessageResponse = await makeRequest('DELETE', `/messages/${messageId}`, null, {
      'Authorization': `Bearer ${user1Token}`
    });
    logTest('Delete Message (Sender)', deleteMessageResponse.success);
  }
}

async function testStoryOperations() {
  log('=== Testing Story Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  
  // Create story
  const createStoryResponse = await makeRequest('POST', '/stories', {
    content: 'This is a test story',
    mediaUrl: 'https://example.com/story-image.jpg'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Create Story', createStoryResponse.success);
  
  // Get stories
  const getStoriesResponse = await makeRequest('GET', '/stories', null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Get Stories', getStoriesResponse.success);
}

async function testNotificationOperations() {
  log('=== Testing Notification Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  
  // Get notifications
  const getNotificationsResponse = await makeRequest('GET', '/notifications', null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Get Notifications', getNotificationsResponse.success);
}

async function testSearchOperations() {
  log('=== Testing Search Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  
  // Search users
  const searchUsersResponse = await makeRequest('GET', '/search/users', {
    query: 'Test'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Search Users', searchUsersResponse.success);
  
  // Search posts
  const searchPostsResponse = await makeRequest('GET', '/search/posts', {
    query: 'test'
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Search Posts', searchPostsResponse.success);
}

async function testFeedOperations() {
  log('=== Testing Feed Operations ===', 'blue');
  
  const user1Token = testUsers.user1.accessToken;
  
  // Get feed
  const getFeedResponse = await makeRequest('GET', '/feed', null, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Get Feed', getFeedResponse.success);
}

async function testErrorHandling() {
  log('=== Testing Error Handling ===', 'blue');
  
  // Test unauthorized access
  const unauthorizedResponse = await makeRequest('GET', '/users/profile');
  logTest('Unauthorized Access (should fail)', !unauthorizedResponse.success && unauthorizedResponse.status === 401);
  
  // Test invalid endpoint
  const invalidEndpointResponse = await makeRequest('GET', '/invalid-endpoint');
  logTest('Invalid Endpoint (should fail)', !invalidEndpointResponse.success && unauthorizedResponse.status === 404);
  
  // Test invalid JSON in request
  const user1Token = testUsers.user1.accessToken;
  const invalidDataResponse = await makeRequest('POST', '/posts', {
    postText: '' // Empty text should fail validation
  }, {
    'Authorization': `Bearer ${user1Token}`
  });
  logTest('Invalid Data (should fail)', !invalidDataResponse.success);
}

async function cleanup() {
  log('=== Cleanup ===', 'blue');
  
  // Delete created posts
  for (const post of testData.posts) {
    if (post && post.postId) {
      const user1Token = testUsers.user1.accessToken;
      const deleteResponse = await makeRequest('DELETE', `/posts/${post.postId}`, null, {
        'Authorization': `Bearer ${user1Token}`
      });
      logTest(`Delete Post ${post.postId}`, deleteResponse.success);
    }
  }
  
  // Note: Users are not deleted in this test to avoid complexity
  // In a real test environment, you might want to clean up test users too
}

async function runAllTests() {
  log('🚀 Starting Comprehensive API Testing...', 'blue');
  
  try {
    // Test basic connectivity first
    await testHealthCheck();
    
    // Test authentication (this sets up test users)
    await testAuthentication();
    
    // Test all other features if authentication worked
    if (testUsers.user1.accessToken && testUsers.user2.accessToken) {
      await testUserOperations();
      await testPostOperations();
      await testFollowOperations();
      await testMessageOperations();
      await testStoryOperations();
      await testNotificationOperations();
      await testSearchOperations();
      await testFeedOperations();
      await testErrorHandling();
      
      // Cleanup
      await cleanup();
    } else {
      log('❌ Authentication failed, skipping other tests', 'red');
    }
    
    // Final report
    log(`\n📊 Test Results Summary:`, 'blue');
    log(`Total Tests: ${totalTests}`, 'yellow');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, 'red');
    log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(2)}%`, 'yellow');
    
    if (failedTests === 0) {
      log('\n🎉 All tests passed!', 'green');
    } else {
      log(`\n⚠️  ${failedTests} test(s) failed. Check the logs above for details.`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ Test suite failed with error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Test suite interrupted by user', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Test suite terminated', 'yellow');
  process.exit(0);
});

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export default runAllTests;