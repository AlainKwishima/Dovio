import request from 'supertest';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Story from '../src/models/Story.js';
import Comment from '../src/models/Comment.js';
import Reaction from '../src/models/Reaction.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('Backend Features Test Suite', () => {
  let authToken;
  let userId;
  let postId;
  let storyId;
  let commentId;

  beforeAll(async () => {
    // Create test user
    const user = new User({
      userId: 'test-user-features',
      fullNames: 'Test User Features',
      email: 'testfeatures@example.com',
      password: 'hashedpassword',
      dob: new Date('1990-01-01'),
      address: '123 Test St',
      phoneNumber: '1234567890',
      occupation: 'Tester',
      hobbies: 'Testing'
    });
    await user.save();

    userId = user.userId;
    authToken = generateAccessToken({ userId: user.userId, email: user.email });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ userId: 'test-user-features' });
    await Post.deleteMany({});
    await Story.deleteMany({});
    await Comment.deleteMany({});
    await Reaction.deleteMany({});
  });

  describe('Core Features', () => {
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
  });

  describe('Reaction System', () => {
    test('should add like reaction to post', async () => {
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

    test('should add love reaction to story', async () => {
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

    test('should add laugh reaction to comment', async () => {
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

    test('should get reactions for post', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactions).toBeInstanceOf(Array);
      expect(response.body.data.reactionCounts).toBeDefined();
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

    test('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('User Profile', () => {
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

  describe('Wallet Features', () => {
    test('should get wallet balance', async () => {
      const response = await request(app)
        .get('/api/users/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.walletBalance).toBeDefined();
    });

    test('should send money', async () => {
      // Create a second user for the test
      const user2 = new User({
        userId: 'test-user-2-wallet',
        fullNames: 'Test User 2 Wallet',
        email: 'test2wallet@example.com',
        password: 'hashedpassword',
        dob: new Date('1990-01-01'),
        address: '456 Test Ave',
        phoneNumber: '0987654321',
        occupation: 'Developer',
        hobbies: 'Coding'
      });
      await user2.save();

      // First, add some balance to user
      const user = await User.findOne({ userId });
      user.walletBalance = 100;
      await user.save();

      const response = await request(app)
        .post('/api/users/wallet/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: user2.userId,
          amount: 50,
          message: 'Test payment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Clean up
      await User.deleteOne({ userId: user2.userId });
    });
  });
});
