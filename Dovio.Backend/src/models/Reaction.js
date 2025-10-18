import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  reactionId: { type: String, required: true, unique: true },
  entityType: { type: String, enum: ['post', 'story', 'comment'], required: true },
  entityId: { type: String, required: true }, // postId, storyId, or commentId
  userId: { type: String, required: true },
  reactionType: { 
    type: String, 
    enum: ['like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'], 
    required: true 
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Compound indexes for efficient queries
reactionSchema.index({ entityType: 1, entityId: 1, userId: 1 }, { unique: true });
reactionSchema.index({ entityType: 1, entityId: 1, reactionType: 1 });
reactionSchema.index({ userId: 1, timestamp: -1 });

// Virtual populate to join user by string userId
reactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("Reaction", reactionSchema);

