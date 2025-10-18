import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  content: {
    postText: { type: String, maxlength: 1000 },
    mediaURLs: [{ type: String, maxlength: 5000 }]
  },
  hashtags: [{ type: String, lowercase: true }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    name: { type: String, maxlength: 200 },
    address: { type: String, maxlength: 500 }
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Ensure at least one of postText or mediaURLs is provided
postSchema.pre('validate', function(next) {
  const c = this.content || {};
  const hasText = typeof c.postText === 'string' && c.postText.trim().length > 0;
  const hasMedia = Array.isArray(c.mediaURLs) && c.mediaURLs.length > 0;
  if (!hasText && !hasMedia) {
    this.invalidate('content', 'Either content.postText or content.mediaURLs is required');
  }
  next();
});

// Indexes for common queries
postSchema.index({ userId: 1, timestamp: -1 });
postSchema.index({ timestamp: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual populate to join user by string userId
postSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("Post", postSchema);
