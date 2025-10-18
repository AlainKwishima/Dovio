import Bookmark from '../models/Bookmark.js';
import PostTag from '../models/PostTag.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import { generateBookmarkId, generateTagId } from '../utils/uuid.js';
import { createNotification } from './notificationController.js';

export const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { folder = 'default', tags = [], notes } = req.body;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({ userId, postId });
    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'Post already bookmarked'
      });
    }

    const bookmarkId = generateBookmarkId();
    const bookmark = new Bookmark({
      bookmarkId,
      userId,
      postId,
      folder,
      tags,
      notes
    });

    await bookmark.save();

    res.status(201).json({
      success: true,
      message: 'Post saved successfully',
      data: { bookmark }
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save post',
      error: error.message
    });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, folder, tag } = req.query;
    const userId = req.user.userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { userId };

    if (folder) query.folder = folder;
    if (tag) query.tags = { $in: [tag] };

    const bookmarks = await Bookmark.find(query)
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'fullNames profilePictureURL userId'
        }
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookmarks = await Bookmark.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookmarks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBookmarks / parseInt(limit)),
          totalBookmarks,
          hasNextPage: skip + bookmarks.length < totalBookmarks,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved posts',
      error: error.message
    });
  }
};

export const removeSavedPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const bookmark = await Bookmark.findOneAndDelete({ userId, postId });
    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.json({
      success: true,
      message: 'Post removed from saved posts'
    });
  } catch (error) {
    console.error('Remove saved post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved post',
      error: error.message
    });
  }
};

export const tagUserInPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { taggedUserId, position } = req.body;
    const taggedByUserId = req.user.userId;

    // Check if post exists
    const post = await Post.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if tagged user exists
    const taggedUser = await User.findOne({ userId: taggedUserId });
    if (!taggedUser) {
      return res.status(404).json({
        success: false,
        message: 'Tagged user not found'
      });
    }

    // Check if user is already tagged in this post
    const existingTag = await PostTag.findOne({ postId, taggedUserId });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'User already tagged in this post'
      });
    }

    // Check user privacy settings for tag approval
    const userSettings = await UserSettings.findOne({ userId: taggedUserId });
    const requiresApproval = userSettings?.privacy?.tagApproval ?? true;

    const tagId = generateTagId();
    const postTag = new PostTag({
      tagId,
      postId,
      taggedUserId,
      taggedByUserId,
      position,
      approved: !requiresApproval
    });

    await postTag.save();

    // Create notification for tagged user
    if (taggedUserId !== taggedByUserId) {
      const tagger = await User.findOne({ userId: taggedByUserId });
      await createNotification(
        taggedUserId,
        'tag',
        taggedByUserId,
        postId,
        'You were tagged in a post',
        `${tagger.fullNames} tagged you in a post`
      );
    }

    res.status(201).json({
      success: true,
      message: requiresApproval ? 'User tagged successfully. Tag requires approval.' : 'User tagged successfully',
      data: { postTag }
    });
  } catch (error) {
    console.error('Tag user in post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to tag user in post',
      error: error.message
    });
  }
};

export const getPostTags = async (req, res) => {
  try {
    const { postId } = req.params;

    const tags = await PostTag.find({ postId, approved: true })
      .populate('taggedUser', 'userId fullNames profilePictureURL')
      .sort({ timestamp: 1 });

    res.json({
      success: true,
      data: { tags }
    });
  } catch (error) {
    console.error('Get post tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post tags',
      error: error.message
    });
  }
};

export const approveTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user.userId;

    const tag = await PostTag.findOne({ tagId, taggedUserId: userId });
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    tag.approved = true;
    await tag.save();

    res.json({
      success: true,
      message: 'Tag approved successfully'
    });
  } catch (error) {
    console.error('Approve tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve tag',
      error: error.message
    });
  }
};

export const rejectTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user.userId;

    const tag = await PostTag.findOneAndDelete({ tagId, taggedUserId: userId });
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      message: 'Tag rejected successfully'
    });
  } catch (error) {
    console.error('Reject tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject tag',
      error: error.message
    });
  }
};

export const getPendingTags = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pendingTags = await PostTag.find({ taggedUserId: userId, approved: false })
      .populate('post', 'postId content')
      .populate('taggedByUser', 'userId fullNames profilePictureURL')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: { pendingTags }
    });
  } catch (error) {
    console.error('Get pending tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending tags',
      error: error.message
    });
  }
};
