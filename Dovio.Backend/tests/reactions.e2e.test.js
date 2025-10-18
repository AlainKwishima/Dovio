import request from 'supertest';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Story from '../src/models/Story.js';
import Comment from '../src/models/Comment.js';
import Reaction from '../src/models/Reaction.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('Reaction System Tests', () => {
  let authToken;
  let userId;
  let postId;
  let storyId;
  let commentId;

  beforeAll(async () => {
    // Create test user
    const user = new User({
      userId: 'reaction-test-user',
      fullNames: 'Reaction Test User',
      email: 'reaction@example.com',
      password: 'hashedpassword',
      dob: new Date('1990-01-01'),
      address: '123 Reaction St',
      phoneNumber: '1234567890',
      occupation: 'Reaction Tester',
      hobbies: 'Testing Reactions'
    });
    await user.save();

    userId = user.userId;
    authToken = generateAccessToken({ userId: user.userId, email: user.email });

    // Create test post
    const post = new Post({
      postId: 'reaction-test-post',
      userId: userId,
      content: {
        postText: 'This is a test post for reactions!',
        mediaURLs: []
      }
    });
    await post.save();
    postId = post.postId;

    // Create test story
    const story = new Story({
      storyId: 'reaction-test-story',
      userId: userId,
      content: {
        storyText: 'This is a test story for reactions!',
        mediaURL: '',
        mediaType: 'text'
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await story.save();
    storyId = story.storyId;

    // Create test comment
    const comment = new Comment({
      commentId: 'reaction-test-comment',
      postId: postId,
      userId: userId,
      content: 'This is a test comment for reactions!'
    });
    await comment.save();
    commentId = comment.commentId;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ userId: 'reaction-test-user' });
    await Post.deleteMany({ postId: 'reaction-test-post' });
    await Story.deleteMany({ storyId: 'reaction-test-story' });
    await Comment.deleteMany({ commentId: 'reaction-test-comment' });
    await Reaction.deleteMany({});
  });

  describe('Post Reactions', () => {
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
      expect(response.body.data.reactionCounts.like).toBe(1);
    });

    test('should add love reaction to post', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: 'love'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('love');
      expect(response.body.data.reactionCounts.love).toBe(1);
    });

    test('should get post reactions', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactions).toBeInstanceOf(Array);
      expect(response.body.data.reactions.length).toBe(1);
      expect(response.body.data.reactionCounts.love).toBe(1);
    });

    test('should get user reaction on post', async () => {
      const response = await request(app)
        .get(`/api/reactions/post/${postId}/user`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('love');
    });
  });

  describe('Story Reactions', () => {
    test('should add laugh reaction to story', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'story',
          entityId: storyId,
          reactionType: 'laugh'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('laugh');
      expect(response.body.data.reactionCounts.laugh).toBe(1);
    });

    test('should get story reactions', async () => {
      const response = await request(app)
        .get(`/api/reactions/story/${storyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactions).toBeInstanceOf(Array);
      expect(response.body.data.reactions.length).toBe(1);
      expect(response.body.data.reactionCounts.laugh).toBe(1);
    });
  });

  describe('Comment Reactions', () => {
    test('should add angry reaction to comment', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'comment',
          entityId: commentId,
          reactionType: 'angry'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('angry');
      expect(response.body.data.reactionCounts.angry).toBe(1);
    });

    test('should get comment reactions', async () => {
      const response = await request(app)
        .get(`/api/reactions/comment/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactions).toBeInstanceOf(Array);
      expect(response.body.data.reactions.length).toBe(1);
      expect(response.body.data.reactionCounts.angry).toBe(1);
    });
  });

  describe('Reaction Toggle and Removal', () => {
    test('should toggle reaction (angry to sad)', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'comment',
          entityId: commentId,
          reactionType: 'sad'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe('sad');
      expect(response.body.data.reactionCounts.sad).toBe(1);
      expect(response.body.data.reactionCounts.angry).toBe(0);
    });

    test('should remove reaction (same reaction type)', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'comment',
          entityId: commentId,
          reactionType: 'sad'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(false);
      expect(response.body.data.reactionType).toBe(null);
      expect(response.body.data.reactionCounts.sad).toBe(0);
    });
  });

  describe('All Emoji Reactions', () => {
    const emojis = ['like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'];

    test.each(emojis)('should support %s reaction', async (emoji) => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: emoji
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reacted).toBe(true);
      expect(response.body.data.reactionType).toBe(emoji);
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for invalid entity type', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'invalid',
          entityId: postId,
          reactionType: 'like'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid reaction type', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: postId,
          reactionType: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent entity', async () => {
      const response = await request(app)
        .post('/api/reactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'post',
          entityId: 'non-existent-id',
          reactionType: 'like'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Pagination', () => {
    test('should support pagination for reactions', async () => {
      // Add multiple reactions to test pagination
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/reactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            entityType: 'post',
            entityId: postId,
            reactionType: 'like'
          });
      }

      const response = await request(app)
        .get(`/api/reactions/post/${postId}?page=1&limit=3`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactions.length).toBeLessThanOrEqual(3);
      expect(response.body.data.pagination).toBeDefined();
    });
  });
});

