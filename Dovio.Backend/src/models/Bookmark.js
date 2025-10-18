import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  bookmarkId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  postId: { type: String, required: true },
  folder: { type: String, default: 'default' },
  tags: [{ type: String }],
  notes: { type: String, maxlength: 500 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, folder: 1 });
bookmarkSchema.index({ userId: 1, timestamp: -1 });

// Virtual populate
bookmarkSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: 'postId',
  justOne: true
});

bookmarkSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("Bookmark", bookmarkSchema);

