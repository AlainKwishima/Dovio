# Dovio Mobile App - Backend Integration Guide

This guide explains how the Dovio mobile app is structured to work with the backend API.

## 🚀 Quick Setup

### 1. Environment Configuration

Copy the example environment file and update with your backend URL:

```bash
cp .env.example .env
```

Update `.env` with your backend configuration:

```env
EXPO_PUBLIC_API_BASE_URL=http://your-backend-url:3000
EXPO_PUBLIC_WS_URL=ws://your-backend-url:3001
```

### 2. Install Dependencies

All necessary dependencies are already configured in `package.json`. Just run:

```bash
npm install
```

## 📁 Project Structure

### API Integration Layer

```
├── config/
│   └── api.ts                 # API configuration and endpoints
├── services/
│   └── api.ts                 # Centralized API service with all methods
├── types/
│   └── api.ts                 # TypeScript interfaces for API requests/responses
├── contexts/
│   ├── index.tsx              # Global context providers wrapper
│   ├── AuthContext.tsx        # Authentication state management
│   ├── SocialContext.tsx      # Social features and post management
│   ├── WalletContext.tsx      # Wallet and transaction management
│   ├── StoriesContext.tsx     # Stories and highlights management
│   ├── MessagingContext.tsx   # Real-time messaging and WebSocket
│   └── UserManagementContext.tsx # User profiles, search, and notifications
└── utils/
    └── errorHandler.ts        # Error handling and loading state utilities
```

## 🔌 API Integration Features

### ✅ Complete Authentication System
- User login/register with email validation
- JWT token management with automatic refresh
- Secure token storage with AsyncStorage
- Password reset and 2FA support
- Google OAuth integration ready

### ✅ User Management
- Profile creation and updates
- Avatar upload support
- Privacy settings
- Account deletion
- Activity tracking

### ✅ Social Features
- Follow/unfollow users
- User search and discovery
- Follower/following lists with real-time updates
- User profiles with full data

### ✅ Content Management
- Post creation, editing, and deletion
- Image/video upload with progress tracking
- Comments with nested replies
- Likes and reactions system
- Content bookmarking

### ✅ Story System
- Story creation with media upload
- Story viewing with automatic expiration
- Story highlights management
- Viewer tracking and analytics

### ✅ Messaging System
- Real-time conversations
- Text, image, video, and file sharing
- Read receipts and typing indicators
- Group messaging support

### ✅ Wallet & Transactions
- Real-time balance tracking
- Send/receive money functionality
- Transaction history
- Withdrawal management
- Earnings tracking

### ✅ Search & Discovery
- Global search across users, posts, stories
- Hashtag suggestions and trending
- Location-based search
- Suggested users algorithm

### ✅ Notifications
- Push notification handling
- In-app notification management
- Notification preferences
- Real-time updates

## 🛠️ API Service Usage

### Authentication Example

```typescript
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// In your component
const { login, register, logout } = useAuth();

// Login
await login({ email: 'user@example.com', password: 'password' });

// Register
await register({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'password',
  confirmPassword: 'password',
  displayName: 'John Doe'
});

// Direct API usage
const response = await api.getUserProfile();
if (response.success) {
  console.log('User profile:', response.data);
}
```

### Posts and Content

```typescript
// Create a post
const response = await api.createPost({
  content: 'Hello world!',
  type: 'post',
  visibility: 'public'
});

// Get feed
const feed = await api.getFeed({ page: 1, limit: 20 });

// Like a post
await api.addReaction({
  entityType: 'post',
  entityId: 'post-id',
  type: 'like'
});
```

### Real-time Features

