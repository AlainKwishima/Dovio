import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getHostFromExpo(): string | null {
  // Expo Go provides debuggerHost like "192.168.1.10:19000"
  const host = (Constants as any)?.expoGoConfig?.debuggerHost || (Constants as any)?.expoGoConfig?.hostUri;
  if (typeof host === 'string') {
    return host.split(':')[0];
  }
  return null;
}

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) return envUrl;

  const host = getHostFromExpo();
  const port = process.env.EXPO_PUBLIC_API_PORT || '5000';

  if (host) {
    return `http://${host}:${port}`;
  }

  // Emulators/simulators fallback
  if (Platform.OS === 'android') return `http://10.0.2.2:${port}`;
  return `http://localhost:${port}`;
}

function resolveWsUrl(): string {
  const envWs = process.env.EXPO_PUBLIC_WS_URL;
  if (envWs && envWs.trim().length > 0) return envWs;

  const host = getHostFromExpo() || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  const port = process.env.EXPO_PUBLIC_WS_PORT || '3001';
  return `ws://${host}:${port}`;
}

export const API_CONFIG = {
  BASE_URL: resolveBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  WEBSOCKET_URL: resolveWsUrl(),
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    TWO_FA_REQUEST: '/api/auth/2fa/request',
    TWO_FA_VERIFY: '/api/auth/2fa/verify',
    VERIFY_PASSWORD: '/api/auth/verify-password',
    LOGOUT: '/api/auth/logout',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // User Management
  USERS: {
    PROFILE: '/api/users/profile',
    ACCOUNT: '/api/users/account',
    WALLET: '/api/users/wallet',
    WALLET_BALANCE: '/api/users/wallet/balance',
    WALLET_SEND: '/api/users/wallet/send',
    WALLET_WITHDRAW: '/api/users/wallet/withdraw',
    ACTIVITY: '/api/users/activity',
    ACTIVE_TIME: '/api/users/active-time',
    ACTIVITY_HISTORY: '/api/users/activity-history',
  },

  // Posts
  POSTS: {
    BASE: '/api/posts',
    SAVED: '/api/posts/saved',
    SAVE: (postId: string) => `/api/posts/${postId}/save`,
    TAGS: (postId: string) => `/api/posts/${postId}/tags`,
  },

  // Comments
  COMMENTS: {
    BASE: '/api/comments',
    LIKE: (commentId: string) => `/api/comments/${commentId}/like`,
    REPLIES: (commentId: string) => `/api/comments/${commentId}/replies`,
  },

  // Reactions
  REACTIONS: {
    BASE: '/api/reactions',
    FOR_ENTITY: (entityType: string, entityId: string) => `/api/reactions/${entityType}/${entityId}`,
    USER_REACTION: (entityType: string, entityId: string) => `/api/reactions/${entityType}/${entityId}/user`,
  },

  // Stories
  STORIES: {
    BASE: '/api/stories',
    VIEWERS: (storyId: string) => `/api/stories/${storyId}/viewers`,
    HIGHLIGHTS: (userId: string) => `/api/stories/highlights/${userId}`,
    HIGHLIGHTS_BASE: '/api/stories/highlights',
  },

  // Messaging
  MESSAGING: {
    CONVERSATIONS: '/api/messaging/conversations',
    MESSAGES: '/api/messaging/messages',
    CONVERSATION: (conversationId: string) => `/api/messaging/conversations/${conversationId}`,
    MESSAGE_READ: (messageId: string) => `/api/messaging/messages/${messageId}/read`,
    CONVERSATION_READ: (conversationId: string) => `/api/messaging/conversations/${conversationId}/read`,
    MESSAGE_UPDATE: (messageId: string) => `/api/messaging/messages/${messageId}`,
  },

  // Follow System
  FOLLOWS: {
    BASE: '/api/follows',
    UNFOLLOW: (followeeId: string) => `/api/follows/${followeeId}`,
    FOLLOWERS: (userId: string) => `/api/follows/followers/${userId}`,
    FOLLOWING: (userId: string) => `/api/follows/following/${userId}`,
    STATUS: (userId: string) => `/api/follows/status/${userId}`,
  },

  // Feed
  FEED: {
    BASE: '/api/feed',
    DISCOVER: '/api/feed/discover',
    TRENDING: '/api/feed/trending',
  },

  // Search
  SEARCH: {
    USERS: '/api/search/users',
    POSTS: '/api/search/posts',
    STORIES: '/api/search/stories',
    GLOBAL: '/api/search/global',
    SUGGESTED_USERS: '/api/search/suggested-users',
    HASHTAGS: (tag: string) => `/api/search/hashtags/${tag}`,
    HASHTAGS_SUGGEST: '/api/search/hashtags/suggest',
    HASHTAGS_TRENDING: '/api/search/hashtags/trending',
    LOCATION: '/api/search/location',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    READ: (notificationId: string) => `/api/notifications/${notificationId}/read`,
    READ_ALL: '/api/notifications/read-all',
  },

  // Shares
  SHARES: {
    BASE: '/api/shares',
  },

  // Tags
  TAGS: {
    APPROVE: (tagId: string) => `/api/tags/${tagId}/approve`,
    REJECT: (tagId: string) => `/api/tags/${tagId}/reject`,
    PENDING: '/api/tags/pending',
  },

  // System
  HEALTH: '/health',
  DOCS: '/api/docs',
} as const;

// Dev visibility for quick debugging
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[API] BASE_URL:', API_CONFIG.BASE_URL);
}
