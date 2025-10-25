import Follow from '../models/Follow.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationController.js';

export const followUser = async (req, res) => {
  try {
    const { followeeId: followeeIdRaw } = req.body;
    const followerId = req.user.userId;

    // Resolve followee by userId or _id; normalize to user.userId
    let followeeUser = await User.findOne({ userId: followeeIdRaw });
    if (!followeeUser && mongoose.Types.ObjectId.isValid(String(followeeIdRaw))) {
      followeeUser = await User.findById(followeeIdRaw);
    }
    const followeeId = followeeUser?.userId || followeeIdRaw;

    // Check if trying to follow self
    if (followerId === followeeId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    // Check if followee exists
    const followee = followeeUser || await User.findOne({ userId: followeeId });
    if (!followee) {
      return res.status(404).json({
        success: false,
        message: 'User to follow not found'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ followerId, followeeId });
    if (existingFollow) {
      // Make follow idempotent: return success if relationship already exists
      return res.status(200).json({
        success: true,
        message: 'Already following this user (no-op)',
        data: { follow: existingFollow }
      });
    }

    // Create follow relationship
    const follow = new Follow({
      followerId,
      followeeId
    });

    try {
      await follow.save();
    } catch (e) {
      // Handle race condition on unique index (duplicate follow)
      if (e && (e.code === 11000 || String(e.message || '').includes('duplicate key'))) {
        return res.status(200).json({
          success: true,
          message: 'Already following this user (no-op)',
          data: { follow: existingFollow || { followerId, followeeId } }
        });
      }
      throw e;
    }

    // Add recent action
    const follower = await User.findOne({ userId: followerId });
    if (follower) {
      if (!Array.isArray(follower.recentActions)) follower.recentActions = [];
      try {
        follower.recentActions.unshift(`Followed ${followee.fullNames} at ${new Date().toISOString()}`);
        if (follower.recentActions.length > 50) {
          follower.recentActions = follower.recentActions.slice(0, 50);
        }
      } catch {}
      try { await follower.save(); } catch (e) {
        console.warn('Failed to save follower recentActions after follow:', e?.message || e);
      }

      // Create notification for the followed user (best-effort)
      try {
        await createNotification(
          followeeId,
          'follow',
          followerId,
          null,
          'New Follower',
          `${follower.fullNames} started following you`
        );
      } catch (e) {
        console.warn('Failed to create follow notification:', e?.message || e);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully followed ${followee.fullNames}`,
      data: { follow }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: error.message
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { followeeId: followeeIdParam } = req.params;
    const followerId = req.user.userId;

    // Normalize param to user.userId if _id was provided
    let normFolloweeId = followeeIdParam;
    if (mongoose.Types.ObjectId.isValid(String(followeeIdParam))) {
      const u = await User.findById(followeeIdParam).select('userId');
      if (u?.userId) normFolloweeId = u.userId;
    }

    const follow = await Follow.findOne({ followerId, followeeId: normFolloweeId });
    if (!follow) {
      // Make unfollow idempotent: return 200 when there is nothing to delete
      return res.json({
        success: true,
        message: 'Not following this user (no-op)'
      });
    }

    await Follow.findOneAndDelete({ followerId, followeeId: normFolloweeId });

    // Add recent action
    const follower = await User.findOne({ userId: followerId });
    const followee = await User.findOne({ userId: normFolloweeId });
    if (follower) {
      if (!Array.isArray(follower.recentActions)) follower.recentActions = [];
      try {
        follower.recentActions.unshift(`Unfollowed ${followee?.fullNames || 'user'} at ${new Date().toISOString()}`);
        if (follower.recentActions.length > 50) {
          follower.recentActions = follower.recentActions.slice(0, 50);
        }
      } catch {}
      try { await follower.save(); } catch (e) {
        console.warn('Failed to save follower recentActions after unfollow:', e?.message || e);
      }
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow user',
      error: error.message
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const followers = await Follow.find({ followeeId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const followerIds = followers.map(f => f.followerId);
    const followerUsers = await User.find({ userId: { $in: followerIds } }).select('userId fullNames profilePictureURL');
    const userById = new Map(followerUsers.map(u => [u.userId, u]));

    const totalFollowers = await Follow.countDocuments({ followeeId: userId });

    res.json({
      success: true,
      data: {
        followers: followers.map(follow => {
          const u = userById.get(follow.followerId);
          return {
            userId: u?.userId || follow.followerId,
            fullNames: u?.fullNames,
            profilePictureURL: u?.profilePictureURL,
            followedAt: follow.createdAt
          };
        }),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalFollowers / parseInt(limit)),
          totalFollowers,
          hasNextPage: skip + parseInt(limit) < totalFollowers,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get followers',
      error: error.message
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const following = await Follow.find({ followerId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const followeeIds = following.map(f => f.followeeId);
    const followeeUsers = await User.find({ userId: { $in: followeeIds } }).select('userId fullNames profilePictureURL');
    const userById2 = new Map(followeeUsers.map(u => [u.userId, u]));

    const totalFollowing = await Follow.countDocuments({ followerId: userId });

    res.json({
      success: true,
      data: {
        following: following.map(follow => {
          const u = userById2.get(follow.followeeId);
          return {
            userId: u?.userId || follow.followeeId,
            fullNames: u?.fullNames,
            profilePictureURL: u?.profilePictureURL,
            followedAt: follow.createdAt
          };
        }),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalFollowing / parseInt(limit)),
          totalFollowing,
          hasNextPage: skip + parseInt(limit) < totalFollowing,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get following',
      error: error.message
    });
  }
};

export const checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    const follow = await Follow.findOne({ followerId, followeeId: userId });

    res.json({
      success: true,
      data: {
        isFollowing: !!follow
      }
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check follow status',
      error: error.message
    });
  }
};



