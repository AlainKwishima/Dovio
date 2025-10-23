// @ts-nocheck
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  api,
  StoryResponse, 
  CreateStoryRequest,
  UpdateStoryRequest,
  StoryHighlight,
  CreateHighlightRequest,
  UpdateHighlightRequest
} from '../services/api';
import { handleApiError, withLoadingState } from '../utils/errorHandler';
import { useAuth } from './AuthContext';

interface StoriesState {
  // Story data
  stories: StoryResponse[];
  userStories: Record<string, StoryResponse[]>;
  highlights: StoryHighlight[];
  viewedStories: Set<string>;
  isLoadingStories: boolean;
  storiesError: string | null;
  
  // Story operations
  createStory: (storyData: CreateStoryRequest) => Promise<StoryResponse | null>;
  updateStory: (storyId: string, storyData: UpdateStoryRequest) => Promise<StoryResponse | null>;
  deleteStory: (storyId: string) => Promise<boolean>;
  getStories: (page?: number) => Promise<void>;
  getUserStories: (userId: string) => Promise<void>;
  markStoryAsViewed: (storyId: string) => Promise<void>;
  
  // Story highlights
  createHighlight: (highlightData: CreateHighlightRequest) => Promise<StoryHighlight | null>;
  updateHighlight: (highlightId: string, highlightData: UpdateHighlightRequest) => Promise<StoryHighlight | null>;
  deleteHighlight: (highlightId: string) => Promise<boolean>;
  getHighlights: (userId?: string) => Promise<void>;
  addStoryToHighlight: (highlightId: string, storyId: string) => Promise<boolean>;
  removeStoryFromHighlight: (highlightId: string, storyId: string) => Promise<boolean>;
  
  // Story viewers
  getStoryViewers: (storyId: string) => Promise<any[]>;
  
  // Utility
  refreshStories: () => Promise<void>;
  clearError: () => void;
}

