export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  followers: number;
  following: number;
  posts: number;
}

export interface Post {
  id: string;
  user: User;
  type: 'post' | 'article';
  image: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isLiked: boolean;
  title?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
}

export interface Story {
  id: string;
  user: User;
  image: string;
  isViewed: boolean;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Notification {
  id: string;
  user: User;
  type: 'like' | 'comment' | 'follow' | 'mention';
  post?: Post;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  source: 'chat' | 'post' | 'like' | 'comment' | 'referral';
  amount: number;
  timestamp: string;
  description: string;
}

export interface WalletData {
  balance: number;
  totalEarned: number;
  transactions: Transaction[];
}
