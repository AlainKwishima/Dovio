// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFARequest {
  secret?: string;
}

export interface TwoFAVerifyRequest {
  code: string;
  secret: string;
}

// Email Verification Types
export interface RequestVerifyEmailRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  isVerified: boolean;
  emailVerified?: boolean;
  followers: number;
  following: number;
  posts: number;
  wallet: WalletInfo;
  createdAt: string;
  updatedAt: string;
  isPrivate?: boolean;
  location?: string;
  website?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPrivate?: boolean;
  location?: string;
  website?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

// Wallet Types
export interface WalletInfo {
  balance: number;
  currency: string;
  totalEarned: number;
  totalSpent: number;
}

export interface UpdateWalletRequest {
  balance: number;
}

export interface SendMoneyRequest {
  recipientId: string;
  amount: number;
  message?: string;
}

export interface WithdrawMoneyRequest {
  amount: number;
  method: 'bank' | 'paypal' | 'crypto';
  details: Record<string, any>;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  source: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

// Activity Types
export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AddActivityRequest {
  type: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface AddActiveTimeRequest {
  startTime: string;
  endTime: string;
  activityType: string;
}

// Post Types
export interface Post {
  id: string;
  author: User;
  content: string;
  type: 'post' | 'article';
  media?: MediaFile[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  location?: string;
  visibility: 'public' | 'private' | 'followers';
}

export interface CreatePostRequest {
  content: string;
  type: 'post' | 'article';
  media?: MediaFile[];
  tags?: string[];
  location?: string;
  visibility?: 'public' | 'private' | 'followers';
}

export interface UpdatePostRequest {
  content?: string;
  tags?: string[];
  location?: string;
  visibility?: 'public' | 'private' | 'followers';
}

export interface MediaFile {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  size: number;
}

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  likes: number;
  replies: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface GetCommentsRequest {
  postId: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

// Reaction Types
export interface Reaction {
  id: string;
  userId: string;
  entityType: 'post' | 'comment' | 'story';
  entityId: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad';
  createdAt: string;
}

export interface AddReactionRequest {
  entityType: 'post' | 'comment' | 'story';
  entityId: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad';
}

// Story Types
export interface Story {
  id: string;
  author: User;
  media: MediaFile;
  content?: string;
  views: number;
  viewers: StoryViewer[];
  isViewed: boolean;
  createdAt: string;
  expiresAt: string;
  isHighlight: boolean;
  highlightTitle?: string;
}

export interface StoryViewer {
  id: string;
  user: User;
  viewedAt: string;
}

export interface CreateStoryRequest {
  media: MediaFile;
  content?: string;
  duration?: number;
}

export interface StoryHighlight {
  id: string;
  userId: string;
  title: string;
  coverImage: string;
  stories: Story[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryHighlightRequest {
  title: string;
  storyIds: string[];
  coverImage?: string;
}

// Messaging Types
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media?: MediaFile;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  replyTo?: Message;
  reactions?: Reaction[];
}

export interface CreateConversationRequest {
  participantIds: string[];
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media?: MediaFile;
  replyToId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

// Follow Types
export interface Follow {
  id: string;
  follower: User;
  followee: User;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface FollowRequest {
  userId: string;
}

export interface FollowStatus {
  isFollowing: boolean;
  isFollowed: boolean;
  isPending: boolean;
}

// Feed Types
export interface GetFeedRequest {
  page?: number;
  limit?: number;
  type?: 'all' | 'following' | 'discover';
}

// Search Types
export interface SearchRequest {
  query: string;
  page?: number;
  limit?: number;
}

export interface GlobalSearchRequest extends SearchRequest {
  type?: 'all' | 'users' | 'posts' | 'stories' | 'hashtags';
}

export interface SearchResult<T> {
  type: string;
  data: T;
  score: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsRequest {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

// Bookmark & Tag Types
export interface SavePostRequest {
  postId: string;
  collectionId?: string;
}

export interface TagUserRequest {
  postId: string;
  userId: string;
  x: number;
  y: number;
}

export interface Tag {
  id: string;
  postId: string;
  tagger: User;
  tagged: User;
  x: number;
  y: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Share Types
export interface Share {
  id: string;
  postId: string;
  userId: string;
  type: 'repost' | 'story' | 'message';
  content?: string;
  createdAt: string;
}

export interface CreateShareRequest {
  postId: string;
  type: 'repost' | 'story' | 'message';
  content?: string;
  recipientId?: string;
}

// Hashtag Types
export interface Hashtag {
  id: string;
  name: string;
  count: number;
  trending: boolean;
  createdAt: string;
}

// Location Types
export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  postsCount: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Upload Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}