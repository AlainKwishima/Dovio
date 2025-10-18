# Mobile Backend API Endpoints Inventory

## Authentication Endpoints (/api/auth)
- **POST** `/register` - Register new user (validate: registerSchema)
- **POST** `/login` - User login (validate: loginSchema)
- **POST** `/refresh-token` - Refresh JWT token
- **GET** `/verify-email` - Verify email with token
- **POST** `/forgot-password` - Request password reset
- **POST** `/reset-password` - Reset password with token
- **POST** `/2fa/request` - Request 2FA setup
- **POST** `/2fa/verify` - Verify 2FA code
- **POST** `/verify-password` - Verify password for sensitive actions (AUTH REQUIRED)
- **POST** `/logout` - User logout (AUTH REQUIRED)
- **PUT** `/change-password` - Change user password (AUTH REQUIRED)

## User Management (/api/users) - ALL REQUIRE AUTH
- **GET** `/profile` - Get user profile
- **PUT** `/profile` - Update user profile (validate: updateUserSchema)
- **DELETE** `/account` - Delete user account
- **PUT** `/wallet` - Update wallet balance (validate: updateWalletSchema)
- **GET** `/wallet/balance` - Get wallet balance
- **POST** `/wallet/send` - Send money to another user (validate: sendMoneySchema)
- **POST** `/wallet/withdraw` - Withdraw money (validate: withdrawMoneySchema)
- **POST** `/activity` - Add recent activity (validate: addActivitySchema)
- **POST** `/active-time` - Add active time (validate: addActiveTimeSchema)
- **GET** `/activity-history` - Get activity history

## Posts (/api/posts)
- **GET** `/` - Get posts (PUBLIC, validate: paginationSchema)
- **GET** `/:postId` - Get single post (PUBLIC)
- **POST** `/` - Create post (AUTH REQUIRED, validate: createPostSchema)
- **PUT** `/:postId` - Update post (AUTH REQUIRED, validate: updatePostSchema)
- **DELETE** `/:postId` - Delete post (AUTH REQUIRED)

## Comments (/api/comments) - ALL REQUIRE AUTH
- **POST** `/` - Create comment (validate: createCommentSchema)
- **GET** `/` - Get comments (validate: getCommentsSchema)
- **PUT** `/:commentId` - Update comment (validate: updateCommentSchema)
- **DELETE** `/:commentId` - Delete comment
- **POST** `/:commentId/like` - Like/unlike comment
- **GET** `/:commentId/replies` - Get comment replies

## Reactions (/api/reactions) - ALL REQUIRE AUTH
- **POST** `/` - Add reaction (validate: addReactionSchema)
- **GET** `/:entityType/:entityId` - Get reactions for entity
- **GET** `/:entityType/:entityId/user` - Get user's reaction on entity

## Stories (/api/stories) - ALL REQUIRE AUTH
- **POST** `/` - Create story (validate: createStorySchema)
- **GET** `/` - Get stories (validate: getStoriesSchema)
- **GET** `/:storyId` - Get single story
- **DELETE** `/:storyId` - Delete story
- **GET** `/:storyId/viewers` - Get story viewers
- **GET** `/highlights/:userId` - Get user's story highlights
- **POST** `/highlights` - Create story highlight
- **PUT** `/highlights/:highlightId` - Update story highlight
- **DELETE** `/highlights/:highlightId` - Delete story highlight

## Messaging (/api/messaging) - ALL REQUIRE AUTH
- **POST** `/conversations` - Create conversation (validate: createConversationSchema)
- **GET** `/conversations` - Get user's conversations
- **GET** `/conversations/:conversationId` - Get conversation messages
- **POST** `/messages` - Send message (validate: sendMessageSchema)
- **PUT** `/messages/:messageId/read` - Mark message as read
- **PUT** `/conversations/:conversationId/read` - Mark conversation as read
- **PUT** `/messages/:messageId` - Update message (validate: updateMessageSchema)
- **DELETE** `/messages/:messageId` - Delete message

## Follow System (/api/follows) - ALL REQUIRE AUTH
- **POST** `/` - Follow user (validate: followSchema)
- **DELETE** `/:followeeId` - Unfollow user
- **GET** `/followers/:userId` - Get user's followers
- **GET** `/following/:userId` - Get users that user follows
- **GET** `/status/:userId` - Check follow status

## Feed (/api/feed) - ALL REQUIRE AUTH
- **GET** `/` - Get user's feed (validate: getFeedSchema)
- **GET** `/discover` - Get discover feed
- **GET** `/trending` - Get trending posts

## Search (/api/search) - ALL REQUIRE AUTH
- **GET** `/users` - Search users (validate: searchSchema)
- **GET** `/posts` - Search posts (validate: searchSchema)
- **GET** `/stories` - Search stories (validate: searchSchema)
- **GET** `/global` - Global search (validate: globalSearchSchema)
- **GET** `/suggested-users` - Get suggested users
- **GET** `/hashtags/:tag` - Search posts by hashtag
- **GET** `/hashtags/suggest` - Get hashtag suggestions
- **GET** `/hashtags/trending` - Get trending hashtags
- **GET** `/location` - Search by location

## Notifications (/api/notifications) - ALL REQUIRE AUTH
- **GET** `/` - Get user notifications (validate: getNotificationsSchema)
- **PUT** `/:notificationId/read` - Mark notification as read
- **PUT** `/read-all` - Mark all notifications as read
- **DELETE** `/:notificationId` - Delete notification

## Bookmarks & Tags (/api) - ALL REQUIRE AUTH
- **POST** `/posts/:postId/save` - Save/bookmark post (validate: savePostSchema)
- **GET** `/posts/saved` - Get saved posts
- **DELETE** `/posts/:postId/save` - Remove saved post
- **POST** `/posts/:postId/tags` - Tag user in post (validate: tagUserSchema)
- **GET** `/posts/:postId/tags` - Get post tags
- **PUT** `/tags/:tagId/approve` - Approve tag
- **DELETE** `/tags/:tagId/reject` - Reject tag
- **GET** `/tags/pending` - Get pending tags

## Messages (Legacy) (/api/messages) - REQUIRE AUTH
- **POST** `/` - Send message
- **GET** `/` - Get messages
- **PUT** `/:messageId` - Update message
- **DELETE** `/:messageId` - Delete message

## Shares (/api/shares) - REQUIRE AUTH
- **POST** `/` - Share post
- **GET** `/` - Get shares
- **DELETE** `/:shareId` - Delete share

## User Settings (/api/users) - REQUIRE AUTH
- Additional user settings endpoints (mounted on same /api/users path)

## System Endpoints
- **GET** `/health` - Health check (PUBLIC)
- **GET** `/api/docs` - Swagger API documentation (PUBLIC)

## Rate Limiting
- General rate limiting applied to all routes
- Specific auth rate limiting for `/api/auth` routes

## Security Features
- CORS configuration
- Helmet security headers
- MongoDB sanitization
- HTTP parameter pollution protection
- JWT authentication
- Input validation with Joi schemas