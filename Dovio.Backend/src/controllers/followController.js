import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

export const followUser = async (req, res) => {
  try {
    const { followeeId } = req.body;
    const followerId = req.user.userId;

    // Check if trying to follow self
    if (followerId === followeeId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    // Check if followee exists
    const followee = await User.findOne({ userId: followeeId });
    if (!followee) {
      return res.status(404).json({
        success: false,
        message: 'User to follow not found'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ followerId, followeeId });
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Create follow relationship
    const follow = new Follow({
      followerId,
      followeeId
    });

    await follow.save();

    // Add recent action
    const follower = await User.findOne({ userId: followerId });
    if (follower) {
      follower.recentActions.unshift(`Followed ${followee.fullNames} at ${new Date().toISOString()}`);
      if (follower.recentActions.length > 50) {
        follower.recentActions = follower.recentActions.slice(0, 50);
      }
      await follower.save();
    }

    // Create notification for the followed user
    await createNotification(
      followeeId,
      'follow',
      followerId,
      null,
      'New Follower',
      `${follower.fullNames} started following you`
    );

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
    const { followeeId } = req.params;
    const followerId = req.user.userId;

    const follow = await Follow.findOne({ followerId, followeeId });
    if (!follow) {
      return res.status(404).json({
        success: false,
        message: 'Not following this user'
      });
    }

    await Follow.findOneAndDelete({ followerId, followeeId });

    // Add recent action
    const follower = await User.findOne({ userId: followerId });
    const followee = await User.findOne({ userId: followeeId });
    if (follower) {
      follower.recentActions.unshift(`Unfollowed ${followee?.fullNames || 'user'} at ${new Date().toISOString()}`);
      if (follower.recentActions.length > 50) {
        follower.recentActions = follower.recentActions.slice(0, 50);
      }
      await follower.save();
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



