import Reaction from '../models/Reaction.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { generateReactionId } from '../utils/uuid.js';
import { createNotification } from './notificationController.js';

export const addReaction = async (req, res) => {
  try {
    const { entityType, entityId, reactionType } = req.body;
    const userId = req.user.userId;

    // Validate entity type
    if (!['post', 'story', 'comment'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type. Must be post, story, or comment'
      });
    }

    // Validate reaction type
    if (!['like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'].includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    // Check if entity exists
    let entity;
    let entityAuthorId;
    
    switch (entityType) {
      case 'post':
        entity = await Post.findOne({ postId: entityId });
        if (entity) entityAuthorId = entity.userId;
        break;
      case 'story':
        entity = await Story.findOne({ storyId: entityId });
        if (entity) entityAuthorId = entity.userId;
        break;
      case 'comment':
        entity = await Comment.findOne({ commentId: entityId });
        if (entity) entityAuthorId = entity.userId;
        break;
    }

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`
      });
    }

    // Check if user already reacted to this entity
    const existingReaction = await Reaction.findOne({
      entityType,
      entityId,
      userId
    });

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Same reaction - remove it
        await Reaction.findOneAndDelete({
          entityType,
          entityId,
          userId
        });

        res.json({
          success: true,
          message: 'Reaction removed successfully',
          data: { 
            reacted: false, 
            reactionType: null,
            reactionCounts: await getReactionCounts(entityType, entityId)
          }
        });
      } else {
        // Different reaction - update it
        existingReaction.reactionType = reactionType;
        await existingReaction.save();

        res.json({
          success: true,
          message: 'Reaction updated successfully',
          data: { 
            reacted: true, 
            reactionType,
            reactionCounts: await getReactionCounts(entityType, entityId)
          }
        });
      }
    } else {
      // New reaction
      const reactionId = generateReactionId();
      const reaction = new Reaction({
        reactionId,
        entityType,
        entityId,
        userId,
        reactionType
      });

      await reaction.save();

      // Create notification for entity author (if not reacting to own content)
      if (entityAuthorId !== userId) {
        const reactor = await User.findOne({ userId });
        await createNotification(
          entityAuthorId,
          'like',
          userId,
          entityId,
          'New Reaction',
          `${reactor.fullNames} reacted with ${reactionType} to your ${entityType}`
        );
      }

      res.json({
        success: true,
        message: 'Reaction added successfully',
        data: { 
          reacted: true, 
          reactionType,
          reactionCounts: await getReactionCounts(entityType, entityId)
        }
      });
    }
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

export const getReactions = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Validate entity type
    if (!['post', 'story', 'comment'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type. Must be post, story, or comment'
      });
    }

    // Get reactions with pagination
    const reactions = await Reaction.find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'user', select: 'fullNames profilePictureURL userId' });

    const totalReactions = await Reaction.countDocuments({ entityType, entityId });
    const reactionCounts = await getReactionCounts(entityType, entityId);

    res.json({
      success: true,
      data: {
        reactions,
        reactionCounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReactions / parseInt(limit)),
          totalReactions,
          hasNextPage: skip + parseInt(limit) < totalReactions,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reactions',
      error: error.message
    });
  }
};

export const getUserReaction = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const userId = req.user.userId;

    // Validate entity type
    if (!['post', 'story', 'comment'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type. Must be post, story, or comment'
      });
    }

    const reaction = await Reaction.findOne({ entityType, entityId, userId });

    res.json({
      success: true,
      data: {
        reacted: !!reaction,
        reactionType: reaction?.reactionType || null,
        reactionCounts: await getReactionCounts(entityType, entityId)
      }
    });
  } catch (error) {
    console.error('Get user reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user reaction',
      error: error.message
    });
  }
};

// Helper function to get reaction counts for an entity
export const getReactionCounts = async (entityType, entityId) => {
  const reactions = await Reaction.find({ entityType, entityId });
  
  const counts = {
    like: 0,
    dislike: 0,
    love: 0,
    laugh: 0,
    angry: 0,
    sad: 0,
    wow: 0,
    total: reactions.length
  };

  reactions.forEach(reaction => {
    counts[reaction.reactionType]++;
  });

  return counts;
};

