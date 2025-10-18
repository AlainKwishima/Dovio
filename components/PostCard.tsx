import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Alert } from 'react-native';
import { Heart, MessageCircle, Send, Bookmark, UserPlus, UserCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Post } from '@/types';
import { useSocial } from '@/contexts/SocialContext';
import { useAuth } from '@/contexts/AuthContext';
import ShareModal from '@/components/ShareModal';
import { BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, NEUMORPHIC } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export default function PostCard({ post, onPress, onLike, onComment, onShare }: PostCardProps) {
  const { isPostLiked, toggleLike, isFollowing, toggleFollow } = useSocial();
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const [likeScale] = useState(new Animated.Value(1));
  const [followScale] = useState(new Animated.Value(1));
  const [showShareModal, setShowShareModal] = useState(false);
  const isLiked = isPostLiked(post.id);
  const following = isFollowing(post.user.id);
  const isOwnPost = currentUser?.id === post.user.id;
  const [likesCount, setLikesCount] = useState<number>(typeof post.likes === 'number' ? post.likes : 0);
  const [sharesCount, setSharesCount] = useState<number>(typeof post.shares === 'number' ? post.shares : 0);

  const handleLike = async () => {
    // Optimistic UI
    toggleLike(post.id);
    
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

    try {
      setLikesCount(prev => (isLiked ? Math.max(prev - 1, 0) : prev + 1));
      await api.addReaction({ entityType: 'post', entityId: post.id, type: 'like' });
      // Refresh from backend for consistency
      try {
        const res = await api.getReactions('post', post.id);
        if (res.success && res.data) setLikesCount((res.data as any[]).length);
      } catch {}
    } catch {
      // Best-effort rollback
      toggleLike(post.id);
      setLikesCount(prev => (isLiked ? prev + 1 : Math.max(prev - 1, 0)));
    }
    onLike();
  };

  const formatNumber = (value: any): string => {
    const num = Number.isFinite(value) ? value as number : parseInt(String(value ?? 0), 10) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  const handleFollow = async () => {
    const nowFollowing = !following;
    toggleFollow(post.user.id);
    
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

    try {
      if (nowFollowing) {
        await api.followUser({ userId: post.user.id });
      } else {
        await api.unfollowUser(post.user.id);
      }
    } catch {
      // rollback on error
      toggleFollow(post.user.id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
        <Image source={{ uri: post.image }} style={[styles.image, { backgroundColor: colors.border }]} />
        <View style={styles.overlay}>
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View style={styles.userText}>
            <View style={styles.userNameRow}>
              <Text style={[styles.username, { color: colors.text }]}>{post.user.username}</Text>
              {post.user.isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.tint }]}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.timestamp, { color: colors.icon }]}>{post.timestamp}</Text>
          </View>
          {!isOwnPost && (
            <Animated.View style={{ transform: [{ scale: followScale }] }}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={handleFollow}
                activeOpacity={0.8}
              >
                {following ? (
                  <View style={[styles.followingButton, { backgroundColor: colors.background, borderColor: colors.tint }]}>
                    <UserCheck size={16} color={colors.tint} />
                    <Text style={[styles.followingText, { color: colors.tint }]}>Following</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.followGradient}
                  >
                    <UserPlus size={16} color="#FFFFFF" />
                    <Text style={styles.followText}>Follow</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Heart
                size={20}
                color={isLiked ? colors.tint : colors.icon}
                fill={isLiked ? colors.tint : 'transparent'}
              />
            </Animated.View>
            <Text style={[styles.actionText, { color: colors.icon }, isLiked && { color: colors.tint }]}>
              {formatNumber(likesCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onComment} activeOpacity={0.7}>
            <MessageCircle size={20} color={colors.icon} />
            <Text style={[styles.actionText, { color: colors.icon }]}>{formatNumber(post.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowShareModal(true)} activeOpacity={0.7}>
            <Send size={20} color={colors.icon} />
            <Text style={[styles.actionText, { color: colors.icon }]}>{formatNumber(sharesCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bookmarkButton} activeOpacity={0.7} onPress={async () => {
            try { await api.savePost({ postId: post.id }); } catch {}
          }}>
            <Bookmark size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <ShareModal
        visible={showShareModal}
        post={post}
        onClose={() => setShowShareModal(false)}
        onShare={(userIds, message) => {
          (async () => {
            try {
              await api.createShare({ postId: post.id, type: 'repost', content: message || '' });
              Alert.alert('Success', `Post shared with ${userIds.length} ${userIds.length === 1 ? 'person' : 'people'}!`);
              setSharesCount(prev => prev + 1);
            } catch {
              Alert.alert('Error', 'Failed to share post.');
            }
          })();
          onShare();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xxl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...NEUMORPHIC.flat,
  },
  image: {
    width: '100%',
    height: 400,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  caption: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#FFFFFF',
  },
  footer: {
    padding: SPACING.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  userText: {
    flex: 1,
  },
  userNameRow: {
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
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  bookmarkButton: {
    marginLeft: 'auto',
  },
  followButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  followGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  followText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  followingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  followingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
});
