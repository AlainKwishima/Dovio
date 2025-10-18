import UserSettings from '../models/UserSettings.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    let settings = await UserSettings.findOne({ userId });
    
    // Create default settings if none exist
    if (!settings) {
      settings = new UserSettings({ userId });
      await settings.save();
    }

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings',
      error: error.message
    });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Validate settings structure
    const allowedFields = ['privacy', 'notifications', 'content'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Validate privacy settings
    if (updates.privacy) {
      const validPrivacyValues = {
        accountVisibility: ['public', 'private'],
        dmPermissions: ['everyone', 'followers', 'none'],
        commentPermissions: ['everyone', 'followers', 'none'],
        storyVisibility: ['everyone', 'followers', 'close_friends']
      };

      for (const [key, value] of Object.entries(updates.privacy)) {
        if (validPrivacyValues[key] && !validPrivacyValues[key].includes(value)) {
          return res.status(400).json({
            success: false,
            message: `Invalid value for ${key}. Must be one of: ${validPrivacyValues[key].join(', ')}`
          });
        }
      }
    }

    // Update or create settings
    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    // Create notification for privacy changes
    if (updates.privacy) {
      await createNotification(
        userId,
        'security',
        userId,
        null,
        'Privacy Settings Updated',
        'Your privacy settings have been updated'
      );
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message
    });
  }
};

export const getUserPrivacy = async (req, res) => {
  try {
    const userId = req.user.userId;

    const settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      return res.json({
        success: true,
        data: {
          privacy: {
            accountVisibility: 'public',
            dmPermissions: 'everyone',
            commentPermissions: 'everyone',
            storyVisibility: 'everyone',
            tagApproval: true,
            showOnlineStatus: true,
            showLastSeen: true
          },
          blockedUsers: [],
          restrictedUsers: [],
          closeFriends: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        privacy: settings.privacy,
        blockedUsers: settings.blockedUsers,
        restrictedUsers: settings.restrictedUsers,
        closeFriends: settings.closeFriends
      }
    });
  } catch (error) {
    console.error('Get user privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user privacy settings',
      error: error.message
    });
  }
};

export const updateUserPrivacy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { privacy, blockedUsers, restrictedUsers, closeFriends } = req.body;

    const updateData = {};
    
    if (privacy) updateData.privacy = privacy;
    if (blockedUsers) updateData.blockedUsers = blockedUsers;
    if (restrictedUsers) updateData.restrictedUsers = restrictedUsers;
    if (closeFriends) updateData.closeFriends = closeFriends;

    // Validate blocked/restricted users exist
    if (blockedUsers || restrictedUsers || closeFriends) {
      const allUserIds = [
        ...(blockedUsers || []),
        ...(restrictedUsers || []),
        ...(closeFriends || [])
      ].filter(Boolean);

      if (allUserIds.length > 0) {
        const existingUsers = await User.find({ userId: { $in: allUserIds } });
        const existingUserIds = existingUsers.map(user => user.userId);
        const invalidUserIds = allUserIds.filter(id => !existingUserIds.includes(id));

        if (invalidUserIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid user IDs: ${invalidUserIds.join(', ')}`
          });
        }
      }
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // Create notification for privacy changes
    await createNotification(
      userId,
      'security',
      userId,
      null,
      'Privacy Settings Updated',
      'Your privacy settings have been updated'
    );

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update user privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user privacy settings',
      error: error.message
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findOne({ userId: targetUserId });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add to blocked users list
    await UserSettings.findOneAndUpdate(
      { userId },
      { $addToSet: { blockedUsers: targetUserId } },
      { upsert: true }
    );

    // Remove from followers/following if exists
    // This would require implementing unfollow logic

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user',
      error: error.message
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;

    await UserSettings.findOneAndUpdate(
      { userId },
      { $pull: { blockedUsers: targetUserId } }
    );

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user',
      error: error.message
    });
  }
};

