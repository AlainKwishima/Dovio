import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fullNames: { type: String, required: true, maxlength: 100 },
  profilePictureURL: { type: String, maxlength: 5000 },
  email: { type: String, required: true, unique: true, maxlength: 100 },
  password: { type: String, required: true, minlength: 8 },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  twoFAEnabled: { type: Boolean, default: false },
  twoFACode: { type: String, default: null },
  twoFAExpires: { type: Date, default: null },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  dob: { type: Date, required: true },
  address: { type: String, required: true, maxlength: 200 },
  phoneNumber: { type: String, required: true, maxlength: 20 },
  occupation: { type: String, required: true, maxlength: 100 },
  walletBalance: { type: Number, default: 0, min: 0 },
  hobbies: { type: String, required: true, maxlength: 200 },
  recentActions: { type: [String], default: [] },
  activeTimeByDate: {
    type: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        beginningTime: { type: String, required: true }, // HH:MM
        endTime: { type: String, required: true } // HH:MM
      }
    ],
    default: []
  },
  memoryStatements: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
