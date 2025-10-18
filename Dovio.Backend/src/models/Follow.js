import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  followerId: { type: String, required: true },
  followeeId: { type: String, required: true }
}, { timestamps: true });

// Prevent duplicate follows and support queries
followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });
followSchema.index({ followeeId: 1, createdAt: -1 });
followSchema.index({ followerId: 1, createdAt: -1 });

export default mongoose.model("Follow", followSchema);
