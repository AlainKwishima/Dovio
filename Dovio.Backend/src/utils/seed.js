import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import { generateUserId, generateMessageId, generatePostId } from './uuid.js';

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Message.deleteMany({});
    await Post.deleteMany({});
    await Follow.deleteMany({});

    console.log('🗑️ Cleared existing data');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    const hashedMukabareke = await bcrypt.hash('Mukabareke#1', 12);

    const users = [
      {
        userId: generateUserId(),
        fullNames: 'Alain',
        email: 'alainkwishima@gmail.com',
        password: hashedMukabareke,
        dob: new Date('1995-01-01'),
        address: 'Kigali, Rwanda',
        phoneNumber: '+250000000000',
        occupation: 'Founder',
        hobbies: 'Building, Design, AI',
        profilePictureURL: 'https://via.placeholder.com/150/222222/FFFFFF?text=AK',
        walletBalance: 0,
        recentActions: ['Registered account (seed)'],
        activeTimeByDate: [],
        memoryStatements: ['Bio: Vision-driven creator of Dovio']
      },
      {
        userId: generateUserId(),
        fullNames: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        dob: new Date('1990-01-15'),
        address: '123 Main St, New York, NY',
        phoneNumber: '+1234567890',
        occupation: 'Software Engineer',
        hobbies: 'Reading, Gaming, Hiking',
        profilePictureURL: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=JD',
        walletBalance: 1000,
        recentActions: ['Registered account', 'Updated profile'],
        activeTimeByDate: [
          {
            date: '2024-01-15',
            beginningTime: '09:00',
            endTime: '17:00'
          }
        ],
        memoryStatements: ['I love coding', 'I enjoy outdoor activities']
      },
      {
        userId: generateUserId(),
        fullNames: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        dob: new Date('1992-05-20'),
        address: '456 Oak Ave, Los Angeles, CA',
        phoneNumber: '+1987654321',
        occupation: 'Designer',
        hobbies: 'Painting, Photography, Yoga',
        profilePictureURL: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=JS',
        walletBalance: 750,
        recentActions: ['Registered account', 'Created first post'],
        activeTimeByDate: [
          {
            date: '2024-01-15',
            beginningTime: '10:00',
            endTime: '18:00'
          }
        ],
        memoryStatements: ['I am creative', 'I love nature']
      },
      {
        userId: generateUserId(),
        fullNames: 'Dovio AI',
        email: 'dovio@ai.com',
        password: hashedPassword,
        dob: new Date('2020-01-01'),
        address: 'AI Server, Cloud',
        phoneNumber: '+1111111111',
        occupation: 'AI Assistant',
        hobbies: 'Learning, Helping, Problem Solving',
        profilePictureURL: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=AI',
        walletBalance: 0,
        recentActions: ['AI Assistant activated'],
        activeTimeByDate: [],
        memoryStatements: ['I am here to help', 'I learn from every interaction']
      },
      {
        userId: generateUserId(),
        fullNames: 'Mike Johnson',
        email: 'mike@example.com',
        password: hashedPassword,
        dob: new Date('1988-12-10'),
        address: '789 Pine St, Chicago, IL',
        phoneNumber: '+1555666777',
        occupation: 'Teacher',
        hobbies: 'Teaching, Reading, Cooking',
        profilePictureURL: 'https://via.placeholder.com/150/FFFF00/000000?text=MJ',
        walletBalance: 500,
        recentActions: ['Registered account'],
        activeTimeByDate: [],
        memoryStatements: ['I love teaching', 'Education is important']
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create follow relationships
    const follows = [
      { followerId: createdUsers[0].userId, followeeId: createdUsers[1].userId }, // John follows Jane
      { followerId: createdUsers[0].userId, followeeId: createdUsers[2].userId }, // John follows Dovio AI
      { followerId: createdUsers[1].userId, followeeId: createdUsers[0].userId }, // Jane follows John
      { followerId: createdUsers[1].userId, followeeId: createdUsers[2].userId }, // Jane follows Dovio AI
      { followerId: createdUsers[3].userId, followeeId: createdUsers[0].userId }, // Mike follows John
      { followerId: createdUsers[3].userId, followeeId: createdUsers[1].userId }, // Mike follows Jane
    ];

    await Follow.insertMany(follows);
    console.log(`👥 Created ${follows.length} follow relationships`);

    // Create posts
    const posts = [
      {
        postId: generatePostId(),
        userId: createdUsers[0].userId,
        content: {
          postText: 'Just finished a great coding session! Building amazing mobile apps with React Native. #coding #mobile #reactnative',
          mediaURLs: ['https://via.placeholder.com/400x300/0000FF/FFFFFF?text=Coding+Session']
        }
      },
      {
        postId: generatePostId(),
        userId: createdUsers[1].userId,
        content: {
          postText: 'Beautiful sunset today! Nature never fails to inspire my creative work. 🌅 #nature #inspiration #design',
          mediaURLs: ['https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Sunset']
        }
      },
      {
        postId: generatePostId(),
        userId: createdUsers[2].userId,
        content: {
          postText: 'Hello everyone! I\'m Dovio AI, your intelligent assistant. I\'m here to help with any questions or tasks you might have. How can I assist you today?',
          mediaURLs: []
        }
      },
      {
        postId: generatePostId(),
        userId: createdUsers[3].userId,
        content: {
          postText: 'Teaching is such a rewarding profession. Seeing students learn and grow is the best part of my day! #teaching #education #students',
          mediaURLs: []
        }
      },
      {
        postId: generatePostId(),
        userId: createdUsers[0].userId,
        content: {
          postText: 'Working on a new feature for our mobile app. The team is doing amazing work! #teamwork #mobile #development',
          mediaURLs: []
        }
      }
    ];

    await Post.insertMany(posts);
    console.log(`📝 Created ${posts.length} posts`);

    // Create messages
    const messages = [
      {
        messageId: generateMessageId(),
        senderId: createdUsers[0].userId,
        receiverId: createdUsers[1].userId,
        content: 'Hey Jane! How are you doing?',
        mediaUrl: null
      },
      {
        messageId: generateMessageId(),
        senderId: createdUsers[1].userId,
        receiverId: createdUsers[0].userId,
        content: 'Hi John! I\'m doing great, thanks for asking. How about you?',
        mediaUrl: null
      },
      {
        messageId: generateMessageId(),
        senderId: createdUsers[2].userId,
        receiverId: createdUsers[0].userId,
        content: 'Hello John! I noticed you\'re working on mobile development. I can help you with any technical questions you might have!',
        mediaUrl: null
      },
      {
        messageId: generateMessageId(),
        senderId: createdUsers[0].userId,
        receiverId: createdUsers[2].userId,
        content: 'Thanks Dovio! That would be really helpful. I\'ll reach out if I need assistance.',
        mediaUrl: null
      },
      {
        messageId: generateMessageId(),
        senderId: createdUsers[3].userId,
        receiverId: createdUsers[0].userId,
        content: 'Hi John! I saw your post about mobile development. I\'m teaching a programming course and would love to collaborate!',
        mediaUrl: null
      }
    ];

    await Message.insertMany(messages);
    console.log(`💬 Created ${messages.length} messages`);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Follows: ${follows.length}`);
    console.log(`- Posts: ${posts.length}`);
    console.log(`- Messages: ${messages.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('Email: john@example.com | Password: password123');
    console.log('Email: jane@example.com | Password: password123');
    console.log('Email: mike@example.com | Password: password123');
    console.log('Email: dovio@ai.com | Password: password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export default seedData;



