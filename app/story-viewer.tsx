import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Heart, Send, MoreVertical, Pause, Play } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { Story } from '@/types';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoryViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ storyId?: string; userId?: string }>();
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [progress] = useState(new Animated.Value(0));
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getStories({ page: 1, limit: 50 });
        if (!mounted || !res.success || !res.data) return;
        const items = (res.data.data || []).map((s: any) => ({
          id: s.id || s._id || s.storyId,
          image: s.media?.url || s.media?.thumbnailUrl || s.media?.uri,
          user: {
            id: s.author?.id || s.userId || s.user?.id,
            username: s.author?.displayName || s.author?.username || 'user',
            avatar: s.author?.avatar || s.author?.profilePictureURL || s.user?.avatar || undefined,
          },
        }));

        if (params.storyId) {
          const initial = items.find(s => String(s.id) === String(params.storyId));
          if (initial) {
            const filtered = items.filter(s => String(s.user.id) === String(initial.user.id));
            setUserStories(filtered);
            const idx = filtered.findIndex(s => String(s.id) === String(params.storyId));
            setCurrentStoryIndex(idx >= 0 ? idx : 0);
            return;
          }
        }

        if (params.userId) {
          const filtered = items.filter(s => String(s.user.id) === String(params.userId));
          setUserStories(filtered.length ? filtered : items);
        } else {
          setUserStories(items);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [params.storyId, params.userId]);

  useEffect(() => {
    if (userStories.length > 0 && !isPaused) {
      startProgress();
    }
    return () => {
      if (progressRef.current) {
        progressRef.current.stop();
      }
    };
  }, [currentStoryIndex, userStories, isPaused]);

  const startProgress = () => {
    progress.setValue(0);
    progressRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    progressRef.current.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
  };

  const handleNext = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      router.back();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsPaused(true);
        if (progressRef.current) progressRef.current.stop();
      },
      onPanResponderMove: (_, g) => {
        // optionally, could add slight parallax or rubber band effect
      },
      onPanResponderRelease: (_, g) => {
        setIsPaused(false);
        const threshold = SCREEN_WIDTH * 0.18;
        if (g.dx <= -threshold) return handleNext();
        if (g.dx >= threshold) return handlePrevious();
        startProgress();
      },
    })
  ).current;

  const handleTapLeft = () => {
    handlePrevious();
  };

  const handleTapRight = () => {
    handleNext();
  };

  if (userStories.length === 0) {
    return null;
  }

  const currentStory = userStories[currentStoryIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Image source={{ uri: currentStory.image }} style={styles.storyImage} />

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.3)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {userStories.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      index < currentStoryIndex
                        ? '100%'
                        : index === currentStoryIndex
                        ? progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.userInfo}>
          <Image source={{ uri: currentStory.user.avatar }} style={styles.avatar} />
          <View style={styles.userText}>
            <Text style={styles.username}>{currentStory.user.username}</Text>
            <Text style={styles.timestamp}>2h ago</Text>
          </View>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <MoreVertical size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={() => setIsPaused(p => !p)}
            activeOpacity={0.7}
          >
            {isPaused ? <Play size={24} color="#FFFFFF" /> : <Pause size={24} color="#FFFFFF" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tapAreas} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.tapLeft}
          activeOpacity={1}
          onPress={handleTapLeft}
        />
        <TouchableOpacity
          style={styles.tapRight}
          activeOpacity={1}
          onPress={handleTapRight}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.replyContainer}>
          <TouchableOpacity style={styles.replyButton} activeOpacity={0.7} onPress={() => setIsPaused(p => !p)}>
            <Text style={styles.replyText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={async () => { try { await api.addReaction({ entityType: 'story', entityId: currentStory.id, type: 'like' }); } catch {} }}>
            <Heart size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={async () => { try { await api.createShare({ postId: currentStory.id as any, type: 'story' as any }); } catch {} }}>
            <Send size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={{ position: 'absolute', right: SPACING.lg, bottom: SPACING.xxxl }}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => setIsPaused(p => !p)}>
            {isPaused ? <Play size={28} color="#FFFFFF" /> : <Pause size={28} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.xxxl + SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.md,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.full,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userText: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  replyButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyText: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHT.medium,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
