// @ts-nocheck
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Post,
  User,
  PaginatedResponse,
  CreatePostRequest,
  UpdatePostRequest,
  Comment,
  CreateCommentRequest,
  AddReactionRequest,
  FollowRequest,
} from '@/types/api';
import { ErrorHandler, withLoadingState, handleApiError } from '../utils/errorHandler';

interface SocialState {
  // Post management
  posts: Post[];
  userPosts: Record<string, Post[]>;
  isLoadingPosts: boolean;
  postError: string | null;
  
  // User interactions
  followedUsers: Set<string>;
  likedPosts: Set<string>;
  bookmarkedPosts: Set<string>;
  
  // Loading states
  isLoadingFollow: Record<string, boolean>;
  isLoadingLike: Record<string, boolean>;
  isLoadingBookmark: Record<string, boolean>;
  
  // Post operations
  createPost: (postData: CreatePostRequest) => Promise<Post | null>;
  updatePost: (postId: string, postData: UpdatePostRequest) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<boolean>;
  getFeedPosts: (page?: number) => Promise<void>;
  getUserPosts: (userId: string, page?: number) => Promise<void>;
  
  // Comments
  getPostComments: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, comment: CreateCommentRequest) => Promise<Comment | null>;
  
  // Interactions
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<void>;
  isPostLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => Promise<void>;
  isPostBookmarked: (postId: string) => boolean;
  toggleBookmark: (postId: string) => Promise<void>;
  
  // User management
  searchUsers: (query: string) => Promise<User[]>;
  getUserProfile: (userId: string) => Promise<User | null>;
  
  // Utility
  refreshPosts: () => Promise<void>;
  clearError: () => void;
}

