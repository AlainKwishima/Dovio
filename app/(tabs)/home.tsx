import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Bell, Search } from 'lucide-react-native';
import type { Post } from '@/types';
import api from '@/services/api';

import StoryCircle from '@/components/StoryCircle';
import PostCard from '@/components/PostCard';
import { SPACING, FONT_SIZE, FONT_WEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'post' | 'article'>('all');
  const [feed, setFeed] = React.useState<any[]>([]);
  const [storiesList, setStoriesList] = React.useState<any[]>([]);

  const loadFeed = React.useCallback(async () => {
    try {
      const res = await api.getFeed({ page: 1, limit: 20 });
      if (res.success && res.data) {
        const items = (res.data.data || []) as any[];
        // Map API posts to UI Post type (components/PostCard expects fields from '@/types')
        const mapped: Post[] = items.map((p: any) => {
          const author = p.author || {};
          const firstMediaUrl = Array.isArray(p.media) ? (p.media[0]?.url) : (p.media?.url);
          return {
            id: p.id || p._id || p.postId,
            user: {
              id: p.userId || author.id || 'u',
              username: author.username || author.displayName || 'user',
              displayName: author.displayName || author.username || 'user',
              avatar: author.avatar || author.profilePictureURL,
              isVerified: !!author.isVerified,
              bio: undefined,
              followers: 0,
              following: 0,
              posts: 0,
            },
            type: (p.type || 'post') as any,
            image: firstMediaUrl || 'https://picsum.photos/seed/dovio/800/1000',
            caption: p.caption || p.content || p.text || '',
            likes: p.likes || p.likesCount || 0,
            comments: p.comments || p.commentsCount || 0,
            shares: p.shares || p.sharesCount || 0,
            timestamp: p.createdAt || new Date().toISOString(),
            isLiked: !!p.isLiked,
            title: p.title,
            content: p.content,
            coverImage: p.coverImage,
            tags: p.tags || [],
          } as Post;
        });
        setFeed(mapped);
      }
    } catch {}
  }, []);

  React.useEffect(() => { loadFeed(); }, [loadFeed]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getStories({ page: 1, limit: 30 });
        if (mounted && res.success && res.data) {
          const items = (res.data.data || []).map((s: any) => ({
            id: s.id || s._id || s.storyId,
            user: {
              id: s.author?.id || s.userId,
              username: s.author?.username || s.author?.displayName || 'user',
              avatar: s.author?.avatar || s.author?.profilePictureURL,
            },
          }));
          setStoriesList(items);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadFeed().finally(() => setRefreshing(false));
  }, [loadFeed]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: colors.tint }]}>
              <View style={styles.logoIconInner} />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>Dovio</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.push('/search')}>
              <Search size={22} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.push('/notifications')}>
              <Bell size={22} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.push('/settings')}>
              <Settings size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <View style={[styles.storiesContainer, { backgroundColor: colors.card }]}>
          <View style={styles.storiesHeader}>
            <Text style={[styles.storiesTitle, { color: colors.text }]}>Stories</Text>
            <TouchableOpacity onPress={() => router.push('/story-options')}>
              <Text style={[styles.createStoryLink, { color: colors.tint }]}>+ Create</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.storiesScroll}
            contentContainerStyle={styles.storiesScrollContent}
          >
            <View style={styles.storiesPadding}>
              {storiesList.map((story, index) => (
                <StoryCircle
                  key={story.id}
                  story={story}
                  isCurrentUser={index === 0}
                  onPress={() => {
                    if (index === 0) {
                      // Current user story - navigate to story options
                      router.push('/story-options');
                    } else {
                      // Other user's story - navigate to story viewer
                      router.push({
                        pathname: '/story-viewer',
                        params: { userId: story.user.id },
                      });
                    }
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Filters */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, backgroundColor: colors.card, flexDirection: 'row', gap: 8 }}>
          {([
            { label: 'All', value: 'all' },
            { label: 'Posts', value: 'post' },
            { label: 'Articles', value: 'article' },
          ] as const).map((item) => (
            <TouchableOpacity key={item.value} onPress={() => setFilter(item.value)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: filter === item.value ? colors.tint : colors.border, backgroundColor: filter === item.value ? colors.tint : 'transparent' }}>
              <Text style={{ color: filter === item.value ? '#fff' : colors.text, fontWeight: FONT_WEIGHT.semibold }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.postsContainer}>
          {feed.filter(p => filter === 'all' ? true : p.type === filter).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPress={() => router.push('/post-detail')}
              onLike={() => console.log('Like:', post.id)}
              onComment={() => router.push('/post-detail')}
              onShare={() => console.log('Share:', post.id)}
            />
          ))}
        </View>

        <View style={[styles.bottomSpacer, { height: SPACING.xxxl + insets.bottom }]} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconInner: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  logoText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  storiesContainer: {
    paddingVertical: SPACING.md,
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  storiesTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  createStoryLink: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  storiesScroll: {
    flexGrow: 0,
  },
  storiesScrollContent: {
    paddingRight: SPACING.lg,
  },
  storiesPadding: {
    flexDirection: 'row',
    paddingLeft: SPACING.lg,
    gap: SPACING.sm,
  },
  postsContainer: {
    paddingTop: SPACING.lg,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
