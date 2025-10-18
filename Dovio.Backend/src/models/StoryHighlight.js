import mongoose from "mongoose";

const storyHighlightSchema = new mongoose.Schema({
  highlightId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  title: { type: String, required: true, maxlength: 100 },
  coverImageURL: { type: String, maxlength: 5000 },
  stories: [{
    storyId: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
  }],
  order: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
storyHighlightSchema.index({ userId: 1, order: 1 });
storyHighlightSchema.index({ userId: 1, timestamp: -1 });

// Virtual populate
storyHighlightSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("StoryHighlight", storyHighlightSchema);

