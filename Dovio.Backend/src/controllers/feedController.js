import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';

export const getFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users that the current user follows
    const following = await Follow.find({ followerId: userId }).select('followeeId');
    const followingIds = following.map(f => f.followeeId);
    
    // Include the user's own posts/stories
    followingIds.push(userId);

    let feedItems = [];

    if (type === 'all' || type === 'posts') {
      // Get posts from followed users
      const posts = await Post.find({ userId: { $in: followingIds } })
        .sort({ timestamp: -1 })
        .skip(type === 'posts' ? skip : 0)
        .limit(type === 'posts' ? parseInt(limit) : parseInt(limit) / 2)
        .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

      feedItems.push(...posts.map(post => ({
        type: 'post',
        data: post,
        timestamp: post.timestamp
      })));
    }

    if (type === 'all' || type === 'stories') {
      // Get stories from followed users (only non-expired)
      const stories = await Story.find({ 
        userId: { $in: followingIds },
        expiresAt: { $gt: new Date() }
      })
        .sort({ timestamp: -1 })
        .skip(type === 'stories' ? skip : 0)
        .limit(type === 'stories' ? parseInt(limit) : parseInt(limit) / 2)
        .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

      feedItems.push(...stories.map(story => ({
        type: 'story',
        data: story,
        timestamp: story.timestamp
      })));
    }

    // Sort all feed items by timestamp
    feedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination to the combined feed
    const paginatedItems = feedItems.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        feed: paginatedItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(feedItems.length / parseInt(limit)),
          totalItems: feedItems.length,
          hasNextPage: skip + parseInt(limit) < feedItems.length,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feed',
      error: error.message
    });
  }
};

export const getDiscoverFeed = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    // Return mock discover feed only in dev and if unauthenticated
    if (isDev && !req.user) {
      return res.json({
        success: true,
        data: {
          posts: [
            {
              postId: 'mock-1',
              userId: 'mock-user-1',
              content: {
                postText: 'Explore amazing content on Dovio ✨',
                mediaURLs: ['https://picsum.photos/seed/dovio1/600/400'],
              },
              timestamp: new Date().toISOString(),
              author: { fullNames: 'Dovio Demo', profilePictureURL: 'https://i.pravatar.cc/150?img=5', userId: 'mock-user-1' }
            },
            {
              postId: 'mock-2',
              userId: 'mock-user-2',
              content: {
                postText: 'This is a placeholder post for demo/testing',
                mediaURLs: ['https://picsum.photos/seed/dovio2/600/400'],
              },
              timestamp: new Date().toISOString(),
              author: { fullNames: 'Demo Creator', profilePictureURL: 'https://i.pravatar.cc/150?img=12', userId: 'mock-user-2' }
            }
          ],
          pagination: { currentPage: 1, totalPages: 1, totalPosts: 2, hasNextPage: false, hasPrevPage: false }
        }
      });
    }
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users that the current user follows
    const following = await Follow.find({ followerId: userId }).select('followeeId');
    const followingIds = following.map(f => f.followeeId);
    followingIds.push(userId); // Exclude own posts

    // Get posts from users not followed (discovery)
    const posts = await Post.find({ 
      userId: { $nin: followingIds } 
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    const totalPosts = await Post.countDocuments({ 
      userId: { $nin: followingIds } 
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalPosts,
          hasNextPage: skip + parseInt(limit) < totalPosts,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get discover feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discover feed',
      error: error.message
    });
  }
};

export const getTrendingPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, timeframe = '24h' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Calculate time threshold based on timeframe
    let timeThreshold;
    switch (timeframe) {
      case '1h':
        timeThreshold = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        timeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get posts from the specified timeframe
    // Note: In a real app, you'd want to implement engagement metrics (likes, comments, shares)
    // For now, we'll use recent posts as a proxy for trending
    const posts = await Post.find({ 
      timestamp: { $gte: timeThreshold }
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    const totalPosts = await Post.countDocuments({ 
      timestamp: { $gte: timeThreshold }
    });

    res.json({
      success: true,
      data: {
        posts,
        timeframe,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalPosts,
          hasNextPage: skip + parseInt(limit) < totalPosts,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending posts',
      error: error.message
    });
  }
};

