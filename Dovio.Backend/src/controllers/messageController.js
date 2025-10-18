import Message from '../models/Message.js';
import User from '../models/User.js';
import { generateMessageId } from '../utils/uuid.js';

export const createMessage = async (req, res) => {
  try {
    const { receiverId, content, mediaUrl } = req.body;
    const senderId = req.user.userId;

    // Check if receiver exists
    const receiver = await User.findOne({ userId: receiverId });
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if trying to send message to self
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    const messageId = generateMessageId();
    const message = new Message({
      messageId,
      senderId,
      receiverId,
      content,
      mediaUrl: mediaUrl || null
    });

    await message.save();

    // Add recent action for sender
    const sender = await User.findOne({ userId: senderId });
    if (sender) {
      sender.recentActions.unshift(`Sent message to ${receiver.fullNames} at ${new Date().toISOString()}`);
      if (sender.recentActions.length > 50) {
        sender.recentActions = sender.recentActions.slice(0, 50);
      }
      await sender.save();
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, otherUserId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    // If filtering by specific user
    if (otherUserId) {
      query = {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Attach lightweight user profiles without leaking emails
    const userIds = Array.from(new Set(messages.flatMap(m => [m.senderId, m.receiverId])));
    const users = await User.find({ userId: { $in: userIds } }).select('userId fullNames profilePictureURL');
    const userById = new Map(users.map(u => [u.userId, u]));

    const decorated = messages.map(m => ({
      messageId: m.messageId,
      sender: userById.get(m.senderId) || { userId: m.senderId },
      receiver: userById.get(m.receiverId) || { userId: m.receiverId },
      content: m.content,
      mediaUrl: m.mediaUrl,
      timestamp: m.timestamp
    }));

    const totalMessages = await Message.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages: decorated,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / parseInt(limit)),
          totalMessages,
          hasNextPage: skip + parseInt(limit) < totalMessages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender or receiver
    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await Message.findOneAndDelete({ messageId });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all unique users that the current user has messaged with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'userId',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          fullNames: '$user.fullNames',
          profilePictureURL: '$user.profilePictureURL',
          lastMessage: {
            messageId: '$lastMessage.messageId',
            content: '$lastMessage.content',
            timestamp: '$lastMessage.timestamp',
            senderId: '$lastMessage.senderId'
          },
          messageCount: 1
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message
    });
  }
};



