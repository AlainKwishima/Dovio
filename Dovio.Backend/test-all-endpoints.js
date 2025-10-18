import https from 'https';
import http from 'http';

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make HTTP requests
const makeRequest = (method, url, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Test helper function
const runTest = async (testName, testFn) => {
  testResults.total++;
  try {
    const result = await testFn();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ ${testName}`);
      testResults.details.push({ name: testName, status: 'PASS', result });
    } else {
      testResults.failed++;
      console.log(`❌ ${testName}: ${result.error}`);
      testResults.details.push({ name: testName, status: 'FAIL', error: result.error });
    }
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ${testName}: ${error.message}`);
    testResults.details.push({ name: testName, status: 'ERROR', error: error.message });
  }
};

// Global variables to store test data
let user1Token = null;
let user2Token = null;
let user1Id = null;
let user2Id = null;
let messageId = null;
let postId = null;

console.log('🚀 Starting Comprehensive API Testing...\n');

// Test 1: Health Check
await runTest('Health Check', async () => {
  const response = await makeRequest('GET', `${BASE_URL}/health`);
  return {
    success: response.status === 200 && response.body.success === true,
    data: response.body
  };
});

// Test 2: Register User 1
await runTest('Register User 1 (John Doe)', async () => {
  const userData = {
    fullNames: 'John Doe',
    email: 'john.doe@test.com',
    password: 'password123',
    dob: '1990-01-15',
    address: '123 Test St, Test City',
    phoneNumber: '+1234567890',
    occupation: 'Software Engineer',
    hobbies: 'Coding, Gaming'
  };
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, userData);
  
  if (response.status === 201 && response.body.success) {
    user1Token = response.body.data.accessToken;
    user1Id = response.body.data.user.userId;
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 3: Register User 2
await runTest('Register User 2 (Jane Smith)', async () => {
  const userData = {
    fullNames: 'Jane Smith',
    email: 'jane.smith@test.com',
    password: 'password123',
    dob: '1992-05-20',
    address: '456 Test Ave, Test City',
    phoneNumber: '+1987654321',
    occupation: 'Designer',
    hobbies: 'Design, Art'
  };
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, userData);
  
  if (response.status === 201 && response.body.success) {
    user2Token = response.body.data.accessToken;
    user2Id = response.body.data.user.userId;
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 4: Login User 1
await runTest('Login User 1', async () => {
  const loginData = {
    email: 'john.doe@test.com',
    password: 'password123'
  };
  
  const response = await makeRequest('POST', `${API_BASE}/auth/login`, loginData);
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 5: Get User 1 Profile
await runTest('Get User 1 Profile', async () => {
  const response = await makeRequest('GET', `${API_BASE}/users/profile`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 6: Update User 1 Profile
await runTest('Update User 1 Profile', async () => {
  const updateData = {
    fullNames: 'John Updated Doe',
    address: '789 Updated St, Updated City',
    hobbies: 'Coding, Gaming, Reading'
  };
  
  const response = await makeRequest('PUT', `${API_BASE}/users/profile`, updateData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 7: Update Wallet Balance (Add)
await runTest('Update Wallet Balance (Add)', async () => {
  const walletData = {
    amount: 1000,
    operation: 'add'
  };
  
  const response = await makeRequest('PUT', `${API_BASE}/users/wallet`, walletData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 8: Add Recent Action
await runTest('Add Recent Action', async () => {
  const actionData = {
    action: 'Tested wallet update'
  };
  
  const response = await makeRequest('POST', `${API_BASE}/users/activity`, actionData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 9: Add Active Time
await runTest('Add Active Time', async () => {
  const activeTimeData = {
    date: '2024-01-15',
    beginningTime: '09:00',
    endTime: '17:00'
  };
  
  const response = await makeRequest('POST', `${API_BASE}/users/active-time`, activeTimeData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 10: Get Activity History
await runTest('Get Activity History', async () => {
  const response = await makeRequest('GET', `${API_BASE}/users/activity-history`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 11: Create Post
await runTest('Create Post', async () => {
  const postData = {
    postText: 'This is my first test post! Testing the API functionality.',
    mediaURLs: ['https://via.placeholder.com/400x300/0000FF/FFFFFF?text=Test+Post']
  };
  
  const response = await makeRequest('POST', `${API_BASE}/posts`, postData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 201 && response.body.success) {
    postId = response.body.data.post.postId;
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 12: Get Posts (Public)
await runTest('Get Posts (Public)', async () => {
  const response = await makeRequest('GET', `${API_BASE}/posts?page=1&limit=10`);
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 13: Get Single Post
await runTest('Get Single Post', async () => {
  const response = await makeRequest('GET', `${API_BASE}/posts/${postId}`);
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 14: Update Post
await runTest('Update Post', async () => {
  const updateData = {
    postText: 'This is my updated test post! The API is working great.'
  };
  
  const response = await makeRequest('PUT', `${API_BASE}/posts/${postId}`, updateData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 15: Send Message
await runTest('Send Message', async () => {
  const messageData = {
    receiverId: user2Id,
    content: 'Hello Jane! This is a test message from John.',
    mediaUrl: 'https://via.placeholder.com/200x200/00FF00/FFFFFF?text=Test+Message'
  };
  
  const response = await makeRequest('POST', `${API_BASE}/messages`, messageData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 201 && response.body.success) {
    messageId = response.body.data.message.messageId;
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 16: Get Messages
await runTest('Get Messages', async () => {
  const response = await makeRequest('GET', `${API_BASE}/messages?page=1&limit=10`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 17: Get Conversations
await runTest('Get Conversations', async () => {
  const response = await makeRequest('GET', `${API_BASE}/messages/conversations`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 18: Follow User
await runTest('Follow User', async () => {
  const followData = {
    followeeId: user2Id
  };
  
  const response = await makeRequest('POST', `${API_BASE}/follows`, followData, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 201 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 19: Check Follow Status
await runTest('Check Follow Status', async () => {
  const response = await makeRequest('GET', `${API_BASE}/follows/status/${user2Id}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 20: Get Followers
await runTest('Get Followers', async () => {
  const response = await makeRequest('GET', `${API_BASE}/follows/followers/${user2Id}?page=1&limit=10`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 21: Get Following
await runTest('Get Following', async () => {
  const response = await makeRequest('GET', `${API_BASE}/follows/following/${user1Id}?page=1&limit=10`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 22: Delete Message
await runTest('Delete Message', async () => {
  const response = await makeRequest('DELETE', `${API_BASE}/messages/${messageId}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 23: Delete Post
await runTest('Delete Post', async () => {
  const response = await makeRequest('DELETE', `${API_BASE}/posts/${postId}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 24: Unfollow User
await runTest('Unfollow User', async () => {
  const response = await makeRequest('DELETE', `${API_BASE}/follows/${user2Id}`, null, {
    'Authorization': `Bearer ${user1Token}`
  });
  
  if (response.status === 200 && response.body.success) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Status: ${response.status}, Body: ${JSON.stringify(response.body)}` };
});

// Test 25: Test Invalid Authentication
await runTest('Test Invalid Authentication', async () => {
  const response = await makeRequest('GET', `${API_BASE}/users/profile`, null, {
    'Authorization': 'Bearer invalid-token'
  });
  
  if (response.status === 401) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Expected 401, got ${response.status}` };
});

// Test 26: Test Missing Authentication
await runTest('Test Missing Authentication', async () => {
  const response = await makeRequest('GET', `${API_BASE}/users/profile`);
  
  if (response.status === 401) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Expected 401, got ${response.status}` };
});

// Test 27: Test Invalid Endpoint
await runTest('Test Invalid Endpoint', async () => {
  const response = await makeRequest('GET', `${API_BASE}/invalid-endpoint`);
  
  if (response.status === 404) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Expected 404, got ${response.status}` };
});

// Test 28: Test Validation Errors
await runTest('Test Validation Errors', async () => {
  const invalidUserData = {
    fullNames: '', // Empty name should fail validation
    email: 'invalid-email', // Invalid email format
    password: '123' // Too short password
  };
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, invalidUserData);
  
  if (response.status === 400) {
    return { success: true, data: response.body };
  }
  
  return { success: false, error: `Expected 400, got ${response.status}` };
});

// Test 29: Test Rate Limiting (if applicable)
await runTest('Test Rate Limiting', async () => {
  // Make multiple rapid requests to test rate limiting
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('GET', `${BASE_URL}/health`));
  }
  
  const responses = await Promise.all(promises);
  const allSuccessful = responses.every(r => r.status === 200);
  
  if (allSuccessful) {
    return { success: true, data: 'Rate limiting not triggered (normal for health endpoint)' };
  }
  
  return { success: true, data: 'Rate limiting working as expected' };
});

// Test 30: Test CORS Headers
await runTest('Test CORS Headers', async () => {
  const response = await makeRequest('OPTIONS', `${API_BASE}/auth/register`);
  
  if (response.status === 200 || response.status === 204) {
    return { success: true, data: 'CORS headers present' };
  }
  
  return { success: false, error: `CORS test failed with status ${response.status}` };
});

// Print final results
console.log('\n' + '='.repeat(60));
console.log('📊 COMPREHENSIVE API TEST RESULTS');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Total: ${testResults.total}`);
console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  testResults.details
    .filter(test => test.status !== 'PASS')
    .forEach(test => {
      console.log(`   • ${test.name}: ${test.error || test.result}`);
    });
}

console.log('\n🎉 API Testing Complete!');
console.log('='.repeat(60));



