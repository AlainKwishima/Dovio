import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  commentId: { type: String, required: true, unique: true },
  postId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
  parentCommentId: { type: String, default: null }, // For nested replies
  likes: [{ 
    userId: { type: String },
    likedAt: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes for common queries
commentSchema.index({ postId: 1, timestamp: -1 });
commentSchema.index({ userId: 1, timestamp: -1 });
commentSchema.index({ parentCommentId: 1 });

// Virtual populate to join user by string userId
commentSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for replies (nested comments)
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: 'commentId',
  foreignField: 'parentCommentId'
});

export default mongoose.model("Comment", commentSchema);

