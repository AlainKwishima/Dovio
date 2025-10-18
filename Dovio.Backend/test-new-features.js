#!/usr/bin/env node

/**
 * Comprehensive Test Script for Mobile Backend API
 * Tests all new features: Stories, Comments, Shares, Enhanced Wallet
 */

import axios from 'axios';
import { config } from 'dotenv';

config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let postId = '';
let storyId = '';
let commentId = '';
let shareId = '';

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

const testUser2 = {
  fullNames: 'Test User 2',
  email: 'test2@example.com',
  password: 'password123',
  dob: '1990-01-01',
  address: '456 Test Ave',
  phoneNumber: '0987654321',
  occupation: 'Designer',
  hobbies: 'Design, Art'
};

// Helper functions
const makeRequest = async (method, endpoint, data = null, token = authToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
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
  
  // Register user 1
  const register1 = await makeRequest('POST', '/auth/register', testUser);
  logTest('Register User 1', register1);
  
  // Register user 2
  const register2 = await makeRequest('POST', '/auth/register', testUser2);
  logTest('Register User 2', register2);
  
  // Login user 1
  const login1 = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  logTest('Login User 1', login1);
  
  if (login1.success) {
    authToken = login1.data.data.token;
    userId = login1.data.data.user.userId;
  }
  
  return login1.success;
};

const testPosts = async () => {
  console.log('\n📝 Testing Posts...');
  
  // Create a post
  const createPost = await makeRequest('POST', '/posts', {
    postText: 'This is a test post with media!',
    mediaURLs: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  });
  logTest('Create Post', createPost);
  
  if (createPost.success) {
    postId = createPost.data.data.post.postId;
  }
  
  // Get posts
  const getPosts = await makeRequest('GET', '/posts');
  logTest('Get Posts', getPosts);
  
  // Get specific post
  if (postId) {
    const getPost = await makeRequest('GET', `/posts/${postId}`);
    logTest('Get Specific Post', getPost);
  }
  
  return createPost.success;
};

const testStories = async () => {
  console.log('\n📖 Testing Stories...');
  
  // Create a text story
  const createTextStory = await makeRequest('POST', '/stories', {
    storyText: 'This is a test story!',
    mediaType: 'text'
  });
  logTest('Create Text Story', createTextStory);
  
  // Create a media story
  const createMediaStory = await makeRequest('POST', '/stories', {
    storyText: 'Check out this cool image!',
    mediaURL: 'https://example.com/story-image.jpg',
    mediaType: 'image'
  });
  logTest('Create Media Story', createMediaStory);
  
  if (createMediaStory.success) {
    storyId = createMediaStory.data.data.story.storyId;
  }
  
  // Get stories
  const getStories = await makeRequest('GET', '/stories');
  logTest('Get Stories', getStories);
  
  // Get specific story
  if (storyId) {
    const getStory = await makeRequest('GET', `/stories/${storyId}`);
    logTest('Get Specific Story', getStory);
  }
  
  return createTextStory.success && createMediaStory.success;
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
  
  if (createComment.success) {
    commentId = createComment.data.data.comment.commentId;
  }
  
  // Create a reply
  if (commentId) {
    const createReply = await makeRequest('POST', '/comments', {
      postId: postId,
      content: 'I agree with this comment!',
      parentCommentId: commentId
    });
    logTest('Create Reply', createReply);
  }
  
  // Get comments
  const getComments = await makeRequest('GET', `/comments?postId=${postId}`);
  logTest('Get Comments', getComments);
  
  // Like comment
  if (commentId) {
    const likeComment = await makeRequest('POST', `/comments/${commentId}/like`);
    logTest('Like Comment', likeComment);
  }
  
  // Update comment
  if (commentId) {
    const updateComment = await makeRequest('PUT', `/comments/${commentId}`, {
      content: 'Updated comment content!'
    });
    logTest('Update Comment', updateComment);
  }
  
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
  
  if (sharePost.success) {
    shareId = sharePost.data.data.share.shareId;
  }
  
  // Get shared posts
  const getSharedPosts = await makeRequest('GET', '/shares');
  logTest('Get Shared Posts', getSharedPosts);
  
  // Get shares for specific post
  const getPostShares = await makeRequest('GET', `/shares/post/${postId}`);
  logTest('Get Post Shares', getPostShares);
  
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
  
  // Send money (need to create second user first)
  const login2 = await makeRequest('POST', '/auth/login', {
    email: testUser2.email,
    password: testUser2.password
  });
  
  if (login2.success) {
    const sendMoney = await makeRequest('POST', '/users/wallet/send', {
      recipientId: login2.data.data.user.userId,
      amount: 25,
      message: 'Test payment'
    });
    logTest('Send Money', sendMoney);
  }
  
  // Withdraw money
  const withdrawMoney = await makeRequest('POST', '/users/wallet/withdraw', {
    amount: 50,
    withdrawalMethod: 'bank_transfer',
    accountDetails: 'Account: 123456789'
  });
  logTest('Withdraw Money', withdrawMoney);
  
  // Get updated balance
  const getUpdatedBalance = await makeRequest('GET', '/users/wallet/balance');
  logTest('Get Updated Wallet Balance', getUpdatedBalance);
  
  return addMoney.success;
};

const testCleanup = async () => {
  console.log('\n🧹 Testing Cleanup...');
  
  // Delete share
  if (shareId) {
    const deleteShare = await makeRequest('DELETE', `/shares/${shareId}`);
    logTest('Delete Share', deleteShare);
  }
  
  // Delete comment
  if (commentId) {
    const deleteComment = await makeRequest('DELETE', `/comments/${commentId}`);
    logTest('Delete Comment', deleteComment);
  }
  
  // Delete story
  if (storyId) {
    const deleteStory = await makeRequest('DELETE', `/stories/${storyId}`);
    logTest('Delete Story', deleteStory);
  }
  
  // Delete post
  if (postId) {
    const deletePost = await makeRequest('DELETE', `/posts/${postId}`);
    logTest('Delete Post', deletePost);
  }
  
  // Delete accounts
  const deleteAccount1 = await makeRequest('DELETE', '/users/account');
  logTest('Delete Account 1', deleteAccount1);
  
  const login2 = await makeRequest('POST', '/auth/login', {
    email: testUser2.email,
    password: testUser2.password
  });
  
  if (login2.success) {
    const deleteAccount2 = await makeRequest('DELETE', '/users/account', null, login2.data.data.token);
    logTest('Delete Account 2', deleteAccount2);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Comprehensive Backend API Tests...');
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
    await testCleanup();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.log('\n💥 Test runner error:', error.message);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };

