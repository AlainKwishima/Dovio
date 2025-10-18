import PostShare from '../models/PostShare.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { generateShareId } from '../utils/uuid.js';

export const sharePost = async (req, res) => {
  try {
    const { originalPostId, shareText } = req.body;
    const userId = req.user.userId;

    // Check if original post exists
    const originalPost = await Post.findOne({ postId: originalPostId });
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found'
      });
    }

    // Allow sharing own posts (removed restriction)

    const shareId = generateShareId();
    const share = new PostShare({
      shareId,
      originalPostId,
      sharedByUserId: userId,
      shareText: shareText || ''
    });

    await share.save();

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Shared post at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    // Populate sharer and original post details
    const populatedShare = await PostShare.findById(share._id)
      .populate({ path: 'sharer', select: 'fullNames profilePictureURL userId' })
      .populate({ 
        path: 'originalPost', 
        populate: { path: 'author', select: 'fullNames profilePictureURL userId' }
      });

    res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      data: { share: populatedShare }
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share post',
      error: error.message
    });
  }
};

export const getSharedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (userId) {
      query.sharedByUserId = userId;
    }

    const shares = await PostShare.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'sharer', select: 'fullNames profilePictureURL userId' })
      .populate({ 
        path: 'originalPost', 
        populate: { path: 'author', select: 'fullNames profilePictureURL userId' }
      });

    const totalShares = await PostShare.countDocuments(query);

    res.json({
      success: true,
      data: {
        shares,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalShares / parseInt(limit)),
          totalShares,
          hasNextPage: skip + parseInt(limit) < totalShares,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get shared posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shared posts',
      error: error.message
    });
  }
};

export const getPostShares = async (req, res) => {
  try {
    const { postId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const shares = await PostShare.find({ originalPostId: postId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'sharer', select: 'fullNames profilePictureURL userId' });

    const totalShares = await PostShare.countDocuments({ originalPostId: postId });

    res.json({
      success: true,
      data: {
        shares,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalShares / parseInt(limit)),
          totalShares,
          hasNextPage: skip + parseInt(limit) < totalShares,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get post shares error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post shares',
      error: error.message
    });
  }
};

export const deleteShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.userId;

    const share = await PostShare.findOne({ shareId });
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    // Check if user is the owner of the share
    if (share.sharedByUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this share'
      });
    }

    await PostShare.findOneAndDelete({ shareId });

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Deleted share at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Share deleted successfully'
    });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete share',
      error: error.message
    });
  }
};

