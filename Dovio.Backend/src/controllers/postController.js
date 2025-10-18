import Post from '../models/Post.js';
import User from '../models/User.js';
import { generatePostId } from '../utils/uuid.js';

export const createPost = async (req, res) => {
  try {
    const { postText, mediaURLs, location } = req.body;
    const userId = req.user.userId;

    const postId = generatePostId();
    const post = new Post({
      postId,
      userId,
      content: {
        postText,
        mediaURLs: mediaURLs || []
      },
      ...(location ? { location } : {})
    });

    await post.save();

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Created post at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    // Populate author details via virtual to avoid ObjectId mismatch
    const populatedPost = await Post.findById(post._id)
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post: populatedPost }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const posts = await Post.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    const totalPosts = await Post.countDocuments(query);

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
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts',
      error: error.message
    });
  }
};

export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({ postId })
      .populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post',
      error: error.message
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { postText, mediaURLs, location } = req.body;
    const userId = req.user.userId;

    const post = await Post.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the owner
    if (post.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const updateData = {};
    if (postText !== undefined) updateData['content.postText'] = postText;
    if (mediaURLs !== undefined) updateData['content.mediaURLs'] = mediaURLs;
    if (location !== undefined) updateData['location'] = location;

    const updatedPost = await Post.findOneAndUpdate(
      { postId },
      updateData,
      { new: true, runValidators: true }
    ).populate({ path: 'author', select: 'fullNames profilePictureURL userId' });

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Updated post at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post: updatedPost }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the owner
    if (post.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findOneAndDelete({ postId });

    // Add recent action
    const user = await User.findOne({ userId });
    if (user) {
      user.recentActions.unshift(`Deleted post at ${new Date().toISOString()}`);
      if (user.recentActions.length > 50) {
        user.recentActions = user.recentActions.slice(0, 50);
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};