export const [StoriesProvider, useStories] = createContextHook<StoriesState>(() => {
  const { user, isAuthenticated } = useAuth();
  
  // Story state
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [userStories, setUserStories] = useState<Record<string, StoryResponse[]>>({});
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  
  // Story operations
  const createStory = useCallback(async (storyData: CreateStoryRequest): Promise<StoryResponse | null> => {
    return withLoadingState(async () => {
      const response = await api.createStory(storyData);
      if (response?.data) {
        setStories(prev => [response.data, ...prev]);
        return response.data;
      }
      return null;
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const updateStory = useCallback(async (storyId: string, storyData: UpdateStoryRequest): Promise<StoryResponse | null> => {
    return withLoadingState(async () => {
      const response = await api.updateStory(storyId, storyData);
      if (response?.data) {
        setStories(prev => prev.map(story => story.id === storyId ? response.data : story));
        // Update in userStories as well
        setUserStories(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(userId => {
            updated[userId] = updated[userId].map(story => story.id === storyId ? response.data : story);
          });
          return updated;
        });
        return response.data;
      }
      return null;
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const deleteStory = useCallback(async (storyId: string): Promise<boolean> => {
    return withLoadingState(async () => {
      const success = await api.deleteStory(storyId);
      if (success) {
        setStories(prev => prev.filter(story => story.id !== storyId));
        setUserStories(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(userId => {
            updated[userId] = updated[userId].filter(story => story.id !== storyId);
          });
          return updated;
        });
        setViewedStories(prev => {
          const newSet = new Set(prev);
          newSet.delete(storyId);
          return newSet;
        });
        return true;
      }
      return false;
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const getStories = useCallback(async (page: number = 1): Promise<void> => {
    // Only fetch if authenticated
    if (!isAuthenticated) {
      return;
    }
    await withLoadingState(async () => {
      const response = await api.getStories({ page, limit: 20 });
      if (response?.data) {
        if (page === 1) {
          setStories(response.data);
        } else {
          setStories(prev => [...prev, ...response.data]);
        }
      }
    }, setIsLoadingStories, setStoriesError);
  }, [isAuthenticated]);
  
  // Initialize stories data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const initializeStories = async () => {
        await Promise.all([
          getStories(1),
          getHighlights(),
        ]);
      };
      
      initializeStories();
    }
  }, [isAuthenticated]);
  
  const getUserStories = useCallback(async (userId: string): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getUserStories(userId);
      if (response?.data) {
        setUserStories(prev => ({
          ...prev,
          [userId]: response.data
        }));
      }
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const markStoryAsViewed = useCallback(async (storyId: string): Promise<void> => {
    try {
      const response = await api.markStoryAsViewed(storyId);
      if (response) {
        setViewedStories(prev => new Set([...prev, storyId]));
        
        // Update story view count optimistically
        setStories(prev => prev.map(story => 
          story.id === storyId ? { ...story, viewCount: story.viewCount + 1 } : story
        ));
      }
    } catch (error) {
      handleApiError(error, setStoriesError);
    }
  }, []);
  
  // Story highlights operations
  const createHighlight = useCallback(async (highlightData: CreateHighlightRequest): Promise<StoryHighlight | null> => {
    return withLoadingState(async () => {
      const response = await api.createStoryHighlight(highlightData);
      if (response?.data) {
        setHighlights(prev => [response.data, ...prev]);
        return response.data;
      }
      return null;
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const updateHighlight = useCallback(async (highlightId: string, highlightData: UpdateHighlightRequest): Promise<StoryHighlight | null> => {
    return withLoadingState(async () => {
      const response = await api.updateStoryHighlight(highlightId, highlightData);
      if (response?.data) {
        setHighlights(prev => prev.map(highlight => 
          highlight.id === highlightId ? response.data : highlight
        ));
        return response.data;
      }
      return null;
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const deleteHighlight = useCallback(async (highlightId: string): Promise<boolean> => {
    return withLoadingState(async () => {
      const success = await api.deleteStoryHighlight(highlightId);
      if (success) {
        setHighlights(prev => prev.filter(highlight => highlight.id !== highlightId));
        return true;
      }
      return false;
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const getHighlights = useCallback(async (userId?: string): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getStoryHighlights(userId);
      if (response?.data) {
        setHighlights(response.data);
      }
    }, setIsLoadingStories, setStoriesError);
  }, []);
  
  const addStoryToHighlight = useCallback(async (highlightId: string, storyId: string): Promise<boolean> => {
    try {
      const response = await api.addStoryToHighlight(highlightId, { storyId });
      if (response) {
        // Update the highlight with the new story
        setHighlights(prev => prev.map(highlight => {
          if (highlight.id === highlightId) {
            // Assuming the highlight has a stories array
            return {
              ...highlight,
              storyCount: highlight.storyCount + 1,
            };
          }
          return highlight;
        }));
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setStoriesError);
      return false;
    }
  }, []);
  
  const removeStoryFromHighlight = useCallback(async (highlightId: string, storyId: string): Promise<boolean> => {
    try {
      const success = await api.removeStoryFromHighlight(highlightId, storyId);
      if (success) {
        // Update the highlight removing the story
        setHighlights(prev => prev.map(highlight => {
          if (highlight.id === highlightId) {
            return {
              ...highlight,
              storyCount: Math.max(0, highlight.storyCount - 1),
            };
          }
          return highlight;
        }));
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setStoriesError);
      return false;
    }
  }, []);
  
  // Story viewers
  const getStoryViewers = useCallback(async (storyId: string): Promise<any[]> => {
    try {
      const response = await api.getStoryViewers(storyId);
      return response?.data || [];
    } catch (error) {
      handleApiError(error, setStoriesError);
      return [];
    }
  }, []);
  
  // Utility functions
  const refreshStories = useCallback(async (): Promise<void> => {
    await Promise.all([
      getStories(1),
      getHighlights(),
    ]);
  }, [getStories, getHighlights]);
  
  const clearError = useCallback(() => {
    setStoriesError(null);
  }, []);
  
  return useMemo(
    () => ({
      // Story data
      stories,
      userStories,
      highlights,
      viewedStories,
      isLoadingStories,
      storiesError,
      
      // Story operations
      createStory,
      updateStory,
      deleteStory,
      getStories,
      getUserStories,
      markStoryAsViewed,
      
      // Story highlights
      createHighlight,
      updateHighlight,
      deleteHighlight,
      getHighlights,
      addStoryToHighlight,
      removeStoryFromHighlight,
      
      // Story viewers
      getStoryViewers,
      
      // Utility
      refreshStories,
      clearError,
    }),
    [
      stories,
      userStories,
      highlights,
      viewedStories,
      isLoadingStories,
      storiesError,
      createStory,
      updateStory,
      deleteStory,
      getStories,
      getUserStories,
      markStoryAsViewed,
      createHighlight,
      updateHighlight,
      deleteHighlight,
      getHighlights,
      addStoryToHighlight,
      removeStoryFromHighlight,
      getStoryViewers,
      refreshStories,
      clearError,
    ]
  );
});