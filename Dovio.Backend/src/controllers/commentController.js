import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { generateCommentId } from '../utils/uuid.js';
import { createNotification } from './notificationController.js';

export const createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // If replying to a comment, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findOne({ commentId: parentCommentId });
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const commentId = generateCommentId();
    const comment = new Comment({
      commentId,
      postId,
      userId,
      content,
      parentCommentId: parentCommentId || null
    });

    await comment.save();

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Commented on post at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    // Create notification for post author (if not commenting on own post)
    if (post.userId !== userId) {
      await createNotification(
        post.userId,
        'comment',
        userId,
        postId,
        'New Comment',
        `${user.fullNames} commented on your post`
      );
    }

    // Populate author details
    const populatedComment = await Comment.findById(comment._id)
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment: populatedComment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    // Get top-level comments (no parent)
    const comments = await Comment.find({ postId, parentCommentId: null })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' })
      .populate({ 
        path: 'replies', 
        options: { sort: { timestamp: 1 }, limit: 5 },
        populate: { path: 'author', select: 'fullNames profilePictureURL userId' }
      });

    const totalComments = await Comment.countDocuments({ postId, parentCommentId: null });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / parseInt(limit)),
          totalComments,
          hasNextPage: skip + parseInt(limit) < totalComments,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: error.message
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await Comment.findOne({ commentId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the owner
    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    const updatedComment = await Comment.findOneAndUpdate(
      { commentId },
      { content },
      { new: true, runValidators: true }
    ).populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Updated comment at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment: updatedComment }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findOne({ commentId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the owner
    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({ 
      $or: [
        { commentId },
        { parentCommentId: commentId }
      ]
    });

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Deleted comment at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findOne({ commentId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked this comment
    const existingLike = comment.likes.find(like => like.userId === userId);
    
    if (existingLike) {
      // Unlike the comment
      comment.likes = comment.likes.filter(like => like.userId !== userId);
      await comment.save();
      
      res.json({
        success: true,
        message: 'Comment unliked successfully',
        data: { liked: false, likeCount: comment.likes.length }
      });
    } else {
      // Like the comment
      comment.likes.push({ userId, likedAt: new Date() });
      await comment.save();
      
      // Create notification for comment author (if not liking own comment)
      if (comment.userId !== userId) {
        const liker = await User.findOne({ userId });
        await createNotification(
          comment.userId,
          'like',
          userId,
          commentId,
          'Comment Liked',
          `${liker.fullNames} liked your comment`
        );
      }
      
      res.json({
        success: true,
        message: 'Comment liked successfully',
        data: { liked: true, likeCount: comment.likes.length }
      });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike comment',
      error: error.message
    });
  }
};

export const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10, sortBy = 'timestamp' } = req.query;
    const userId = req.user.userId;

    // Check if parent comment exists
    const parentComment = await Comment.findOne({ commentId });
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sortBy === 'popularity' ? { 'likes': -1, timestamp: -1 } : { timestamp: 1 };

    // Get replies with aggregation pipeline for better performance
    const replies = await Comment.aggregate([
      { $match: { parentCommentId: commentId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'userId',
          as: 'author',
          pipeline: [
            { $project: { fullNames: 1, profilePictureURL: 1, userId: 1 } }
          ]
        }
      },
      { $unwind: '$author' },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          isLikedByUser: {
            $in: [userId, '$likes.userId']
          }
        }
      },
      { $sort: sortOrder },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          commentId: 1,
          content: 1,
          timestamp: 1,
          likeCount: 1,
          isLikedByUser: 1,
          author: 1,
          parentCommentId: 1
        }
      }
    ]);

    // Get total count for pagination
    const totalReplies = await Comment.countDocuments({ parentCommentId: commentId });

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReplies / parseInt(limit)),
          totalReplies,
          hasNextPage: skip + replies.length < totalReplies,
          hasPrevPage: parseInt(page) > 1
        },
        parentComment: {
          commentId: parentComment.commentId,
          content: parentComment.content,
          timestamp: parentComment.timestamp
        }
      }
    });
  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comment replies',
      error: error.message
    });
  }
};
