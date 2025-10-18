import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MessageCircle, Plus } from 'lucide-react-native';
import api from '@/services/api';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { chats as mockChats } from '@/data/mockData';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeStories, setActiveStories] = React.useState<any[]>([]);
  const [conversations, setConversations] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getStories({ page: 1, limit: 50 });
        if (mounted && res.success && res.data) {
          // Flatten and sort by user; fall back to existing shape expectations
          const items = (res.data.data || []).map((s: any) => ({
            id: s.id || s._id || s.storyId,
            user: {
              id: s.author?.id || s.userId || s.user?.id,
              username: s.author?.displayName || s.author?.username || 'user',
              avatar: s.author?.avatar || s.author?.profilePictureURL || s.user?.avatar || undefined,
              isVerified: !!s.author?.isVerified,
            },
            isViewed: !!s.isViewed,
          }));
          setActiveStories(items);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getConversations();
        if (mounted && res.success && res.data) {
          const list = (res.data as any[]).map((c: any) => {
            const other = (c.participants || [])[1] || c.user || {};
            const last: any = c.lastMessage || {};
            return {
              id: c.id,
              user: {
                id: other.id,
                username: other.username || other.displayName || 'user',
                avatar: other.avatar,
                isVerified: !!other.isVerified,
              },
              lastMessage: {
                id: last.id,
                senderId: last.sender?.id || last.senderId || 'other',
                text: last.content || last.text || '',
                timestamp: last.createdAt || last.timestamp || '',
                isRead: !!last.isRead,
              },
              unreadCount: c.unreadCount || 0,
            };
          });
          setConversations(list.length ? list : (mockChats as any));
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Search size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.earnBanner, { backgroundColor: `${colors.tint}15` }]}>
        <MessageCircle size={20} color={colors.tint} />
        <Text style={[styles.earnText, { color: colors.tint }]}>You earn as you chat 💬</Text>
      </View>

      <View style={[styles.storiesSection, { borderBottomColor: colors.border }]}>
        <Text style={[styles.storiesTitle, { color: colors.icon }]}>Active Now</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
        >
          <TouchableOpacity style={styles.addStoryButton} activeOpacity={0.7} onPress={() => router.push('/story-options')}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addStoryGradient}
            >
              <Plus size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.storyUsername, { color: colors.text }]}>Your Story</Text>
          </TouchableOpacity>

          {activeStories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.storyItem} activeOpacity={0.7} onPress={() => router.push({ pathname: '/story-viewer', params: { userId: story.user.id } })}>
              <LinearGradient
                colors={story.isViewed ? [colors.icon, colors.icon] : [colors.gradient.start, colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyGradient}
              >
                <View style={[styles.storyInner, { backgroundColor: colors.card }]}>
                  <Image source={{ uri: story.user.avatar }} style={styles.storyAvatar} />
                  <View style={[styles.onlineIndicator, { borderColor: colors.card }]} />
                </View>
              </LinearGradient>
              <Text style={[styles.storyUsername, { color: colors.text }]} numberOfLines={1}>
                {story.user.username}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {Array.isArray(conversations) ? conversations.map((chat) => (
          <TouchableOpacity
            key={chat.id || chat.conversationId}
            style={[styles.chatItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/chat-room', params: { chatId: chat.id || chat.conversationId } })}
          >
            <Image source={{ uri: (chat.participants?.[0]?.avatar) || chat.user?.avatar }} style={styles.avatar} />
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <View style={styles.nameRow}>
                  <Text style={[styles.username, { color: colors.text }]}>{chat.participants?.[0]?.username || chat.user?.username || 'Chat'}</Text>
                  {(chat.participants?.[0]?.isVerified || chat.user?.isVerified) && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.tint }]}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.timestamp, { color: colors.icon }]}>{chat.lastMessage?.timestamp || ''}</Text>
              </View>
              <View style={styles.messageRow}>
                <Text
                  style={[
                    styles.lastMessage,
                    { color: colors.icon },
                    chat.unreadCount > 0 && [styles.unreadMessage, { color: colors.text }],
                  ]}
                  numberOfLines={1}
                >
                  {(chat.lastMessage?.senderId === 'current-user' ? 'You: ' : '')}
                  {chat.lastMessage?.text || ''}
                </Text>
                {chat.unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )) : null}
        <View style={styles.bottomSpacer} />
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
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  earnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  storiesSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  storiesTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  storiesContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  addStoryButton: {
    alignItems: 'center',
    width: 70,
  },
  addStoryGradient: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyGradient: {
    width: 68,
    height: 68,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    marginBottom: SPACING.xs,
  },
  storyInner: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
    position: 'relative',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  storyUsername: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHT.bold,
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },
  unreadMessage: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  unreadBadge: {
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
