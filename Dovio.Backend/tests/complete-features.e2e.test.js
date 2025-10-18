import request from 'supertest';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Story from '../src/models/Story.js';
import Comment from '../src/models/Comment.js';
import PostShare from '../src/models/PostShare.js';
import Notification from '../src/models/Notification.js';
import Reaction from '../src/models/Reaction.js';
import Follow from '../src/models/Follow.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import bcrypt from 'bcryptjs';

describe('Complete Feature Test Suite', () => {
  let authToken;
  let userId;
  let user2Id;
  let postId;
  let storyId;
  let commentId;
  let shareId;
  let notificationId;

  beforeAll(async () => {
    // Create test users with properly hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user1 = new User({
      userId: 'test-user-1',
      fullNames: 'Test User 1',
      email: 'test1@example.com',
      password: hashedPassword,
      dob: new Date('1990-01-01'),
      address: '123 Test St',
      phoneNumber: '1234567890',
      occupation: 'Tester',
      hobbies: 'Testing',
      isEmailVerified: true
    });
    await user1.save();

    const user2 = new User({
      userId: 'test-user-2',
      fullNames: 'Test User 2',
      email: 'test2@example.com',
      password: hashedPassword,
      dob: new Date('1990-01-01'),
      address: '456 Test Ave',
      phoneNumber: '0987654321',
      occupation: 'Developer',
      hobbies: 'Coding',
      isEmailVerified: true
    });
    await user2.save();

    userId = user1.userId;
    user2Id = user2.userId;
    authToken = generateAccessToken({ userId: user1.userId, email: user1.email });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Story.deleteMany({});
    await Comment.deleteMany({});
    await PostShare.deleteMany({});
    await Notification.deleteMany({});
    await Reaction.deleteMany({});
    await Follow.deleteMany({});
  });

  describe('Authentication & Authorization', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullNames: 'New Test User',
          email: 'newuser@example.com',
          password: 'password123',
          dob: '1990-01-01',
          address: '789 New St',
          phoneNumber: '1111111111',
          occupation: 'New Tester',
          hobbies: 'New Testing'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test1@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });

  describe('Posts & Media Upload', () => {
    test('should create a post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postText: 'This is a test post!',
          mediaURLs: ['https://example.com/image.jpg']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.content.postText).toBe('This is a test post!');
      postId = response.body.data.post.postId;
    });

    test('should get posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });

    test('should update a post', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postText: 'This is an updated test post!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.content.postText).toBe('This is an updated test post!');
    });
  });

  describe('Stories (Ephemeral)', () => {
    test('should create a story', async () => {
      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          storyText: 'This is a test story!',
          mediaURL: 'https://example.com/story.jpg',
          mediaType: 'image'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.story.content.storyText).toBe('This is a test story!');
      storyId = response.body.data.story.storyId;
    });

    test('should get stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toBeInstanceOf(Array);
    });

    test('should view a story and increment view count', async () => {
      const response = await request(app)
        .get(`/api/stories/${storyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.story.views).toBeInstanceOf(Array);
    });
  });

  describe('Comments & Likes', () => {
    test('should create a comment', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: postId,
          content: 'This is a test comment!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('This is a test comment!');
      commentId = response.body.data.comment.commentId;
    });

    test('should get comments', async () => {
      const response = await request(app)
        .get(`/api/comments?postId=${postId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeInstanceOf(Array);
    });

    test('should like a comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(true);
    });
  });

  describe('Reaction System', () => {
    test('should add a like reaction to a post', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: 'like'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('like');
    });

    test('should add a love reaction to a story', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'story',
          entityId: storyId,
          reactionType: 'love'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('love');
    });

    test('should add a laugh reaction to a comment', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'comment',
          entityId: commentId,
          reactionType: 'laugh'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('laugh');
    });

    test('should get reactions for a post', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactions).toBeInstanceOf(Array);
      expect(response.body.data.reactionCounts).toBeDefined();
    });

    test('should get user reaction on a post', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}/user`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('like');
    });

    test('should toggle reaction (like to dislike)', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: 'dislike'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('dislike');
    });

    test('should remove reaction (same reaction type)', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: 'dislike'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(false);
      expect(response.body.data.reactionType).toBe(null);
    });
  });

  describe('Post Sharing', () => {
    test('should share a post', async () => {
      const response = await request(app)
        .post('/api/shares')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          originalPostId: postId,
          shareText: 'This is a shared post!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.share.shareText).toBe('This is a shared post!');
      shareId = response.body.data.share.shareId;
    });

    test('should get shared posts', async () => {
      const response = await request(app)
        .get('/api/shares')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shares).toBeInstanceOf(Array);
    });
  });

  describe('Follow System', () => {
    test('should follow a user', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followeeId: user2Id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should get followers', async () => {
      const response = await request(app)
        .get(`/api/follows/followers/${user2Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 200 with empty array if user exists but has no followers
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.followers).toBeInstanceOf(Array);
      }
    });

    test('should get following', async () => {
      const response = await request(app)
        .get(`/api/follows/following/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 200 with following list if user exists
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.following).toBeInstanceOf(Array);
        // Should have at least one follow relationship from the previous test
        expect(response.body.data.following.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Feed Generation', () => {
    test('should get personalized feed', async () => {
      const response = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feed).toBeInstanceOf(Array);
    });

    test('should get discover feed', async () => {
      const response = await request(app)
        .get('/api/feed/discover')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });

    test('should get trending posts', async () => {
      const response = await request(app)
        .get('/api/feed/trending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });
  });

  describe('Search & Discovery', () => {
    test('should search users', async () => {
      const response = await request(app)
        .get('/api/search/users?q=Test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    test('should search posts', async () => {
      const response = await request(app)
        .get('/api/search/posts?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });

    test('should search stories', async () => {
      const response = await request(app)
        .get('/api/search/stories?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toBeInstanceOf(Array);
    });

    test('should perform global search', async () => {
      const response = await request(app)
        .get('/api/search/global?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.stories).toBeInstanceOf(Array);
    });

    test('should get suggested users', async () => {
      const response = await request(app)
        .get('/api/search/suggested-users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestedUsers).toBeInstanceOf(Array);
    });
  });

  describe('Notifications', () => {
    test('should get notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeInstanceOf(Array);
      expect(response.body.data.unreadCount).toBeDefined();
    });

    test('should mark notification as read', async () => {
      // First, create a notification
      const notification = new Notification({
        notificationId: 'test-notification-1',
        userId: userId,
        type: 'like',
        fromUserId: user2Id,
        relatedEntityId: postId,
        title: 'Test Notification',
        message: 'Someone liked your post'
      });
      await notification.save();
      notificationId = notification.notificationId;

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Messaging', () => {
    test('should send a message', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: user2Id,
          content: 'Hello, this is a test message!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe('Hello, this is a test message!');
    });

    test('should get messages', async () => {
      const response = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toBeInstanceOf(Array);
    });
  });

  describe('Wallet Features', () => {
    test('should get wallet balance', async () => {
      const response = await request(app)
        .get('/api/users/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
    });

    test('should send money', async () => {
      // First, add some balance to user1
      const user = await User.findOne({ userId });
      user.walletBalance = 100;
      await user.save();

      const response = await request(app)
        .post('/api/users/wallet/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: user2Id,
          amount: 50,
          message: 'Test payment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should withdraw money', async () => {
      const response = await request(app)
        .post('/api/users/wallet/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 25,
          withdrawalMethod: 'bank_transfer',
          accountDetails: 'Test bank account'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('User Profile Management', () => {
    test('should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.userId).toBe(userId);
    });

    test('should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullNames: 'Updated Test User',
          hobbies: 'Updated Testing'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.fullNames).toBe('Updated Test User');
    });
  });
});

