import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // Recipient
  type: { 
    type: String, 
    enum: ['follow', 'like', 'comment', 'share', 'message', 'story_view'], 
    required: true 
  },
  fromUserId: { type: String, required: true }, // Sender/actor
  relatedEntityId: { type: String }, // Post ID, Comment ID, etc.
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes for efficient queries
notificationSchema.index({ userId: 1, timestamp: -1 });
notificationSchema.index({ userId: 1, read: 1 });

// Virtual populate to join user by string userId
notificationSchema.virtual('fromUser', {
  ref: 'User',
  localField: 'fromUserId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("Notification", notificationSchema);

