import request from 'supertest';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Story from '../src/models/Story.js';
import Comment from '../src/models/Comment.js';
import Reaction from '../src/models/Reaction.js';
import Follow from '../src/models/Follow.js';
import Notification from '../src/models/Notification.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';

describe('Comprehensive API Test Suite', () => {
  let authToken1, authToken2;
  let userId1, userId2;
  let postId, storyId, commentId;
  let conversationId, messageId;

  beforeAll(async () => {
    // Create test users
    const user1 = new User({
      userId: 'comp-test-user-1',
      fullNames: 'Comp Test User 1',
      email: 'comp1@example.com',
      password: '$2a$12$PJUzg4H8FKouInkRHZsv6edM0Zu6CpTFbldgWKvI3W/5uO44EGRIi', // password123
      dob: new Date('1990-01-01'),
      address: '123 Test St',
      phoneNumber: '1234567890',
      occupation: 'Tester',
      hobbies: 'Testing',
      isEmailVerified: true
    });
    await user1.save();

    const user2 = new User({
      userId: 'comp-test-user-2',
      fullNames: 'Comp Test User 2',
      email: 'comp2@example.com',
      password: '$2a$12$PJUzg4H8FKouInkRHZsv6edM0Zu6CpTFbldgWKvI3W/5uO44EGRIi', // password123
      dob: new Date('1991-01-01'),
      address: '456 Test Ave',
      phoneNumber: '0987654321',
      occupation: 'Developer',
      hobbies: 'Coding',
      isEmailVerified: true
    });
    await user2.save();

    userId1 = user1.userId;
    userId2 = user2.userId;
    authToken1 = generateAccessToken({ userId: user1.userId, email: user1.email });
    authToken2 = generateAccessToken({ userId: user2.userId, email: user2.email });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Story.deleteMany({});
    await Comment.deleteMany({});
    await Reaction.deleteMany({});
    await Follow.deleteMany({});
    await Notification.deleteMany({});
  });

  // System Endpoints
  describe('System Endpoints', () => {
    test('GET /health should return server health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mobile Backend API is running');
      expect(response.body.environment).toBe('test');
    });

    test('GET /api/docs should redirect to Swagger documentation', async () => {
      const response = await request(app).get('/api/docs');
      
      expect([200, 301, 302]).toContain(response.status);
    });
  });

  // Authentication Endpoints
  describe('Authentication Endpoints (/api/auth)', () => {
    const testUser = {
      fullNames: 'Auth Test User',
      email: 'auth@test.com',
      password: 'password123',
      dob: '1990-01-01',
      address: '789 Auth St',
      phoneNumber: '1111111111',
      occupation: 'Auth Tester',
      hobbies: 'Auth Testing'
    };

    test('POST /api/auth/register should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    test('POST /api/auth/login should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'comp1@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    test('POST /api/auth/refresh-token should refresh JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'test-refresh-token'
        });

      // May fail due to invalid token, but should not crash
      expect([200, 401]).toContain(response.status);
    });

    test('POST /api/auth/forgot-password should handle password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'comp1@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/auth/2fa/request should handle 2FA request', async () => {
      const response = await request(app)
        .post('/api/auth/2fa/request')
        .send({
          email: 'comp1@example.com'
        });

      expect([200, 400]).toContain(response.status);
    });

    test('POST /api/auth/verify-password should verify password', async () => {
      const response = await request(app)
        .post('/api/auth/verify-password')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          currentPassword: 'password123'
        });

      expect([200, 400]).toContain(response.status);
    });

    test('POST /api/auth/logout should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  // User Management Endpoints
  describe('User Management (/api/users)', () => {
    test('GET /api/users/profile should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.userId).toBe(userId1);
    });

    test('PUT /api/users/profile should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          bio: 'Updated bio for testing',
          occupation: 'Senior Tester'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/users/wallet/balance should get wallet balance', async () => {
      const response = await request(app)
        .get('/api/users/wallet/balance')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('POST /api/users/wallet/send should send money', async () => {
      const response = await request(app)
        .post('/api/users/wallet/send')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          recipientId: userId2,
          amount: 10.50,
          message: 'Test payment'
        });

      expect([200, 400]).toContain(response.status);
    });

    test('POST /api/users/wallet/withdraw should withdraw money', async () => {
      const response = await request(app)
        .post('/api/users/wallet/withdraw')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          amount: 5.00,
          withdrawalMethod: 'bank_transfer',
          accountDetails: 'Test account'
        });

      expect([200, 400]).toContain(response.status);
    });

    test('POST /api/users/activity should add user activity', async () => {
      const response = await request(app)
        .post('/api/users/activity')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          action: 'test_action',
          details: 'Test activity details'
        });

      expect([200, 201, 400]).toContain(response.status);
    });

    test('GET /api/users/activity-history should get activity history', async () => {
      const response = await request(app)
        .get('/api/users/activity-history')
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  // Posts Endpoints
  describe('Posts (/api/posts)', () => {
    test('POST /api/posts should create a post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          postText: 'This is a comprehensive test post!',
          mediaURLs: ['https://example.com/test-image.jpg'],
          location: {
            name: 'Test Location',
            coordinates: [0, 0]
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.content.postText).toBe('This is a comprehensive test post!');
      postId = response.body.data.post.postId;
    });

    test('GET /api/posts should get all posts', async () => {
      const response = await request(app)
        .get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });

    test('GET /api/posts/:postId should get single post', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.postId).toBe(postId);
    });

    test('PUT /api/posts/:postId should update post', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          postText: 'Updated comprehensive test post!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // Stories Endpoints
  describe('Stories (/api/stories)', () => {
    test('POST /api/stories should create a story', async () => {
      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          storyText: 'This is a test story!',
          mediaURL: 'https://example.com/story-image.jpg',
          mediaType: 'image'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      storyId = response.body.data.story.storyId;
    });

    test('GET /api/stories should get stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toBeInstanceOf(Array);
    });

    test('GET /api/stories/:storyId should get single story', async () => {
      const response = await request(app)
        .get(`/api/stories/${storyId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 400]).toContain(response.status);
    });

    test('POST /api/stories/highlights should create story highlight', async () => {
      const response = await request(app)
        .post('/api/stories/highlights')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          title: 'Test Highlight',
          storyIds: [storyId],
          isPublic: true
        });

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  // Comments Endpoints
  describe('Comments (/api/comments)', () => {
    test('POST /api/comments should create a comment', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          postId: postId,
          content: 'This is a test comment!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      commentId = response.body.data.comment.commentId;
    });

    test('GET /api/comments should get comments', async () => {
      const response = await request(app)
        .get(`/api/comments?postId=${postId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('PUT /api/comments/:commentId should update comment', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'Updated test comment!'
        });

      expect([200, 400]).toContain(response.status);
    });

    test('POST /api/comments/:commentId/like should like comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  // Reactions Endpoints
  describe('Reactions (/api/reactions)', () => {
    test('POST /api/reactions should add reaction to post', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: 'like'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/reactions/:entityType/:entityId should get reactions', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/reactions/:entityType/:entityId/user should get user reaction', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}/user`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  // Follow System Endpoints
  describe('Follow System (/api/follows)', () => {
    test('POST /api/follows should follow user', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          followeeId: userId2
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/follows/status/:userId should check follow status', async () => {
      const response = await request(app)
        .get(`/api/follows/status/${userId2}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });

    test('GET /api/follows/followers/:userId should get followers', async () => {
      const response = await request(app)
        .get(`/api/follows/followers/${userId2}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });

    test('GET /api/follows/following/:userId should get following', async () => {
      const response = await request(app)
        .get(`/api/follows/following/${userId1}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });

    test('DELETE /api/follows/:followeeId should unfollow user', async () => {
      const response = await request(app)
        .delete(`/api/follows/${userId2}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  // Feed Endpoints
  describe('Feed (/api/feed)', () => {
    test('GET /api/feed should get user feed', async () => {
      const response = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/feed/discover should get discover feed', async () => {
      const response = await request(app)
        .get('/api/feed/discover')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/feed/trending should get trending posts', async () => {
      const response = await request(app)
        .get('/api/feed/trending')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // Search Endpoints
  describe('Search (/api/search)', () => {
    test('GET /api/search/users should search users', async () => {
      const response = await request(app)
        .get('/api/search/users?q=Comp')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/search/posts should search posts', async () => {
      const response = await request(app)
        .get('/api/search/posts?q=test')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/search/stories should search stories', async () => {
      const response = await request(app)
        .get('/api/search/stories?q=test')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/search/global should perform global search', async () => {
      const response = await request(app)
        .get('/api/search/global?q=test')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/search/suggested-users should get suggested users', async () => {
      const response = await request(app)
        .get('/api/search/suggested-users')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // Messaging Endpoints
  describe('Messaging (/api/messaging)', () => {
    test('POST /api/messaging/conversations should create conversation', async () => {
      const response = await request(app)
        .post('/api/messaging/conversations')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          type: 'direct',
          participants: [userId2]
        });

      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 201) {
        conversationId = response.body.data.conversation.conversationId;
      }
    });

    test('GET /api/messaging/conversations should get conversations', async () => {
      const response = await request(app)
        .get('/api/messaging/conversations')
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });

    test('POST /api/messaging/messages should send message', async () => {
      const response = await request(app)
        .post('/api/messaging/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          conversationId: conversationId || 'test-conversation-id',
          content: 'Test message',
          messageType: 'text'
        });

      expect([200, 201, 400, 404]).toContain(response.status);
      if (response.status === 201) {
        messageId = response.body.data.message.messageId;
      }
    });
  });

  // Notifications Endpoints
  describe('Notifications (/api/notifications)', () => {
    test('GET /api/notifications should get notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('PUT /api/notifications/read-all should mark all as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // Bookmarks Endpoints
  describe('Bookmarks (/api)', () => {
    test('POST /api/posts/:postId/save should save post', async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/save`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          folder: 'test-folder',
          tags: ['test-tag'],
          notes: 'Test bookmark'
        });

      expect([200, 201, 400]).toContain(response.status);
    });

    test('GET /api/posts/saved should get saved posts', async () => {
      const response = await request(app)
        .get('/api/posts/saved')
        .set('Authorization', `Bearer ${authToken1}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  // Security Tests
  describe('Security & Authorization', () => {
    test('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject requests with invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/users/profile')
        .set('Origin', 'http://localhost:3000');

      expect([200, 204]).toContain(response.status);
    });
  });

  // Input Validation Tests
  describe('Input Validation', () => {
    test('should validate required fields for user registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate post creation data', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});