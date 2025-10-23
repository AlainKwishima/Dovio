// Quick script to create a verified test user
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

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
        date: { type: String, required: true },
        beginningTime: { type: String, required: true },
        endTime: { type: String, required: true }
      }
    ],
    default: []
  },
  memoryStatements: { type: [String], default: [] }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dovio');
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    if (existingUser) {
      console.log('User already exists, updating verification status...');
      existingUser.emailVerified = true;
      existingUser.emailVerificationToken = null;
      await existingUser.save();
      console.log('✅ User verified successfully!');
      console.log('Email: testuser@example.com');
      console.log('Password: password123');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = new User({
        userId: `user_${Date.now()}`,
        fullNames: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        emailVerified: true, // Mark as verified
        emailVerificationToken: null,
        dob: new Date('2000-01-01'),
        address: 'Test Address',
        phoneNumber: '1234567890',
        occupation: 'Developer',
        hobbies: 'Coding'
      });

      await user.save();
      console.log('✅ Test user created successfully!');
      console.log('Email: testuser@example.com');
      console.log('Password: password123');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();