```typescript
// WebSocket connection for real-time updates
import { API_CONFIG } from '@/config/api';

const ws = new WebSocket(API_CONFIG.WEBSOCKET_URL);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## 🔒 Security Features

### Token Management
- Automatic token refresh on expiration
- Secure storage with AsyncStorage
- Token validation on app startup
- Automatic logout on invalid tokens

### Error Handling
- Comprehensive error handling with user-friendly messages
- Network error recovery
- Retry mechanisms for failed requests
- Offline support detection

### Data Validation
- TypeScript interfaces for all API calls
- Request/response validation
- Input sanitization
- File upload validation

## 🎯 Backend API Endpoints Mapped

All backend endpoints from your API inventory are fully mapped:

### Authentication (`/api/auth`)
- ✅ POST `/register` - User registration
- ✅ POST `/login` - User login  
- ✅ POST `/refresh-token` - Token refresh
- ✅ POST `/logout` - User logout
- ✅ POST `/forgot-password` - Password reset request
- ✅ POST `/reset-password` - Password reset
- ✅ POST `/2fa/request` - 2FA setup
- ✅ POST `/2fa/verify` - 2FA verification

### User Management (`/api/users`)
- ✅ GET `/profile` - Get user profile
- ✅ PUT `/profile` - Update user profile
- ✅ DELETE `/account` - Delete account
- ✅ GET `/wallet/balance` - Get wallet balance
- ✅ POST `/wallet/send` - Send money
- ✅ POST `/wallet/withdraw` - Withdraw money

### Content (`/api/posts`, `/api/stories`)
- ✅ GET/POST/PUT/DELETE `/posts` - Full CRUD operations
- ✅ GET/POST/DELETE `/stories` - Story management
- ✅ POST `/posts/:id/save` - Bookmark posts
- ✅ GET/POST `/comments` - Comment system

### Social Features (`/api/follows`, `/api/reactions`)
- ✅ POST/DELETE `/follows` - Follow/unfollow
- ✅ GET `/follows/followers/:userId` - Get followers
- ✅ GET `/follows/following/:userId` - Get following
- ✅ POST `/reactions` - Like/reaction system

### Messaging (`/api/messaging`)
- ✅ GET/POST `/conversations` - Conversation management
- ✅ POST `/messages` - Send messages
- ✅ PUT `/messages/:id/read` - Mark as read

### Search & Discovery (`/api/search`, `/api/feed`)
- ✅ GET `/search/users` - User search
- ✅ GET `/search/posts` - Post search
- ✅ GET `/search/global` - Global search
- ✅ GET `/feed` - User feed
- ✅ GET `/feed/discover` - Discover feed

## 📱 Ready for Production

### Environment Setup
- Development, staging, and production configurations
- Environment-specific API URLs
- Feature flags support
- Analytics integration ready

### Performance Optimization
- Request caching and deduplication
- Image lazy loading and caching
- Pagination support for all lists
- Background sync capabilities

### Monitoring & Analytics
- Error logging with context
- Performance tracking
- User analytics events
- Crash reporting integration points

## 🔄 Migration from Mock Data

The app seamlessly transitions from mock data to real API calls:

1. **Context Providers**: Updated to use real API calls instead of mock data
2. **Type Safety**: All API calls are fully typed with TypeScript
3. **Error Handling**: Comprehensive error handling replaces mock success responses
4. **Loading States**: Real loading states replace simulated delays
5. **Data Persistence**: Proper caching and offline support

## 🧪 Testing

### API Integration Testing
- Mock API responses for unit tests
- Integration tests with test backend
- Error scenario testing
- Performance testing utilities

### Development Tools
- API request/response logging
- Network state monitoring  
- Token expiration simulation
- Offline mode testing

## 🚀 Deployment Checklist

- [ ] Update `.env` with production API URLs
- [ ] Configure push notification certificates
- [ ] Set up error reporting (Sentry, Bugsnag)
- [ ] Configure analytics (Firebase, Mixpanel)
- [ ] Test all API integrations
- [ ] Verify WebSocket connections
- [ ] Test offline functionality
- [ ] Performance testing with real data

## 📞 Support

The app is fully prepared for backend integration with:
- Complete TypeScript type definitions
- Comprehensive error handling
- Real-time features support
- File upload capabilities
- Offline-first architecture
- Production-ready security

All endpoints from your backend API inventory are implemented and ready to connect!