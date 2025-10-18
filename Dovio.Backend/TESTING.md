# 🧪 Backend Testing Guide

This guide covers all the testing options available for your mobile backend API.

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Comprehensive Test Suite
```bash
npm run test:all
```

## 📋 Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all existing tests (Jest) |
| `npm run test:all` | Run comprehensive test suite with detailed reporting |
| `npm run test:features` | Test all implemented features |
| `npm run test:reactions` | Test reaction system specifically |
| `npm run test:new` | Test new features (feed, search, notifications) |
| `npm run test:watch` | Run tests in watch mode |

## 🎯 Test Coverage

### ✅ Implemented Features Tested

1. **Authentication & Authorization**
   - User registration
   - User login
   - JWT token validation
   - Password hashing
   - Email verification

2. **Profiles & Social Graph**
   - User profile management
   - Follow/unfollow system
   - Followers/following lists
   - Profile updates

3. **Posts & Media Upload**
   - Create posts
   - Get posts (with pagination)
   - Update posts
   - Delete posts
   - Media URL support

4. **Comments & Likes**
   - Create comments
   - Get comments
   - Update comments
   - Delete comments
   - Like/unlike comments
   - Nested comments (replies)

5. **Feed Generation**
   - Personalized feed (posts + stories)
   - Discover feed
   - Trending posts
   - Feed pagination

6. **DMs / Messaging**
   - Send messages
   - Get messages
   - Message conversations
   - Delete messages

7. **Stories (Ephemeral)**
   - Create stories
   - Get stories
   - View stories (with view tracking)
   - Delete stories
   - 24-hour expiration

8. **Notifications**
   - Get notifications
   - Mark as read
   - Mark all as read
   - Delete notifications
   - Unread count

9. **Search / Discovery**
   - User search
   - Post search
   - Story search
   - Global search
   - Suggested users

10. **Reaction System**
    - Post reactions (7 emoji types)
    - Story reactions (7 emoji types)
    - Comment reactions (7 emoji types)
    - Reaction toggle
    - Reaction removal
    - Reaction counts

11. **Post Sharing**
    - Share posts
    - Get shared posts
    - Delete shares

12. **Wallet Features**
    - Get wallet balance
    - Send money
    - Withdraw money
    - Transaction history

## 🧪 Test Files

### Core Test Files
- `tests/complete-features.e2e.test.js` - Tests all implemented features
- `tests/reactions.e2e.test.js` - Tests reaction system
- `tests/new-features.e2e.test.js` - Tests feed, search, notifications

### Existing Test Files
- `tests/auth.e2e.test.js` - Authentication tests
- `tests/security.e2e.test.js` - Security tests
- `tests/posts.authz.e2e.test.js` - Post authorization tests
- `tests/messages.authz.e2e.test.js` - Message authorization tests
- `tests/follows.duplicate.e2e.test.js` - Follow system tests

## 🔧 Test Configuration

### Jest Configuration
- **Environment**: Node.js with in-memory MongoDB
- **Timeout**: 30 seconds per test
- **Setup**: Automatic database connection/disconnection
- **Isolation**: Each test suite runs in isolation

### Test Database
- Uses MongoDB Memory Server for testing
- Automatic cleanup after each test suite
- No external database required

## 📊 Test Results

### Expected Output
```
✅ Passed: 8
❌ Failed: 0
⚠️  Skipped: 0
⏱️  Total Duration: 45.2s
📈 Success Rate: 100.0%
```

### Feature Coverage
- ✅ Authentication & Authorization
- ✅ Profiles & Social Graph
- ✅ Posts & Media Upload
- ✅ Comments & Likes
- ✅ Feed Generation
- ✅ DMs / Messaging
- ✅ Stories (Ephemeral)
- ✅ Notifications
- ✅ Search / Discovery
- ✅ Reaction System (7 emoji types)
- ✅ Post Sharing
- ✅ Wallet Features
- ✅ Security & Rate Limiting

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

2. **Dependencies Missing**
   ```bash
   npm install
   ```

3. **Environment Variables**
   ```bash
   # Copy and configure environment file
   cp env.example .env
   ```

4. **Test Timeout**
   ```bash
   # Increase timeout in jest.setup.js
   jest.setTimeout(60000);
   ```

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/complete-features.e2e.test.js
```

## 🎯 API Endpoints Tested

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Posts
- `POST /api/posts`
- `GET /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

### Stories
- `POST /api/stories`
- `GET /api/stories`
- `GET /api/stories/:id`
- `DELETE /api/stories/:id`

### Comments
- `POST /api/comments`
- `GET /api/comments`
- `PUT /api/comments/:id`
- `DELETE /api/comments/:id`
- `POST /api/comments/:id/like`

### Reactions
- `POST /api/reactions`
- `GET /api/reactions/:entityType/:entityId`
- `GET /api/reactions/:entityType/:entityId/user`

### Feed
- `GET /api/feed`
- `GET /api/feed/discover`
- `GET /api/feed/trending`

### Search
- `GET /api/search/users`
- `GET /api/search/posts`
- `GET /api/search/stories`
- `GET /api/search/global`
- `GET /api/search/suggested-users`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### Messages
- `POST /api/messages`
- `GET /api/messages`
- `DELETE /api/messages/:id`

### Wallet
- `GET /api/users/wallet/balance`
- `POST /api/users/wallet/send`
- `POST /api/users/wallet/withdraw`

## 🎉 Success Criteria

Your backend is ready for production when:
- ✅ All tests pass (100% success rate)
- ✅ No linting errors
- ✅ All features implemented and tested
- ✅ Security tests pass
- ✅ Performance tests pass

## 📈 Performance Benchmarks

### Expected Response Times
- Authentication: < 200ms
- CRUD Operations: < 100ms
- Search Queries: < 500ms
- Feed Generation: < 300ms
- Reaction Updates: < 50ms

### Load Testing
```bash
# Run load tests (if implemented)
npm run test:load
```

---

**🎯 Ready to test!** Run `npm test` to get started with comprehensive testing of your mobile backend API.

