import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, UserCheck, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import api from '@/services/api';

export default function FollowersScreen() {

  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; username?: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const { isFollowing, checkFollowStatus, toggleFollow } = useSocial();
  const insets = useSafeAreaInsets();

  const [followers, setFollowers] = useState<any[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const targetId = (params.userId as string) || (currentUser as any)?.id || (currentUser as any)?.userId || '';
        const res = await api.getFollowers(String(targetId));
        console.log('👥 Followers response:', res);
        if (mounted && res.success && res.data) {
          // Ensure data is an array
          const followersData = Array.isArray(res.data) ? res.data : [];
          console.log('👥 Followers array:', followersData);
          setFollowers(followersData);
          
          // Check follow status for each follower
          followersData.forEach(async (follower: any) => {
            const userId = follower.id || follower.userId;
            if (userId && userId !== currentUser?.id) {
              await checkFollowStatus(userId);
            }
          });
        }
      } catch (error) {
        console.error('❌ Error loading followers:', error);
        if (mounted) setFollowers([]);
      }
    })();
    return () => { mounted = false; };
  }, [params.userId, currentUser?.id, checkFollowStatus]);

  const handleUserPress = (user: any) => {
    router.push({
      pathname: '/user-profile',
      params: { userId: user.id, username: user.username }
    });
  };

  const handleFollowToggle = (userId: string) => {
    toggleFollow(userId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Followers</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Followers List */}
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {followers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.subtext }]}>No followers yet</Text>
            </View>
          )}
          {followers.map((user, index) => {
            const following = isFollowing(user.id || user.userId);
            const isCurrentUser = currentUser?.id === (user.id || user.userId);
            
            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.userItem, { backgroundColor: colors.card }]}
                onPress={() => handleUserPress({ id: user.id || user.userId, username: user.username })}
                activeOpacity={0.7}
              >
                <View style={styles.userInfo}>
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  
                  <View style={styles.userDetails}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.displayName, { color: colors.text }]}>
                        {user.displayName || user.username}
                      </Text>
                      {user.isVerified && (
                        <View style={[styles.verifiedBadge, { backgroundColor: colors.tint }]}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.username, { color: colors.icon }]}>
                      @{user.username}
                    </Text>
                    <Text style={[styles.bio, { color: colors.icon }]} numberOfLines={1}>
                      {user.bio}
                    </Text>
                  </View>
                </View>

                {!isCurrentUser && (
                  <TouchableOpacity
                    style={styles.followButton}
                    onPress={() => handleFollowToggle(user.id)}
                    activeOpacity={0.8}
                  >
                    {following ? (
                      <View style={[styles.followingButton, { backgroundColor: colors.background, borderColor: colors.tint }]}>
                        <UserCheck size={16} color={colors.tint} strokeWidth={2} />
                        <Text style={[styles.followingText, { color: colors.tint }]}>Following</Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[colors.gradient.start, colors.gradient.end]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.followGradient}
                      >
                        <UserPlus size={16} color="white" strokeWidth={2} />
                        <Text style={styles.followText}>Follow</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
          
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </Animated.View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  displayName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginRight: 6,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: FONT_WEIGHT.bold,
  },
  username: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
  },
  bio: {
    fontSize: FONT_SIZE.xs,
  },
  followButton: {
    marginLeft: 12,
  },
  followGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  followText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: 'white',
  },
  followingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  followingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
  },
});
