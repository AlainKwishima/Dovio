# Lizzy Social App - Development Guide

## 🎯 Overview

Lizzy is a modern social media application built with React Native (Expo) and TypeScript. It combines Instagram-like features with unique monetization through a built-in wallet system and an AI assistant.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: 
  - React Context API with `@nkzw/create-context-hook`
  - React Query for server state
  - Zustand (available but not primary)
- **Styling**: React Native StyleSheet
- **Animations**: React Native Animated API
- **Icons**: Lucide React Native

### Project Structure

```
lizzy/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── home.tsx             # Home feed with stories & posts
│   │   ├── search.tsx           # Explore/search screen
│   │   ├── add.tsx              # Create post screen
│   │   ├── messages.tsx         # Messages inbox with stories row
│   │   ├── wallet.tsx           # Wallet & earnings
│   │   └── profile.tsx          # User profile
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Entry point with auth routing
│   ├── onboarding.tsx           # Onboarding slides
│   ├── login.tsx                # Login screen
│   ├── register.tsx             # Registration screen
│   ├── post-detail.tsx          # Post detail with comments
│   ├── chat-room.tsx            # Individual chat screen
│   ├── notifications.tsx        # Notifications screen
│   ├── call-screen.tsx          # Voice/video call UI
│   ├── settings.tsx             # App settings
│   ├── edit-profile.tsx         # Edit user profile
│   └── lizzy-ai.tsx             # AI assistant (coming soon)
├── components/                   # Reusable components
│   ├── PostCard.tsx             # Post card with follow button
│   ├── StoryCircle.tsx          # Story avatar circle
│   ├── EmojiPicker.tsx          # Emoji selector modal
│   ├── Toast.tsx                # Toast notifications
│   ├── CallConsentModal.tsx    # Call recording consent
│   └── SkeletonLoader.tsx       # Loading skeletons
├── contexts/                     # Global state providers
│   ├── AuthContext.tsx          # Authentication state
│   ├── SocialContext.tsx        # Follow/like state
│   └── WalletContext.tsx        # Wallet & earnings
├── services/                     # API & external services
│   └── api.ts                   # Backend API service layer
├── data/                         # Mock data
│   └── mockData.ts              # Users, posts, chats, etc.
├── types/                        # TypeScript types
│   └── index.ts                 # Shared type definitions
└── constants/                    # App constants
    ├── colors.ts                # Color palette
    └── theme.ts                 # Spacing, fonts, shadows
```

## 🎨 Design System

### Colors
- **Primary Gradient**: `#FF7A3D` → `#FFB84D` (Orange to Yellow)
- **Background**: `#F5F5F5`
- **Card**: `#FFFFFF`
- **Text**: `#1A1A1A`
- **Icon**: `#757575`
- **Border**: `#E0E0E0`

### Typography
- **Font Sizes**: xs (12), sm (14), md (16), lg (18), xl (20), xxl (24), xxxl (32)
- **Font Weights**: regular (400), medium (500), semibold (600), bold (700)

### Spacing
- **xs**: 4, **sm**: 8, **md**: 12, **lg**: 16, **xl**: 24, **xxl**: 32, **xxxl**: 48

### Border Radius
- **sm**: 4, **md**: 8, **lg**: 12, **xl**: 16, **xxl**: 24, **full**: 9999

## 🔑 Key Features Implemented

### ✅ Authentication
- Onboarding flow with 3 slides
- Email/password login
- Google Sign-In (placeholder)
- Persistent sessions with AsyncStorage
- Protected routes

### ✅ Social Features
- **Posts**: Like, comment, share with optimistic updates
- **Follow/Unfollow**: On PostCard and post detail with animations
- **Comments**: Real-time posting with emoji support
- **Stories**: Instagram-style story circles
- **Notifications**: Grouped by read/unread status

### ✅ Messaging
- **Inbox**: Active users row (Instagram style)
- **Chat**: 
  - Text messages with delivery receipts (✓ sent, ✓✓ read)
  - Emoji picker integration
  - Typing indicator with animated dots
  - Image attachment support (picker integrated)
  - Earn money while chatting

### ✅ Wallet System
- Track earnings from:
  - Chatting (0.5 per message)
  - Comments (0.25 per comment)
  - Posts, likes, referrals
- Transaction history
- Balance display
- Persistent storage

### ✅ Voice & Video Calls
- Call screen UI with:
  - Audio/video toggle
  - Mute/unmute
  - Call duration timer
  - Local video preview
