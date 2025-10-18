// @ts-nocheck
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { 
  User as UserProfile,
  UpdateUserRequest as UpdateProfileRequest,
  SearchRequest,
  Notification,
  Activity as UserActivityResponse,
  FollowRequest,
} from '@/types/api';
import { ErrorHandler, withLoadingState, handleApiError } from '../utils/errorHandler';

interface UserManagementState {
  // User profiles
  userProfiles: Record<string, UserProfile>;
  currentUserProfile: UserProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  
  // Search functionality
  searchResults: {
    users: UserProfile[];
    posts: any[];
    stories: any[];
  };
  searchHistory: string[];
  isSearching: boolean;
  searchError: string | null;
  
  // User relationships
  followers: Record<string, UserProfile[]>;
  following: Record<string, UserProfile[]>;
  followRequests: FollowResponse[];
  isLoadingRelationships: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  isLoadingNotifications: boolean;
  
  // User activity and stats
  userActivity: Record<string, UserActivityResponse[]>;
  userStats: Record<string, UserStatsResponse>;
  
  // Profile operations
  updateProfile: (profileData: UpdateProfileRequest) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<void>;
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
  
  // Search operations
  searchUsers: (query: string) => Promise<UserProfile[]>;
  searchPosts: (query: string) => Promise<any[]>;
  searchStories: (query: string) => Promise<any[]>;
  performGlobalSearch: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  
  // Relationship management
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  acceptFollowRequest: (requestId: string) => Promise<boolean>;
  rejectFollowRequest: (requestId: string) => Promise<boolean>;
  getFollowers: (userId: string) => Promise<void>;
  getFollowing: (userId: string) => Promise<void>;
  getFollowRequests: () => Promise<void>;
  
  // Notifications
  getNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // User activity and stats
  getUserActivity: (userId: string, page?: number) => Promise<void>;
  getUserStats: (userId: string) => Promise<void>;
  
