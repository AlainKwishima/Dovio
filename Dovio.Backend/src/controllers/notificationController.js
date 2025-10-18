import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { generateNotificationId } from '../utils/uuid.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'fromUser', select: 'fullNames profilePictureURL userId' });

    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / parseInt(limit)),
          totalNotifications,
          hasNextPage: skip + parseInt(limit) < totalNotifications,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({ 
      notificationId, 
      userId 
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({ 
      notificationId, 
      userId 
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Helper function to create notifications
export const createNotification = async (userId, type, fromUserId, relatedEntityId, title, message) => {
  try {
    const notificationId = generateNotificationId();
    const notification = new Notification({
      notificationId,
      userId,
      type,
      fromUserId,
      relatedEntityId,
      title,
      message
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

