#!/usr/bin/env node

/**
 * Simple Test Script for Mobile Backend API
 * Tests all new features using fetch API
 */

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  fullNames: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  dob: '1990-01-01',
  address: '123 Test St',
  phoneNumber: '1234567890',
  occupation: 'Developer',
  hobbies: 'Coding, Reading'
};

let authToken = '';
let userId = '';
let postId = '';

// Helper functions
const makeRequest = async (method, endpoint, data = null, token = authToken) => {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { body: JSON.stringify(data) })
    };
    
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const responseData = await response.json();
    
    return { 
      success: response.ok, 
      data: responseData, 
      status: response.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: 0 
    };
  }
};

const logTest = (testName, result) => {
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (!result.success) {
    console.log(`   Error: ${JSON.stringify(result.error)}`);
  }
};

// Test functions
const testAuth = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  // Register user
  const register = await makeRequest('POST', '/auth/register', testUser);
  logTest('Register User', register);
  
  // Login user
  const login = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  logTest('Login User', login);
  
  if (login.success) {
    authToken = login.data.data.token;
    userId = login.data.data.user.userId;
  }
  
  return login.success;
};

const testPosts = async () => {
  console.log('\n📝 Testing Posts...');
  
  // Create a post
  const createPost = await makeRequest('POST', '/posts', {
    postText: 'This is a test post with media!',
    mediaURLs: ['https://example.com/image1.jpg']
  });
  logTest('Create Post', createPost);
  
  if (createPost.success) {
    postId = createPost.data.data.post.postId;
  }
  
  // Get posts
  const getPosts = await makeRequest('GET', '/posts');
  logTest('Get Posts', getPosts);
  
  return createPost.success;
};

const testStories = async () => {
  console.log('\n📖 Testing Stories...');
  
  // Create a text story
  const createStory = await makeRequest('POST', '/stories', {
    storyText: 'This is a test story!',
    mediaType: 'text'
  });
  logTest('Create Story', createStory);
  
  // Get stories
  const getStories = await makeRequest('GET', '/stories');
  logTest('Get Stories', getStories);
  
  return createStory.success;
};

const testComments = async () => {
  console.log('\n💬 Testing Comments...');
  
  if (!postId) {
    console.log('❌ SKIP Comments - No post ID available');
    return false;
  }
  
  // Create a comment
  const createComment = await makeRequest('POST', '/comments', {
    postId: postId,
    content: 'This is a great post!'
  });
  logTest('Create Comment', createComment);
  
  // Get comments
  const getComments = await makeRequest('GET', `/comments?postId=${postId}`);
  logTest('Get Comments', getComments);
  
  return createComment.success;
};

const testShares = async () => {
  console.log('\n📤 Testing Post Shares...');
  
  if (!postId) {
    console.log('❌ SKIP Shares - No post ID available');
    return false;
  }
  
  // Share a post
  const sharePost = await makeRequest('POST', '/shares', {
    originalPostId: postId,
    shareText: 'This is an amazing post!'
  });
  logTest('Share Post', sharePost);
  
  // Get shared posts
  const getSharedPosts = await makeRequest('GET', '/shares');
  logTest('Get Shared Posts', getSharedPosts);
  
  return sharePost.success;
};

const testWallet = async () => {
  console.log('\n💰 Testing Enhanced Wallet Features...');
  
  // Get wallet balance
  const getBalance = await makeRequest('GET', '/users/wallet/balance');
  logTest('Get Wallet Balance', getBalance);
  
  // Add money to wallet
  const addMoney = await makeRequest('PUT', '/users/wallet', {
    amount: 100,
    operation: 'add'
  });
  logTest('Add Money to Wallet', addMoney);
  
  // Withdraw money
  const withdrawMoney = await makeRequest('POST', '/users/wallet/withdraw', {
    amount: 50,
    withdrawalMethod: 'bank_transfer',
    accountDetails: 'Account: 123456789'
  });
  logTest('Withdraw Money', withdrawMoney);
  
  return addMoney.success;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Backend API Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  
  try {
    const authSuccess = await testAuth();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed. Stopping tests.');
      return;
    }
    
    await testPosts();
    await testStories();
    await testComments();
    await testShares();
    await testWallet();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.log('\n💥 Test runner error:', error.message);
  }
};

// Run tests
runTests();

