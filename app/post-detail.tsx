import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, UserPlus, UserCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { currentUser, posts as mockPosts } from '@/data/mockData';
import { useSocial } from '@/contexts/SocialContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Comment } from '@/types';
import EmojiPicker from '@/components/EmojiPicker';
import Toast, { ToastType } from '@/components/Toast';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  const [post, setPost] = useState<any | null>(null);
  const { isPostLiked, toggleLike, isFollowing, toggleFollow } = useSocial();
  const { user: authUser } = useAuth();
  const { addEarnings } = useWallet();
  
  const [isLiked, setIsLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [likeScale] = useState(new Animated.Value(1));
  const [followScale] = useState(new Animated.Value(1));
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const isOwnPost = post && authUser?.id === post.user.id;

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const feed = await api.getFeed({ page: 1, limit: 1 });
        if (mounted && feed.success && feed.data && (feed.data as any).data?.length) {
          const p = (feed.data as any).data[0];
          setPost(p);
          setIsLiked(isPostLiked(p.id));
          setFollowing(isFollowing(p.user.id));
          // fetch comments
          const cm = await api.getComments({ postId: p.id, limit: 50 } as any);
          if (cm.success && cm.data) {
            const rows = ((cm.data as any).data || []).map((saved: any) => ({
              id: saved.id,
              user: {
                id: saved.author?.id || saved.user?.id || 'u',
                username: saved.author?.username || saved.user?.username || saved.author?.displayName || 'user',
                displayName: saved.author?.displayName || saved.user?.displayName || 'user',
                avatar: saved.author?.avatar || saved.user?.avatar,
                isVerified: !!(saved.author?.isVerified || saved.user?.isVerified),
                followers: 0,
                following: 0,
                posts: 0,
              } as any,
              text: saved.content || saved.text || '',
              timestamp: saved.createdAt || saved.timestamp || '',
              likes: saved.likes || 0,
            }));
            setComments(rows);
          }
        } else if (mounted) {
          // Fallback to mock post
          const mp = mockPosts[0];
          setPost({
            id: mp.id,
            user: mp.user,
            type: mp.type,
            image: mp.image,
            caption: mp.caption,
            likes: mp.likes,
            shares: mp.shares,
            timestamp: mp.timestamp,
            isLiked: mp.isLiked,
          });
          setIsLiked(isPostLiked(mp.id));
          setFollowing(isFollowing(mp.user.id));
          const cm = await api.getComments({ postId: mp.id, limit: 50 } as any);
          if (cm.success && cm.data) {
            const rows = ((cm.data as any).data || []).map((saved: any) => ({
              id: saved.id,
              user: saved.user || saved.author || currentUser,
              text: saved.content || saved.text || '',
              timestamp: saved.createdAt || saved.timestamp || '',
              likes: saved.likes || 0,
            }));
            setComments(rows);
          }
        }
      } catch {
        if (mounted) {
          const mp = mockPosts[0];
          setPost({
            id: mp.id,
            user: mp.user,
            type: mp.type,
            image: mp.image,
            caption: mp.caption,
            likes: mp.likes,
            shares: mp.shares,
            timestamp: mp.timestamp,
            isLiked: mp.isLiked,
          });
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLike = async () => {
    if (!post) return;
    const next = !isLiked;
    setIsLiked(next);
    toggleLike(post.id);
    try {
      if (next) {
        await api.addReaction({ entityType: 'post', entityId: post.id, type: 'like' });
      } else {
        await api.unlikePost(post.id);
      }
    } catch {}
    
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFollow = async () => {
    if (!post) return;
    const now = !following;
    setFollowing(now);
    toggleFollow(post.user.id);
    try {
      if (now) await api.followUser({ userId: post.user.id }); else await api.unfollowUser(post.user.id);
    } catch {}
    
    Animated.sequence([
      Animated.timing(followScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(followScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    showToast(following ? 'Unfollowed' : 'Following', 'success');
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      user: authUser || currentUser,
      text: commentText.trim(),
      timestamp: 'Just now',
      likes: 0,
    };

    setComments([...comments, newComment]);
    setCommentText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await api.createComment({ postId: post!.id, content: newComment.text });
      if (res.success && res.data) {
        const saved: any = res.data;
        // Map API comment -> UI comment shape
        const uiComment: Comment = {
          id: saved.id || tempId,
          user: {
            id: saved.author?.id || 'u',
            username: saved.author?.username || saved.author?.displayName || 'user',
            displayName: saved.author?.displayName || saved.author?.username || 'user',
            avatar: saved.author?.avatar,
            isVerified: !!saved.author?.isVerified,
            followers: 0,
            following: 0,
            posts: 0,
          } as any,
          text: saved.content || newComment.text,
          timestamp: saved.createdAt || 'Just now',
          likes: saved.likes || 0,
        };
        setComments(prev => prev.map(c => c.id === tempId ? uiComment : c));
        showToast('Comment posted!', 'success');
      } else {
        throw new Error('failed');
      }
    } catch (error) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      showToast('Failed to post comment', 'error');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const formatNumber = (value: any): string => {
    const num = Number.isFinite(value) ? (value as number) : parseInt(String(value ?? 0), 10) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.md, backgroundColor: colors.card }]}> 
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          {post && (
            <View style={styles.headerUser}>
              <Image source={{ uri: post.user.avatar }} style={styles.headerAvatar} />
              <Text style={[styles.headerUsername, { color: colors.text }]}>{post.user.username}</Text>
              {post.user.isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.tint }]}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
          )}
          {post && !isOwnPost && (
            <Animated.View style={{ transform: [{ scale: followScale }] }}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={handleFollow}
                activeOpacity={0.8}
              >
                {following ? (
                  <View style={[styles.followingButton, { borderColor: colors.tint }] }>
                    <UserCheck size={16} color={colors.tint} />
                  </View>
                ) : (
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.followGradient}
                  >
                    <UserPlus size={16} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <MoreHorizontal size={24} color={colors.text} />
          </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {post && <Image source={{ uri: post.image }} style={styles.image} />}

        {post && (
        <View style={styles.content}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <Heart
                  size={28}
                  color={isLiked ? colors.tint : colors.icon}
                  fill={isLiked ? colors.tint : 'transparent'}
                />
              </Animated.View>
              <Text style={[styles.actionText, isLiked && { color: colors.tint }]}>
                {formatNumber((post.likes || 0) + (isLiked ? 1 : 0))}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <MessageCircle size={28} color={colors.icon} />
              <Text style={[styles.actionText, { color: colors.icon }]}>{formatNumber(comments.length)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={async () => { try { await api.createShare({ postId: post.id, type: 'repost' }); } catch {} }}>
              <Send size={28} color={colors.icon} />
              <Text style={[styles.actionText, { color: colors.icon }]}>{formatNumber(post.shares || 0)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bookmarkButton} activeOpacity={0.7}>
              <Bookmark size={28} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.captionContainer}>
            <Text style={styles.captionTitle}>{post.caption.split('\n')[0]}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image source={{ uri: comment.user?.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>{comment.user?.username || 'User'}</Text>
                    <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <TouchableOpacity style={styles.commentLike} activeOpacity={0.7} onPress={async () => {
                    const inc = 1;
                    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, likes: (c.likes || 0) + inc } : c));
                    try { await api.addReaction({ entityType: 'comment', entityId: comment.id, type: 'like' }); } catch {}
                  }}>
                    <Heart size={14} color={colors.icon} />
                    <Text style={[styles.commentLikeText, { color: colors.icon }]}>{comment.likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.md, backgroundColor: colors.card }]}>
        <Image source={{ uri: authUser?.avatar || currentUser.avatar }} style={styles.inputAvatar} />
        <TouchableOpacity
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(true)}
          activeOpacity={0.7}
        >
          <Smile size={24} color={Colors.light.icon} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Write comment here"
          placeholderTextColor={colors.placeholder}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!commentText.trim()}
          activeOpacity={0.7}
        >
          <Send size={20} color={commentText.trim() ? Colors.light.tint : Colors.light.icon} />
        </TouchableOpacity>
      </View>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: Colors.light.card,
    gap: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
  },
  headerUsername: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.text,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHT.bold,
  },
  followButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  followGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 500,
    backgroundColor: Colors.light.border,
  },
  content: {
    backgroundColor: Colors.light.card,
    padding: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xl,
    gap: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.icon,
  },
  actionTextActive: {
    color: Colors.light.tint,
  },
  bookmarkButton: {
    marginLeft: 'auto',
  },
  captionContainer: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  captionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
    marginBottom: SPACING.sm,
  },
  captionText: {
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  commentsSection: {
    paddingTop: SPACING.lg,
  },
  commentsTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
    marginBottom: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  commentUsername: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.text,
  },
  commentTimestamp: {
    fontSize: FONT_SIZE.xs,
    color: Colors.light.icon,
  },
  commentText: {
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  commentLikeText: {
    fontSize: FONT_SIZE.xs,
    color: Colors.light.icon,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: SPACING.sm,
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
