import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateUserId } from '../utils/uuid.js';
import { generateRandomToken, hashToken, generateOTP } from '../utils/tokens.js';
import { sendMail } from '../utils/mailer.js';
import { createNotification } from './notificationController.js';

export const register = async (req, res) => {
  try {
    const { fullNames, email, password, dob, address, phoneNumber, occupation, hobbies, profilePictureURL } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userId = generateUserId();
    const user = new User({
      userId,
      fullNames,
      email,
      password: hashedPassword,
      dob,
      address,
      phoneNumber,
      occupation,
      hobbies,
      profilePictureURL: profilePictureURL || null
    });

    // Email verification setup
    const emailVerificationRaw = generateRandomToken(32);
    user.emailVerificationToken = hashToken(emailVerificationRaw);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    // Send verification email (development friendly)
    const verifyUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/verify-email?token=${emailVerificationRaw}`;
    try {
      await sendMail({
        to: email,
        subject: 'Welcome to Dovio — Confirm Your Account ✨',
        text: `Hi ${fullNames},\n\nWelcome to Dovio! Please confirm your email: ${verifyUrl}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;background:#ffffff">
            <h2 style="margin:0 0 12px 0;color:#111827">Welcome to Dovio! 🎉</h2>
            <p style="margin:0 0 16px 0;line-height:1.5">Hi <strong>${fullNames}</strong>,</p>
            <p style="margin:0 0 16px 0;line-height:1.6">We’re excited to have you join our community. Before you start exploring, please confirm your email address by clicking the button below.</p>
            <div style="margin:24px 0">
              <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Verify My Email</a>
            </div>
            <div style="margin:16px 0;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
              <p style="margin:0 0 8px 0;line-height:1.5">Once verified, you’ll unlock access to:</p>
              <ul style="margin:0 0 0 20px;padding:0;line-height:1.5">
                <li>AI-powered features and stories</li>
                <li>A smart, personalized profile</li>
                <li>Smooth interactions with your friends</li>
              </ul>
            </div>
            <p style="margin:16px 0 0 0;line-height:1.5">If you need help, open “Help Me Out” in the app or reply to this email — we’re always here for you.</p>
            <p style="margin:16px 0 0 0;line-height:1.5">Warm regards,<br/>The Dovio Team</p>
          </div>`
      });
    } catch (emailErr) {
      console.warn('SMTP send failed; continuing registration:', emailErr?.message || emailErr);
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.userId, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.userId });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    const includeVerification = process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        ...(includeVerification ? { emailVerificationToken: emailVerificationRaw, verifyUrl } : {})
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ success: false, message: 'Account locked. Try later.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Reset counters on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Require verified email before login (non-test environments)
    if (process.env.NODE_ENV !== 'test' && !user.emailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.userId, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.userId });

    // Add recent action
    user.recentActions.unshift(`Logged in at ${new Date().toISOString()}`);
    if (user.recentActions.length > 50) {
      user.recentActions = user.recentActions.slice(0, 50);
    }
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const accessToken = generateAccessToken({ userId: user.userId, email: user.email });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    const hashed = hashToken(token);
    const user = await User.findOne({ emailVerificationToken: hashed, emailVerificationExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If that account exists, we sent an email.' });
    const raw = generateRandomToken(32);
    user.resetPasswordToken = hashToken(raw);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/reset-password?token=${raw}`;
    await sendMail({
      to: email,
      subject: 'Reset your password',
      text: `Reset password: ${resetUrl}`,
      html: `<p>Reset your password:</p><p><a href="${resetUrl}">Reset link</a> (valid 15 minutes)</p>`
    });
    res.json({ success: true, message: 'Reset email sent', ...(process.env.NODE_ENV==='test'?{ resetToken: raw }: {}) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Unable to process request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Invalid request' });
    const hashed = hashToken(token);
    const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Reset failed' });
  }
};

export const request2FA = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true });
    const code = generateOTP(6);
    user.twoFACode = await bcrypt.hash(code, 10);
    user.twoFAExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    await sendMail({ to: email, subject: 'Your verification code', text: `Code: ${code}`, html: `<h2>${code}</h2><p>Valid 5 minutes.</p>` });
    res.json({ success: true, message: 'OTP sent' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Unable to request 2FA' });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.twoFAExpires || user.twoFAExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Expired code' });
    }
    const ok = await bcrypt.compare(code, user.twoFACode || '');
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid code' });
    user.twoFACode = null;
    user.twoFAExpires = null;
    user.twoFAEnabled = true;
    await user.save();
    res.json({ success: true, message: '2FA enabled' });
  } catch (e) {
    res.status(500).json({ success: false, message: '2FA verification failed' });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword || '', user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid password' });
    res.json({ success: true, message: 'Password verified' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

    // Update user's last logout timestamp
    await User.findOneAndUpdate(
      { userId },
      { 
        lastLogoutAt: new Date(),
        $push: {
          recentActions: `Logged out from ${deviceInfo} at ${new Date().toISOString()}`
        }
      }
    );

    // Log audit event
    console.log(`User ${userId} logged out from ${deviceInfo} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, twoFactorCode } = req.body;
    const userId = req.user.userId;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();
    
    // Add to recent actions
    user.recentActions.push(`Password changed from ${deviceInfo} at ${new Date().toISOString()}`);

    await user.save();

    // Send security notification email
    try {
      await sendMail({
        to: user.email,
        subject: 'Password Changed - Security Alert',
        html: `
          <h2>Password Changed Successfully</h2>
          <p>Your password was changed on ${new Date().toLocaleString()}.</p>
          <p><strong>Device:</strong> ${deviceInfo}</p>
          <p><strong>IP Address:</strong> ${ipAddress}</p>
          <p>If you did not make this change, please contact support immediately.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send password change email:', emailError);
    }

    // Create notification
    await createNotification(
      userId,
      'security',
      userId,
      null,
      'Password Changed',
      'Your password was successfully changed'
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};
