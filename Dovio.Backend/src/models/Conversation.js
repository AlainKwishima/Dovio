import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['direct', 'group'], required: true },
  participants: [{
    userId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    lastReadAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['member', 'admin'], default: 'member' }
  }],
  name: { type: String, maxlength: 100 }, // For group chats
  description: { type: String, maxlength: 500 }, // For group chats
  avatarURL: { type: String, maxlength: 5000 }, // For group chats
  createdBy: { type: String, required: true },
  lastMessage: {
    messageId: { type: String },
    content: { type: String },
    timestamp: { type: Date },
    senderId: { type: String }
  },
  isActive: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });
conversationSchema.index({ isActive: 1 });

// Virtual populate
conversationSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: 'userId',
  justOne: true
});

export default mongoose.model("Conversation", conversationSchema);

