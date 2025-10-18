import mongoose from "mongoose";

const postTagSchema = new mongoose.Schema({
  tagId: { type: String, required: true, unique: true },
  postId: { type: String, required: true },
  taggedUserId: { type: String, required: true },
  taggedByUserId: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  approved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
postTagSchema.index({ postId: 1 });
postTagSchema.index({ taggedUserId: 1 });
postTagSchema.index({ taggedByUserId: 1 });
postTagSchema.index({ approved: 1 });

// Virtual populate
postTagSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: 'postId',
  justOne: true
});

postTagSchema.virtual('taggedUser', {
  ref: 'User',
  localField: 'taggedUserId',
  foreignField: 'userId',
  justOne: true
});

postTagSchema.virtual('taggedByUser', {
  ref: 'User',
  localField: 'taggedByUserId',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("PostTag", postTagSchema);

