import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Follow from '../models/Follow.js';
import Hashtag from '../models/Hashtag.js';
import { generateHashtagId } from '../utils/uuid.js';

export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const users = await User.find({
      $or: [
        { fullNames: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { occupation: { $regex: searchRegex } },
        { hobbies: { $regex: searchRegex } }
      ]
    })
      .select('userId fullNames profilePictureURL occupation hobbies')
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments({
      $or: [
        { fullNames: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { occupation: { $regex: searchRegex } },
        { hobbies: { $regex: searchRegex } }
      ]
    });

    res.json({
      success: true,
      data: {
        users,
        query: q,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers,
          hasNextPage: skip + parseInt(limit) < totalUsers,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
};

export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const posts = await Post.find({
      'content.postText': { $regex: searchRegex }
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    const totalPosts = await Post.countDocuments({
      'content.postText': { $regex: searchRegex }
    });

    res.json({
      success: true,
      data: {
        posts,
        query: q,
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
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search posts',
      error: error.message
    });
  }
};

export const searchStories = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const stories = await Story.find({
      $and: [
        { 'content.storyText': { $regex: searchRegex } },
        { expiresAt: { $gt: new Date() } } // Only non-expired stories
      ]
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    const totalStories = await Story.countDocuments({
      $and: [
        { 'content.storyText': { $regex: searchRegex } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.json({
      success: true,
      data: {
        stories,
        query: q,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalStories / parseInt(limit)),
          totalStories,
          hasNextPage: skip + parseInt(limit) < totalStories,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stories',
      error: error.message
    });
  }
};

export const globalSearch = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    // Search users
    const users = await User.find({
      $or: [
        { fullNames: { $regex: searchRegex } },
        { occupation: { $regex: searchRegex } },
        { hobbies: { $regex: searchRegex } }
      ]
    })
      .select('userId fullNames profilePictureURL occupation hobbies')
      .limit(5);

    // Search posts
    const posts = await Post.find({
      'content.postText': { $regex: searchRegex }
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    // Search stories (non-expired)
    const stories = await Story.find({
      $and: [
        { 'content.storyText': { $regex: searchRegex } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    res.json({
      success: true,
      data: {
        users,
        posts,
        stories,
        query: q,
        totalResults: users.length + posts.length + stories.length
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform global search',
      error: error.message
    });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    // Get users that the current user follows
    const following = await Follow.find({ followerId: userId }).select('followeeId');
    const followingIds = following.map(f => f.followeeId);
    followingIds.push(userId); // Exclude self

    // Get suggested users (users not followed by current user)
    const suggestedUsers = await User.find({
      userId: { $nin: followingIds }
    })
      .select('userId fullNames profilePictureURL occupation hobbies')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestedUsers
      }
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggested users',
      error: error.message
    });
  }
};

export const searchHashtags = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!tag || tag.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Hashtag must be at least 2 characters long'
      });
    }

    const hashtag = tag.toLowerCase().replace('#', '');
    
    // Update hashtag usage
    await Hashtag.findOneAndUpdate(
      { tag: hashtag },
      { 
        $inc: { postCount: 1 },
        $set: { lastUsed: new Date() }
      },
      { upsert: true, new: true }
    );

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'popular':
        sortCriteria = { 'reactions': -1, timestamp: -1 };
        break;
      case 'recent':
      default:
        sortCriteria = { timestamp: -1 };
        break;
    }

    const posts = await Post.find({ hashtags: hashtag })
      .populate('author', 'userId fullNames profilePictureURL')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments({ hashtags: hashtag });

    res.json({
      success: true,
      data: {
        hashtag,
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalPosts,
          hasNextPage: skip + posts.length < totalPosts,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search hashtags',
      error: error.message
    });
  }
};

export const getHashtagSuggestions = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 1 character long'
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const hashtags = await Hashtag.find({ tag: searchRegex })
      .sort({ postCount: -1, lastUsed: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        hashtags: hashtags.map(h => ({
          tag: h.tag,
          postCount: h.postCount,
          lastUsed: h.lastUsed
        }))
      }
    });
  } catch (error) {
    console.error('Get hashtag suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hashtag suggestions',
      error: error.message
    });
  }
};

export const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 20, timeframe = '24h' } = req.query;

    let timeFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        timeFilter = { lastUsed: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } };
        break;
      case '24h':
        timeFilter = { lastUsed: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        break;
      case '7d':
        timeFilter = { lastUsed: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        timeFilter = { lastUsed: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const hashtags = await Hashtag.find(timeFilter)
      .sort({ postCount: -1, trendingScore: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        hashtags,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending hashtags',
      error: error.message
    });
  }
};

export const searchByLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, page = 1, limit = 20, type = 'all' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxDistance = parseInt(radius) * 1000; // Convert km to meters

    const locationQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance
        }
      }
    };

    let results = {};

    if (type === 'all' || type === 'posts') {
      const posts = await Post.find(locationQuery)
        .populate('author', 'userId fullNames profilePictureURL')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalPosts = await Post.countDocuments(locationQuery);

      results.posts = {
        data: posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalPosts,
          hasNextPage: skip + posts.length < totalPosts,
          hasPrevPage: parseInt(page) > 1
        }
      };
    }

    if (type === 'all' || type === 'stories') {
      const stories = await Story.find(locationQuery)
        .populate('author', 'userId fullNames profilePictureURL')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalStories = await Story.countDocuments(locationQuery);

      results.stories = {
        data: stories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalStories / parseInt(limit)),
          totalStories,
          hasNextPage: skip + stories.length < totalStories,
          hasPrevPage: parseInt(page) > 1
        }
      };
    }

    res.json({
      success: true,
      data: {
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseInt(radius)
        },
        ...results
      }
    });
  } catch (error) {
    console.error('Search by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search by location',
      error: error.message
    });
  }
};

