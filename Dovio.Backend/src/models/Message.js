import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  receiverId: { type: String }, // Optional for conversation-based messages
  conversationId: { type: String }, // For conversation-based messages
  content: { type: String, required: true },
  mediaUrl: { type: String },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'file'], 
    default: 'text' 
  },
  replyTo: { type: String }, // messageId of message being replied to
  readReceipts: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  deliveredTo: [String], // Array of userIds who have received the message
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Virtual for sender details
messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: 'userId',
  justOne: true
});

// Ensure virtuals are included in JSON output
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// Indexes to support inbox and conversations queries
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

export default mongoose.model("Message", messageSchema);
