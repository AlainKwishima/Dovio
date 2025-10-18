import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  storyId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  content: {
    storyText: { type: String, maxlength: 1000 },
    mediaURL: { type: String, maxlength: 5000 },
    mediaType: { type: String, enum: ['image', 'video', 'text'], default: 'text' }
  },
  expiresAt: { type: Date, required: true }, // Stories expire after 24 hours
  views: [{ 
    userId: { type: String },
    viewedAt: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes for common queries
storySchema.index({ userId: 1, timestamp: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion
storySchema.index({ timestamp: -1 });

// Virtual populate to join user by string userId
storySchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.views.length;
});

export default mongoose.model("Story", storySchema);

