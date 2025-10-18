import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  
  // Privacy Settings
  privacy: {
    accountVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
    dmPermissions: { type: String, enum: ['everyone', 'followers', 'none'], default: 'everyone' },
    commentPermissions: { type: String, enum: ['everyone', 'followers', 'none'], default: 'everyone' },
    storyVisibility: { type: String, enum: ['everyone', 'followers', 'close_friends'], default: 'everyone' },
    tagApproval: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true }
  },

  // Notification Settings
  notifications: {
    email: {
      newFollowers: { type: Boolean, default: true },
      newLikes: { type: Boolean, default: true },
      newComments: { type: Boolean, default: true },
      newShares: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      storyViews: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true }
    },
    push: {
      newFollowers: { type: Boolean, default: true },
      newLikes: { type: Boolean, default: true },
      newComments: { type: Boolean, default: true },
      newShares: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      storyViews: { type: Boolean, default: false },
      securityAlerts: { type: Boolean, default: true }
    },
    inApp: {
      newFollowers: { type: Boolean, default: true },
      newLikes: { type: Boolean, default: true },
      newComments: { type: Boolean, default: true },
      newShares: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      storyViews: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true }
    }
  },

  // Content Settings
  content: {
    autoPlayVideos: { type: Boolean, default: true },
    showSensitiveContent: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },

  // Blocked Users
  blockedUsers: [{ type: String }],

  // Restricted Users (can't see posts/stories)
  restrictedUsers: [{ type: String }],

  // Close Friends List
  closeFriends: [{ type: String }],

  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
userSettingsSchema.index({ userId: 1 });
userSettingsSchema.index({ 'blockedUsers': 1 });
userSettingsSchema.index({ 'restrictedUsers': 1 });

// Virtual populate
userSettingsSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("UserSettings", userSettingsSchema);

