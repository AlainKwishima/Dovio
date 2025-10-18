import mongoose from "mongoose";

const walletAuditSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  operation: { type: String, enum: ['add','subtract'], required: true },
  amount: { type: Number, required: true },
  previousBalance: { type: Number, required: true },
  newBalance: { type: Number, required: true },
  reason: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

walletAuditSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("WalletAudit", walletAuditSchema);