  // User management
  blockUser: (userId: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  reportUser: (userId: string, reason: string) => Promise<boolean>;
  
  // Utility
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export const [UserManagementProvider, useUserManagement] = createContextHook<UserManagementState>(() => {
  // User profiles state
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<{
    users: UserProfile[];
    posts: any[];
    stories: any[];
  }>({
    users: [],
    posts: [],
    stories: [],
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // User relationships state
  const [followers, setFollowers] = useState<Record<string, UserProfile[]>>({});
  const [following, setFollowing] = useState<Record<string, UserProfile[]>>({});
  const [followRequests, setFollowRequests] = useState<FollowResponse[]>([]);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // User activity and stats state
  const [userActivity, setUserActivity] = useState<Record<string, UserActivityResponse[]>>({});
  const [userStats, setUserStats] = useState<Record<string, UserStatsResponse>>({});
  
  // Initialize user management data on mount
  useEffect(() => {
    const initializeUserManagement = async () => {
      await Promise.all([
        refreshProfile(),
        getNotifications(),
        getFollowRequests(),
      ]);
    };
    
    initializeUserManagement();
  }, []);
  
  // Profile operations
  const updateProfile = useCallback(async (profileData: UpdateProfileRequest): Promise<UserProfile | null> => {
    return withLoadingState(async () => {
      const response = await api.updateUserProfile(profileData);
      if (response?.data) {
        setCurrentUserProfile(response.data);
        setUserProfiles(prev => ({
          ...prev,
          [response.data.id]: response.data
        }));
        return response.data;
      }
      return null;
    }, setIsLoadingProfile, setProfileError);
  }, []);
  
  const refreshProfile = useCallback(async (): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getUserProfile();
      if (response?.data) {
        setCurrentUserProfile(response.data);
        setUserProfiles(prev => ({
          ...prev,
          [response.data.id]: response.data
        }));
      }
    }, setIsLoadingProfile, setProfileError);
  }, []);
  
  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      // Check if we already have the profile cached
      if (userProfiles[userId]) {
        return userProfiles[userId];
      }
      
      const response = await api.getUserProfile(userId);
      if (response?.data) {
        setUserProfiles(prev => ({
          ...prev,
          [userId]: response.data
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      handleApiError(error, setProfileError);
      return null;
    }
  }, [userProfiles]);
  
  // Search operations
  const searchUsers = useCallback(async (query: string): Promise<UserProfile[]> => {
    try {
      const response = await api.searchUsers({ query });
      return response?.data || [];
    } catch (error) {
      handleApiError(error, setSearchError);
      return [];
    }
  }, []);
  
  const searchPosts = useCallback(async (query: string): Promise<any[]> => {
    try {
      const response = await api.searchPosts({ query });
      return response?.data || [];
    } catch (error) {
      handleApiError(error, setSearchError);
      return [];
    }
  }, []);
  
  const searchStories = useCallback(async (query: string): Promise<any[]> => {
    try {
      const response = await api.searchStories({ query });
      return response?.data || [];
    } catch (error) {
      handleApiError(error, setSearchError);
      return [];
    }
  }, []);
  
  const performGlobalSearch = useCallback(async (query: string): Promise<void> => {
    await withLoadingState(async () => {
      const [users, posts, stories] = await Promise.all([
        searchUsers(query),
        searchPosts(query),
        searchStories(query),
      ]);
      
      setSearchResults({
        users,
        posts,
        stories,
      });
      
      addToSearchHistory(query);
    }, setIsSearching, setSearchError);
  }, [searchUsers, searchPosts, searchStories]);
  
  const clearSearchResults = useCallback(() => {
    setSearchResults({
      users: [],
      posts: [],
      stories: [],
    });
  }, []);
  
  const addToSearchHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, 10); // Keep only last 10 searches
    });
  }, []);
  
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);
  
  // Relationship management
  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await api.followUser({ userId });
      if (response) {
        // Update user profile to reflect follow status
        setUserProfiles(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isFollowing: true,
            followerCount: (prev[userId]?.followerCount || 0) + 1,
          }
        }));
        
        // Update current user's following count
        if (currentUserProfile) {
          setCurrentUserProfile(prev => prev ? {
            ...prev,
            followingCount: prev.followingCount + 1,
          } : null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, [currentUserProfile]);
  
  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const success = await api.unfollowUser(userId);
      if (success) {
        // Update user profile to reflect unfollow status
        setUserProfiles(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isFollowing: false,
            followerCount: Math.max(0, (prev[userId]?.followerCount || 1) - 1),
          }
        }));
        
        // Update current user's following count
        if (currentUserProfile) {
          setCurrentUserProfile(prev => prev ? {
            ...prev,
            followingCount: Math.max(0, prev.followingCount - 1),
          } : null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, [currentUserProfile]);
  
  const acceptFollowRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const response = await api.acceptFollowRequest(requestId);
      if (response) {
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, []);
  
  const rejectFollowRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const success = await api.rejectFollowRequest(requestId);
      if (success) {
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, []);
  
  const getFollowers = useCallback(async (userId: string): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getFollowers(userId);
      if (response?.data) {
        setFollowers(prev => ({
          ...prev,
          [userId]: response.data
        }));
      }
    }, setIsLoadingRelationships, setProfileError);
  }, []);
  
  const getFollowing = useCallback(async (userId: string): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getFollowing(userId);
      if (response?.data) {
        setFollowing(prev => ({
          ...prev,
          [userId]: response.data
        }));
      }
    }, setIsLoadingRelationships, setProfileError);
  }, []);
  
  const getFollowRequests = useCallback(async (): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getFollowRequests();
      if (response?.data) {
        setFollowRequests(response.data);
      }
    }, setIsLoadingRelationships, setProfileError);
  }, []);
  
  // Notifications
  const getNotifications = useCallback(async (): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getNotifications({ page: 1, limit: 50 });
      const items = response?.data?.data || [];
      setNotifications(items as any);
      setUnreadNotificationCount(items.filter((n: any) => !n.isRead).length);
    }, setIsLoadingNotifications, setProfileError);
  }, []);
  
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      ));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      handleApiError(error, setProfileError);
    }
  }, []);
  
  const markAllNotificationsAsRead = useCallback(async (): Promise<void> => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })) as any);
      setUnreadNotificationCount(0);
    } catch (error) {
      handleApiError(error, setProfileError);
    }
  }, []);
  
  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const success = await api.deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const filtered = prev.filter(n => n.id !== notificationId);
          
          // Update unread count if the deleted notification was unread
          if (notification && !notification.isRead) {
            setUnreadNotificationCount(count => Math.max(0, count - 1));
          }
          
          return filtered;
        });
      }
    } catch (error) {
      handleApiError(error, setProfileError);
    }
  }, []);
  
  // User activity and stats
  const getUserActivity = useCallback(async (userId: string, page: number = 1): Promise<void> => {
    try {
      const response = await api.getUserActivity(userId, { page, limit: 20 });
      if (response?.data) {
        setUserActivity(prev => ({
          ...prev,
          [userId]: page === 1 ? response.data : [...(prev[userId] || []), ...response.data]
        }));
      }
    } catch (error) {
      handleApiError(error, setProfileError);
    }
  }, []);
  
  const getUserStats = useCallback(async (userId: string): Promise<void> => {
    try {
      const response = await api.getUserStats(userId);
      if (response?.data) {
        setUserStats(prev => ({
          ...prev,
          [userId]: response.data
        }));
      }
    } catch (error) {
      handleApiError(error, setProfileError);
    }
  }, []);
  
  // User management actions
  const blockUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await api.blockUser({ userId });
      if (response) {
        // Update user profile to reflect blocked status
        setUserProfiles(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isBlocked: true,
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, []);
  
  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const success = await api.unblockUser(userId);
      if (success) {
        // Update user profile to reflect unblocked status
        setUserProfiles(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isBlocked: false,
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, []);
  
  const reportUser = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    try {
      const response = await api.reportUser({ userId, reason });
      return !!response;
    } catch (error) {
      handleApiError(error, setProfileError);
      return false;
    }
  }, []);
  
  // Utility functions
  const clearError = useCallback(() => {
    setProfileError(null);
    setSearchError(null);
  }, []);
  
  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([
      refreshProfile(),
      getNotifications(),
      getFollowRequests(),
    ]);
  }, [refreshProfile, getNotifications, getFollowRequests]);
  
  return useMemo(
    () => ({
      // User profiles
      userProfiles,
      currentUserProfile,
      isLoadingProfile,
      profileError,
      
      // Search functionality
      searchResults,
      searchHistory,
      isSearching,
      searchError,
      
      // User relationships
      followers,
      following,
      followRequests,
      isLoadingRelationships,
      
      // Notifications
      notifications,
      unreadNotificationCount,
      isLoadingNotifications,
      
      // User activity and stats
      userActivity,
      userStats,
      
      // Profile operations
      updateProfile,
      refreshProfile,
      getUserProfile,
      
      // Search operations
      searchUsers,
      searchPosts,
      searchStories,
      performGlobalSearch,
      clearSearchResults,
      addToSearchHistory,
      clearSearchHistory,
      
      // Relationship management
      followUser,
      unfollowUser,
      acceptFollowRequest,
      rejectFollowRequest,
      getFollowers,
      getFollowing,
      getFollowRequests,
      
      // Notifications
      getNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      
      // User activity and stats
      getUserActivity,
      getUserStats,
      
      // User management
      blockUser,
      unblockUser,
      reportUser,
      
      // Utility
      clearError,
      refreshAll,
    }),
    [
      userProfiles,
      currentUserProfile,
      isLoadingProfile,
      profileError,
      searchResults,
      searchHistory,
      isSearching,
      searchError,
      followers,
      following,
      followRequests,
      isLoadingRelationships,
      notifications,
      unreadNotificationCount,
      isLoadingNotifications,
      userActivity,
      userStats,
      updateProfile,
      refreshProfile,
      getUserProfile,
      searchUsers,
      searchPosts,
      searchStories,
      performGlobalSearch,
      clearSearchResults,
      addToSearchHistory,
      clearSearchHistory,
      followUser,
      unfollowUser,
      acceptFollowRequest,
      rejectFollowRequest,
      getFollowers,
      getFollowing,
      getFollowRequests,
      getNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      getUserActivity,
      getUserStats,
      blockUser,
      unblockUser,
      reportUser,
      clearError,
      refreshAll,
    ]
  );
});