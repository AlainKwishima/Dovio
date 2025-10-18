import mongoose from "mongoose";

const postShareSchema = new mongoose.Schema({
  shareId: { type: String, required: true, unique: true },
  originalPostId: { type: String, required: true },
  sharedByUserId: { type: String, required: true },
  shareText: { type: String, maxlength: 500 }, // Optional comment when sharing
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes for common queries
postShareSchema.index({ originalPostId: 1, timestamp: -1 });
postShareSchema.index({ sharedByUserId: 1, timestamp: -1 });

// Virtual populate to join user by string userId
postShareSchema.virtual('sharer', {
  ref: 'User',
  localField: 'sharedByUserId',
  foreignField: 'userId',
  justOne: true
});

// Virtual populate to join original post
postShareSchema.virtual('originalPost', {
  ref: 'Post',
  localField: 'originalPostId',
  foreignField: 'postId',
  justOne: true
});

export default mongoose.model("PostShare", postShareSchema);