- **Call Recording Consent Modal**:
  - Explicit user consent required
  - Clear privacy notice
  - "REC" indicator during recording
  - Compliant with privacy regulations

### ✅ UI/UX Enhancements
- Pull-to-refresh on home feed
- Skeleton loaders for posts and comments
- Toast notifications for user feedback
- Smooth animations (scale, fade, slide)
- Emoji picker for comments and chat
- Verified badges for users

## 🔌 Backend Integration

### API Service Layer (`services/api.ts`)

The app includes a complete API service ready for backend integration:

```typescript
import api from '@/services/api';

// Authentication
await api.login(email, password);
await api.register(name, username, email, password);

// Social
await api.followUser(userId);
await api.likePost(postId);
await api.createComment(postId, text);

// Messaging
await api.sendMessage(recipientId, text, attachments);
await api.getMessages(conversationId);

// Wallet
await api.getWalletBalance();
await api.getTransactions();

// Upload
await api.uploadImage(uri);
```

### Environment Variables

Create a `.env` file:

```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Backend Requirements

The backend should provide these endpoints:

#### Auth
- `POST /auth/login` - Email/password login
- `POST /auth/register` - User registration
- `POST /auth/google` - Google OAuth

#### Users
- `POST /users/:id/follow` - Follow user
- `POST /users/:id/unfollow` - Unfollow user
- `GET /users/:id` - Get user profile

#### Posts
- `GET /posts` - Get feed posts (paginated)
- `GET /posts/:id` - Get single post
- `POST /posts/:id/like` - Like post
- `POST /posts/:id/unlike` - Unlike post
- `GET /posts/:id/comments` - Get comments
- `POST /posts/:id/comments` - Create comment

#### Messages
- `GET /messages/conversations` - Get chat list
- `GET /messages/conversations/:id` - Get messages
- `POST /messages` - Send message

#### Wallet
- `GET /wallet/balance` - Get balance
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/earn` - Add earnings

#### Upload
- `POST /upload` - Upload image/file

### WebSocket Events (Socket.IO)

For real-time features:

```typescript
// Emit
socket.emit('message:new', { conversationId, text });
socket.emit('typing:start', { conversationId });
socket.emit('typing:stop', { conversationId });

// Listen
socket.on('message:new', (message) => {});
socket.on('message:delivered', (messageId) => {});
socket.on('message:seen', (messageId) => {});
socket.on('typing:start', (userId) => {});
socket.on('typing:stop', (userId) => {});
socket.on('call:incoming', (callData) => {});
```

## 🧪 Testing

### Running the App

```bash
# Install dependencies
bun install

# Start development server
bun start

# Run on iOS
bun ios

# Run on Android
bun android

# Run on web
bun web
```

### Test Accounts

Use mock data from `data/mockData.ts`:
- Email: any@example.com
- Password: any

## 📱 Platform Compatibility

### Web Support
- All core features work on web
- Image picker uses web file input
- Haptics are disabled on web
- Camera uses web MediaDevices API

### Mobile (iOS/Android)
- Full native experience
- Haptic feedback
- Native image picker
- Push notifications ready

## 🚀 Deployment

### Expo Go
The app runs in Expo Go (SDK 53) without custom native modules.

### Production Build
For production, use EAS Build:

```bash
eas build --platform ios
eas build --platform android
```

## 🔐 Privacy & Compliance

### Call Recording
- **Explicit Consent**: Modal shown before recording
- **Visual Indicator**: "REC" badge during recording
- **Data Storage**: Recordings stored with user consent
- **Deletion Rights**: Users can request deletion
- **Privacy Policy**: Link provided in consent modal

### Data Collection
- User profiles and posts
- Messages (encrypted in transit)
- Wallet transactions
- Usage analytics (optional)

## 🐛 Known Issues & TODOs

### Current Limitations
- [ ] Backend not connected (using mock data)
- [ ] WebRTC not fully implemented (UI only)
- [ ] AI assistant (Lizzy) is placeholder
- [ ] No push notifications yet
- [ ] No image upload to cloud storage

### Future Enhancements
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Advanced search and filters
- [ ] Post creation with camera
- [ ] Story creation and viewing
- [ ] Group chats
- [ ] Voice messages
- [ ] Post analytics
- [ ] Referral system
- [ ] Withdrawal to bank account

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Query](https://tanstack.com/query/latest)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use existing design system
3. Add proper error handling
4. Include loading states
5. Test on both iOS and Android
6. Document new features

## 📄 License

Proprietary - All rights reserved
