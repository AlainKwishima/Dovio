import request from 'supertest';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Story from '../src/models/Story.js';
import Notification from '../src/models/Notification.js';
import Follow from '../src/models/Follow.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('New Features Tests (Feed, Notifications, Search)', () => {
  let authToken1, authToken2;
  let userId1, userId2;
  let postId1, postId2;
  let storyId1, storyId2;

  beforeAll(async () => {
    // Create test users
    const user1 = new User({
      userId: 'feed-test-user-1',
      fullNames: 'Feed Test User 1',
      email: 'feed1@example.com',
      password: 'hashedpassword',
      dob: new Date('1990-01-01'),
      address: '123 Feed St',
      phoneNumber: '1111111111',
      occupation: 'Feed Tester',
      hobbies: 'Testing Feeds'
    });
    await user1.save();

    const user2 = new User({
      userId: 'feed-test-user-2',
      fullNames: 'Feed Test User 2',
      email: 'feed2@example.com',
      password: 'hashedpassword',
      dob: new Date('1990-01-01'),
      address: '456 Feed Ave',
      phoneNumber: '2222222222',
      occupation: 'Search Tester',
      hobbies: 'Testing Search'
    });
    await user2.save();

    userId1 = user1.userId;
    userId2 = user2.userId;
    authToken1 = generateAccessToken({ userId: user1.userId, email: user1.email });
    authToken2 = generateAccessToken({ userId: user2.userId, email: user2.email });

    // Create follow relationship
    const follow = new Follow({
      followerId: userId1,
      followeeId: userId2
    });
    await follow.save();

    // Create test posts
    const post1 = new Post({
      postId: 'feed-test-post-1',
      userId: userId1,
      content: {
        postText: 'This is a test post from user 1!',
        mediaURLs: []
      }
    });
    await post1.save();
    postId1 = post1.postId;

    const post2 = new Post({
      postId: 'feed-test-post-2',
      userId: userId2,
      content: {
        postText: 'This is a test post from user 2!',
        mediaURLs: []
      }
    });
    await post2.save();
    postId2 = post2.postId;

    // Create test stories
    const story1 = new Story({
      storyId: 'feed-test-story-1',
      userId: userId1,
      content: {
        storyText: 'This is a test story from user 1!',
        mediaURL: '',
        mediaType: 'text'
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await story1.save();
    storyId1 = story1.storyId;

    const story2 = new Story({
      storyId: 'feed-test-story-2',
      userId: userId2,
      content: {
        storyText: 'This is a test story from user 2!',
        mediaURL: '',
        mediaType: 'text'
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await story2.save();
    storyId2 = story2.storyId;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ userId: { $in: ['feed-test-user-1', 'feed-test-user-2'] } });
    await Post.deleteMany({ postId: { $in: ['feed-test-post-1', 'feed-test-post-2'] } });
    await Story.deleteMany({ storyId: { $in: ['feed-test-story-1', 'feed-test-story-2'] } });
    await Notification.deleteMany({});
    await Follow.deleteMany({});
  });

  describe('Feed Generation', () => {
    test('should get personalized feed (posts and stories)', async () => {
      const response = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feed).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should get personalized feed (posts only)', async () => {
      const response = await request(app)
        .get('/api/feed?type=posts')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feed).toBeInstanceOf(Array);
      // All items should be posts
      response.body.data.feed.forEach(item => {
        expect(item.type).toBe('post');
      });
    });

    test('should get personalized feed (stories only)', async () => {
      const response = await request(app)
        .get('/api/feed?type=stories')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feed).toBeInstanceOf(Array);
      // All items should be stories
      response.body.data.feed.forEach(item => {
        expect(item.type).toBe('story');
      });
    });

    test('should get discover feed', async () => {
      const response = await request(app)
        .get('/api/feed/discover')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should get trending posts', async () => {
      const response = await request(app)
        .get('/api/feed/trending')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.timeframe).toBe('24h');
    });

    test('should get trending posts with custom timeframe', async () => {
      const response = await request(app)
        .get('/api/feed/trending?timeframe=7d')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.timeframe).toBe('7d');
    });
  });

  describe('Search & Discovery', () => {
    test('should search users by name', async () => {
      const response = await request(app)
        .get('/api/search/users?q=Feed Test')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.query).toBe('Feed Test');
    });

    test('should search users by occupation', async () => {
      const response = await request(app)
        .get('/api/search/users?q=Tester')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    test('should search posts by content', async () => {
      const response = await request(app)
        .get('/api/search/posts?q=test post')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.query).toBe('test post');
    });

    test('should search stories by content', async () => {
      const response = await request(app)
        .get('/api/search/stories?q=test story')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toBeInstanceOf(Array);
      expect(response.body.data.query).toBe('test story');
    });

    test('should perform global search', async () => {
      const response = await request(app)
        .get('/api/search/global?q=test')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.stories).toBeInstanceOf(Array);
      expect(response.body.data.totalResults).toBeDefined();
    });

    test('should get suggested users', async () => {
      const response = await request(app)
        .get('/api/search/suggested-users')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestedUsers).toBeInstanceOf(Array);
    });

    test('should return 400 for search query too short', async () => {
      const response = await request(app)
        .get('/api/search/users?q=a')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Notifications', () => {
    test('should get notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeInstanceOf(Array);
      expect(response.body.data.unreadCount).toBeDefined();
    });

    test('should get unread notifications only', async () => {
      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeInstanceOf(Array);
    });

    test('should mark notification as read', async () => {
      // Create a test notification
      const notification = new Notification({
        notificationId: 'test-notification-read',
        userId: userId2,
        type: 'follow',
        fromUserId: userId1,
        relatedEntityId: null,
        title: 'New Follower',
        message: 'Feed Test User 1 started following you'
      });
      await notification.save();

      const response = await request(app)
        .put(`/api/notifications/${notification.notificationId}/read`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should delete notification', async () => {
      // Create a test notification
      const notification = new Notification({
        notificationId: 'test-notification-delete',
        userId: userId2,
        type: 'like',
        fromUserId: userId1,
        relatedEntityId: postId1,
        title: 'Post Liked',
        message: 'Feed Test User 1 liked your post'
      });
      await notification.save();

      const response = await request(app)
        .delete(`/api/notifications/${notification.notificationId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/notifications/non-existent/read')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Pagination', () => {
    test('should support pagination for feed', async () => {
      const response = await request(app)
        .get('/api/feed?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeDefined();
    });

    test('should support pagination for search', async () => {
      const response = await request(app)
        .get('/api/search/posts?q=test&page=1&limit=5')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeDefined();
    });

    test('should support pagination for notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeDefined();
    });
  });
});

