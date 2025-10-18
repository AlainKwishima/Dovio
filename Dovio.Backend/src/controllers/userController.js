import User from '../models/User.js';
import WalletAudit from '../models/WalletAudit.js';
import { v4 as uuidv4 } from 'uuid';

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullNames, address, phoneNumber, occupation, hobbies, profilePictureURL } = req.body;
    const userId = req.user.userId;

    const updateData = {};
    if (fullNames) updateData.fullNames = fullNames;
    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (occupation) updateData.occupation = occupation;
    if (hobbies) updateData.hobbies = hobbies;
    if (profilePictureURL) updateData.profilePictureURL = profilePictureURL;

    const user = await User.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add recent action
    user.recentActions.unshift(`Profile updated at ${new Date().toISOString()}`);
    if (user.recentActions.length > 50) {
      user.recentActions = user.recentActions.slice(0, 50);
    }
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOneAndDelete({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
};

export const updateWalletBalance = async (req, res) => {
  try {
    const { amount, operation } = req.body;
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let newBalance;
    if (operation === 'add') {
      newBalance = user.walletBalance + amount;
    } else if (operation === 'subtract') {
      newBalance = user.walletBalance - amount;
      if (newBalance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }

    const previousBalance = user.walletBalance;
    user.walletBalance = newBalance;
    user.recentActions.unshift(`Wallet ${operation}ed ${amount} at ${new Date().toISOString()}`);
    if (user.recentActions.length > 50) {
      user.recentActions = user.recentActions.slice(0, 50);
    }
    await user.save();

    // Audit log (best effort; does not block response)
    try {
      await WalletAudit.create({
        auditId: uuidv4(),
        userId: user.userId,
        operation,
        amount,
        previousBalance,
        newBalance,
        reason: `API wallet ${operation}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });
    } catch {}

    res.json({
      success: true,
      message: `Wallet ${operation}ed successfully`,
      data: {
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet balance',
      error: error.message
    });
  }
};

export const sendMoney = async (req, res) => {
  try {
    const { recipientId, amount, message } = req.body;
    const senderId = req.user.userId;

    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send money to yourself'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Check if recipient exists
    const recipient = await User.findOne({ userId: recipientId });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check sender's balance
    const sender = await User.findOne({ userId: senderId });
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    if (sender.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Perform the transaction
    const senderPreviousBalance = sender.walletBalance;
    const recipientPreviousBalance = recipient.walletBalance;

    sender.walletBalance -= amount;
    recipient.walletBalance += amount;

    // Add recent actions
    sender.recentActions.unshift(`Sent ${amount} to ${recipient.fullNames} at ${new Date().toISOString()}`);
    recipient.recentActions.unshift(`Received ${amount} from ${sender.fullNames} at ${new Date().toISOString()}`);

    if (sender.recentActions.length > 50) {
      sender.recentActions = sender.recentActions.slice(0, 50);
    }
    if (recipient.recentActions.length > 50) {
      recipient.recentActions = recipient.recentActions.slice(0, 50);
    }

    await sender.save();
    await recipient.save();

    // Audit logs for both users
    try {
      await WalletAudit.create({
        auditId: uuidv4(),
        userId: sender.userId,
        operation: 'send',
        amount: -amount,
        previousBalance: senderPreviousBalance,
        newBalance: sender.walletBalance,
        reason: `Sent money to ${recipient.fullNames}${message ? `: ${message}` : ''}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });

      await WalletAudit.create({
        auditId: uuidv4(),
        userId: recipient.userId,
        operation: 'receive',
        amount: amount,
        previousBalance: recipientPreviousBalance,
        newBalance: recipient.walletBalance,
        reason: `Received money from ${sender.fullNames}${message ? `: ${message}` : ''}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });
    } catch {}

    res.json({
      success: true,
      message: 'Money sent successfully',
      data: {
        newBalance: sender.walletBalance,
        recipient: {
          userId: recipient.userId,
          fullNames: recipient.fullNames
        },
        amount
      }
    });
  } catch (error) {
    console.error('Send money error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send money',
      error: error.message
    });
  }
};

export const withdrawMoney = async (req, res) => {
  try {
    const { amount, withdrawalMethod, accountDetails } = req.body;
    const userId = req.user.userId;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    const previousBalance = user.walletBalance;
    user.walletBalance -= amount;
    
    // Add recent action
    user.recentActions.unshift(`Withdrew ${amount} via ${withdrawalMethod} at ${new Date().toISOString()}`);
    if (user.recentActions.length > 50) {
      user.recentActions = user.recentActions.slice(0, 50);
    }
    await user.save();

    // Audit log
    try {
      await WalletAudit.create({
        auditId: uuidv4(),
        userId: user.userId,
        operation: 'withdraw',
        amount: -amount,
        previousBalance,
        newBalance: user.walletBalance,
        reason: `Withdrawal via ${withdrawalMethod}${accountDetails ? ` to ${accountDetails}` : ''}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });
    } catch {}

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        newBalance: user.walletBalance,
        withdrawalAmount: amount,
        withdrawalMethod,
        status: 'pending' // In a real app, this would be processed by a payment processor
      }
    });
  } catch (error) {
    console.error('Withdraw money error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId }).select('walletBalance userId fullNames');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: user.walletBalance,
        walletBalance: user.walletBalance, // Keep both for compatibility
        userId: user.userId,
        fullNames: user.fullNames
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
};

export const addRecentAction = async (req, res) => {
  try {
    const { action } = req.body;
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.recentActions.unshift(`${action} at ${new Date().toISOString()}`);
    if (user.recentActions.length > 50) {
      user.recentActions = user.recentActions.slice(0, 50);
    }
    await user.save();

    res.json({
      success: true,
      message: 'Action added successfully',
      data: {
        recentActions: user.recentActions
      }
    });
  } catch (error) {
    console.error('Add recent action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recent action',
      error: error.message
    });
  }
};

export const addActiveTime = async (req, res) => {
  try {
    const { date, beginningTime, endTime } = req.body;
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if entry for this date already exists
    const existingEntry = user.activeTimeByDate.find(entry => entry.date === date);
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Active time entry for this date already exists'
      });
    }

    user.activeTimeByDate.push({ date, beginningTime, endTime });
    await user.save();

    res.json({
      success: true,
      message: 'Active time added successfully',
      data: {
        activeTimeByDate: user.activeTimeByDate
      }
    });
  } catch (error) {
    console.error('Add active time error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add active time',
      error: error.message
    });
  }
};

export const getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId }).select('recentActions activeTimeByDate');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        recentActions: user.recentActions,
        activeTimeByDate: user.activeTimeByDate
      }
    });
  } catch (error) {
    console.error('Get activity history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity history',
      error: error.message
    });
  }
};



