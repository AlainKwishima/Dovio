import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema({
  hashtagId: { type: String, required: true, unique: true },
  tag: { type: String, required: true, unique: true, lowercase: true },
  postCount: { type: Number, default: 0 },
  storyCount: { type: Number, default: 0 },
  lastUsed: { type: Date, default: Date.now },
  trendingScore: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
hashtagSchema.index({ tag: 1 });
hashtagSchema.index({ trendingScore: -1 });
hashtagSchema.index({ postCount: -1 });
hashtagSchema.index({ lastUsed: -1 });

export default mongoose.model("Hashtag", hashtagSchema);