export const [SocialProvider, useSocial] = createContextHook<SocialState>(() => {
  // Post state
  const [posts, setPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Record<string, Post[]>>({});
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  
  // User interaction state
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  
  // Loading states for individual operations
  const [isLoadingFollow, setIsLoadingFollow] = useState<Record<string, boolean>>({});
  const [isLoadingLike, setIsLoadingLike] = useState<Record<string, boolean>>({});
  const [isLoadingBookmark, setIsLoadingBookmark] = useState<Record<string, boolean>>({});
  
  // Initialize user data on mount
  useEffect(() => {
    // Defer initializing user-specific lists until dedicated endpoints exist
  }, []);
  
  // Post operations
  const createPost = useCallback(async (postData: CreatePostRequest): Promise<Post | null> => {
    return withLoadingState(async () => {
      const response = await api.createPost(postData);
      if (response?.data) {
        setPosts(prev => [response.data, ...prev]);
        return response.data;
      }
      return null;
    }, setIsLoadingPosts, setPostError);
  }, []);
  
  const updatePost = useCallback(async (postId: string, postData: UpdatePostRequest): Promise<Post | null> => {
    return withLoadingState(async () => {
      const response = await api.updatePost(postId, postData);
      if (response?.data) {
        setPosts(prev => prev.map(post => post.id === postId ? response.data : post));
        // Update in userPosts as well
        setUserPosts(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(userId => {
            updated[userId] = updated[userId].map(post => post.id === postId ? response.data : post);
          });
          return updated;
        });
        return response.data;
      }
      return null;
    }, setIsLoadingPosts, setPostError);
  }, []);
  
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    return withLoadingState(async () => {
      const success = await api.deletePost(postId);
      if (success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        setUserPosts(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(userId => {
            updated[userId] = updated[userId].filter(post => post.id !== postId);
          });
          return updated;
        });
        return true;
      }
      return false;
    }, setIsLoadingPosts, setPostError);
  }, []);
  
  const getFeedPosts = useCallback(async (page: number = 1): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getFeed({ page, limit: 20 });
      const items = response?.data?.data || [];
      if (page === 1) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }
    }, setIsLoadingPosts, setPostError);
  }, []);
  
  const getUserPosts = useCallback(async (userId: string, page: number = 1): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getPosts({ page, limit: 20 });
      const items = response?.data?.data || [];
      setUserPosts(prev => ({
        ...prev,
        [userId]: page === 1 ? items : [...(prev[userId] || []), ...items]
      }));
    }, setIsLoadingPosts, setPostError);
  }, []);
  
  // Comment operations
  const getPostComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      const response = await api.getComments({ postId, page: 1, limit: 100 });
      return response?.data?.data || [];
    } catch (error) {
      handleApiError(error, setPostError);
      return [];
    }
  }, []);
  
  const addComment = useCallback(async (postId: string, comment: CreateCommentRequest): Promise<Comment | null> => {
    try {
      const response = await api.createComment({ postId, content: comment.content, parentId: comment.parentId });
      if (response?.data) {
        // Update post comment count
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
        ));
        return response.data;
      }
      return null;
    } catch (error) {
      handleApiError(error, setPostError);
      return null;
    }
  }, []);
  
  // User interaction helpers
  const isFollowing = useCallback((userId: string) => {
    return followedUsers.has(userId);
  }, [followedUsers]);
  
  const toggleFollow = useCallback(async (userId: string): Promise<void> => {
    const isCurrentlyFollowing = followedUsers.has(userId);
    
    // Optimistic update
    setFollowedUsers(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyFollowing) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
    
    // Set loading state
    setIsLoadingFollow(prev => ({ ...prev, [userId]: true }));
    
    try {
      let success = false;
      if (isCurrentlyFollowing) {
        success = await api.unfollowUser(userId);
      } else {
        const response = await api.followUser({ userId });
        success = !!response;
      }
      
      if (!success) {
        // Revert optimistic update on failure
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyFollowing) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
      handleApiError(error, setPostError);
    } finally {
      setIsLoadingFollow(prev => ({ ...prev, [userId]: false }));
    }
  }, [followedUsers]);
  
  const isPostLiked = useCallback((postId: string) => {
    return likedPosts.has(postId);
  }, [likedPosts]);
  
  const toggleLike = useCallback(async (postId: string): Promise<void> => {
    const isCurrentlyLiked = likedPosts.has(postId);
    
    // Optimistic update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    
    // Update post like count optimistically
    const updatePostLikes = (increment: number) => {
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, likes: Math.max(0, (post.likes || 0) + increment) } : post
      ));
    };
    
    updatePostLikes(isCurrentlyLiked ? -1 : 1);
    
    // Set loading state
    setIsLoadingLike(prev => ({ ...prev, [postId]: true }));
    
    try {
      let success = false;
      if (isCurrentlyLiked) {
        await api.unlikePost(postId);
        success = true;
      } else {
        await api.likePost(postId);
        success = true;
      }
      
      if (!success) {
        // Revert optimistic updates on failure
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        updatePostLikes(isCurrentlyLiked ? 1 : -1);
      }
    } catch (error) {
      // Revert optimistic updates on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      updatePostLikes(isCurrentlyLiked ? 1 : -1);
      handleApiError(error, setPostError);
    } finally {
      setIsLoadingLike(prev => ({ ...prev, [postId]: false }));
    }
  }, [likedPosts]);
  
  const isPostBookmarked = useCallback((postId: string) => {
    return bookmarkedPosts.has(postId);
  }, [bookmarkedPosts]);
  
  const toggleBookmark = useCallback(async (postId: string): Promise<void> => {
    const isCurrentlyBookmarked = bookmarkedPosts.has(postId);
    
    // Optimistic update
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyBookmarked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    
    // Set loading state
    setIsLoadingBookmark(prev => ({ ...prev, [postId]: true }));
    
    try {
      let success = false;
      if (isCurrentlyBookmarked) {
        await api.unsavePost(postId);
        success = true;
      } else {
        await api.savePost({ postId });
        success = true;
      }
      
      if (!success) {
        // Revert optimistic update on failure
        setBookmarkedPosts(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyBookmarked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyBookmarked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      handleApiError(error, setPostError);
    } finally {
      setIsLoadingBookmark(prev => ({ ...prev, [postId]: false }));
    }
  }, [bookmarkedPosts]);
  
  // User management
  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    try {
      const response = await api.searchUsers({ query });
      return response?.data || [];
    } catch (error) {
      handleApiError(error, setPostError);
      return [];
    }
  }, []);
  
  const getUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const response = await api.getUserProfile();
      return response?.data || null;
    } catch (error) {
      handleApiError(error, setPostError);
      return null;
    }
  }, []);
  
  // Utility functions
  const refreshPosts = useCallback(async (): Promise<void> => {
    await getFeedPosts(1);
  }, [getFeedPosts]);
  
  const clearError = useCallback(() => {
    setPostError(null);
  }, []);
  
  return useMemo(
    () => ({
      // Post data
      posts,
      userPosts,
      isLoadingPosts,
      postError,
      
      // User interactions
      followedUsers,
      likedPosts,
      bookmarkedPosts,
      
      // Loading states
      isLoadingFollow,
      isLoadingLike,
      isLoadingBookmark,
      
      // Post operations
      createPost,
      updatePost,
      deletePost,
      getFeedPosts,
      getUserPosts,
      
      // Comments
      getPostComments,
      addComment,
      
      // Interactions
      isFollowing,
      toggleFollow,
      isPostLiked,
      toggleLike,
      isPostBookmarked,
      toggleBookmark,
      
      // User management
      searchUsers,
      getUserProfile,
      
      // Utility
      refreshPosts,
      clearError,
    }),
    [
      posts,
      userPosts,
      isLoadingPosts,
      postError,
      followedUsers,
      likedPosts,
      bookmarkedPosts,
      isLoadingFollow,
      isLoadingLike,
      isLoadingBookmark,
      createPost,
      updatePost,
      deletePost,
      getFeedPosts,
      getUserPosts,
      getPostComments,
      addComment,
      isFollowing,
      toggleFollow,
      isPostLiked,
      toggleLike,
      isPostBookmarked,
      toggleBookmark,
      searchUsers,
      getUserProfile,
      refreshPosts,
      clearError,
    ]
  );
});
