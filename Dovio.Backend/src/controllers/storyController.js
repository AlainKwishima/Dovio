import Story from '../models/Story.js';
import StoryHighlight from '../models/StoryHighlight.js';
import User from '../models/User.js';
import { generateStoryId, generateHighlightId } from '../utils/uuid.js';

export const createStory = async (req, res) => {
  try {
    const { storyText, mediaURL, mediaType = 'text' } = req.body;
    const userId = req.user.userId;

    // Validate that either text or media is provided
    if (!storyText && !mediaURL) {
      return res.status(400).json({
        success: false,
        message: 'Either story text or media URL is required'
      });
    }

    const storyId = generateStoryId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const story = new Story({
      storyId,
      userId,
      content: {
        storyText: storyText || '',
        mediaURL: mediaURL || '',
        mediaType
      },
      expiresAt
    });

    await story.save();

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Created story at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    // Populate author details
    const populatedStory = await Story.findById(story._id)
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: { story: populatedStory }
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
      error: error.message
    });
  }
};

export const getStories = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { expiresAt: { $gt: new Date() } }; // Only get non-expired stories
    if (userId) {
      query.userId = userId;
    }

    const stories = await Story.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    const totalStories = await Story.countDocuments(query);

    res.json({
      success: true,
      data: {
        stories,
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
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stories',
      error: error.message
    });
  }
};

export const getStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId;

    const story = await Story.findOne({ storyId })
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Story has expired'
      });
    }

    // Add view if user hasn't viewed this story before
    const hasViewed = story.views.some(view => view.userId === userId);
    if (!hasViewed) {
      story.views.push({ userId, viewedAt: new Date() });
      await story.save();
    }

    res.json({
      success: true,
      data: { story }
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get story',
      error: error.message
    });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId;

    const story = await Story.findOne({ storyId });
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user is the owner
    if (story.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story'
      });
    }

    await Story.findOneAndDelete({ storyId });

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Deleted story at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete story',
      error: error.message
    });
  }
};

export const getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const story = await Story.findOne({ storyId });
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user owns the story or has permission to view viewers
    if (story.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view viewers of your own stories'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const viewers = story.views.slice(skip, skip + parseInt(limit));

    // Get user details for viewers
    const viewerUserIds = viewers.map(view => view.userId);
    const viewerUsers = await User.find({ userId: { $in: viewerUserIds } })
      .select('userId fullNames profilePictureURL');

    // Combine viewer data with user details
    const viewersWithDetails = viewers.map(view => {
      const user = viewerUsers.find(u => u.userId === view.userId);
      return {
        userId: view.userId,
        viewedAt: view.viewedAt,
        user: user ? {
          fullNames: user.fullNames,
          profilePictureURL: user.profilePictureURL
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        storyId,
        totalViews: story.views.length,
        viewers: viewersWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(story.views.length / parseInt(limit)),
          totalViews: story.views.length,
          hasNextPage: skip + viewers.length < story.views.length,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get story viewers',
      error: error.message
    });
  }
};

export const getStoryHighlights = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user.userId;

    // Get highlights for the target user
    const highlights = await StoryHighlight.find({ 
      userId: targetUserId,
      isPublic: true 
    })
    .sort({ order: 1, timestamp: -1 })
    .populate({
      path: 'stories.storyId',
      model: 'Story',
      select: 'storyId content timestamp',
      match: { expiresAt: { $gt: new Date() } } // Only include non-expired stories
    });

    // Filter out highlights with no valid stories
    const validHighlights = highlights.filter(highlight => 
      highlight.stories.some(story => story.storyId)
    );

    res.json({
      success: true,
      data: {
        highlights: validHighlights,
        userId: targetUserId
      }
    });
  } catch (error) {
    console.error('Get story highlights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get story highlights',
      error: error.message
    });
  }
};

export const createStoryHighlight = async (req, res) => {
  try {
    const { title, coverImageURL, storyIds, isPublic = true } = req.body;
    const userId = req.user.userId;

    if (!title || !storyIds || storyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title and at least one story ID are required'
      });
    }

    // Verify that all stories belong to the user
    const stories = await Story.find({ 
      storyId: { $in: storyIds },
      userId: userId
    });

    if (stories.length !== storyIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some stories not found or do not belong to you'
      });
    }

    const highlightId = generateHighlightId();
    
    // Get the next order number
    const lastHighlight = await StoryHighlight.findOne({ userId })
      .sort({ order: -1 });
    const nextOrder = lastHighlight ? lastHighlight.order + 1 : 1;

    const highlight = new StoryHighlight({
      highlightId,
      userId,
      title,
      coverImageURL,
      stories: storyIds.map(storyId => ({ storyId })),
      order: nextOrder,
      isPublic
    });

    await highlight.save();

    res.status(201).json({
      success: true,
      message: 'Story highlight created successfully',
      data: { highlight }
    });
  } catch (error) {
    console.error('Create story highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create story highlight',
      error: error.message
    });
  }
};

export const updateStoryHighlight = async (req, res) => {
  try {
    const { highlightId } = req.params;
    const { title, coverImageURL, storyIds, isPublic, order } = req.body;
    const userId = req.user.userId;

    const highlight = await StoryHighlight.findOne({ 
      highlightId, 
      userId 
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Story highlight not found'
      });
    }

    // Update fields
    if (title !== undefined) highlight.title = title;
    if (coverImageURL !== undefined) highlight.coverImageURL = coverImageURL;
    if (isPublic !== undefined) highlight.isPublic = isPublic;
    if (order !== undefined) highlight.order = order;

    // Update stories if provided
    if (storyIds) {
      // Verify that all stories belong to the user
      const stories = await Story.find({ 
        storyId: { $in: storyIds },
        userId: userId
      });

      if (stories.length !== storyIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some stories not found or do not belong to you'
        });
      }

      highlight.stories = storyIds.map(storyId => ({ storyId }));
    }

    await highlight.save();

    res.json({
      success: true,
      message: 'Story highlight updated successfully',
      data: { highlight }
    });
  } catch (error) {
    console.error('Update story highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update story highlight',
      error: error.message
    });
  }
};

export const deleteStoryHighlight = async (req, res) => {
  try {
    const { highlightId } = req.params;
    const userId = req.user.userId;

    const highlight = await StoryHighlight.findOneAndDelete({ 
      highlightId, 
      userId 
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Story highlight not found'
      });
    }

    res.json({
      success: true,
      message: 'Story highlight deleted successfully'
    });
  } catch (error) {
    console.error('Delete story highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete story highlight',
      error: error.message
    });
  }
};

