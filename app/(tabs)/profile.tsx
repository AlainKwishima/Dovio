import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Settings, Grid, List, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, NEUMORPHIC } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const imageSize = (width - SPACING.xs * 2) / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [user, setUser] = useState<any>(currentUser);
  const [photos, setPhotos] = useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await api.getUserProfile();
        if (mounted && profile?.success && profile.data) {
          // Merge onto current auth user so we don't lose credentials
          setUser((prev: any) => ({ ...(prev || {}), ...(profile.data as any) }));
        }
        const feed = await api.getPosts({ page: 1, limit: 30 } as any);
        if (mounted && feed?.success && feed.data) {
          const urls = (feed.data.data || []).flatMap((p: any) => (Array.isArray(p.media) ? p.media : [])
            .map((m: any) => m?.url)
            .filter(Boolean));
          if (urls.length) setPhotos(urls as string[]);
        }
      } catch {
        // No backend posts -> keep existing photos
      }
      // Ensure avatar fallback
      setUser((u: any) => ({ ...(u || {}), avatar: u?.avatar || 'https://i.pravatar.cc/150?img=11' }));
    })();
    return () => { mounted = false; };
  }, []);

  // Keep local profile in sync with auth user (after edit-profile saves)
  React.useEffect(() => {
    if (currentUser) setUser((prev: any) => ({ ...(prev || {}), ...(currentUser as any) }));
  }, [currentUser]);
  
  // Check if this is the current user's profile
  const isOwnProfile = !!currentUser;

  const resolvedUsername = (
    user?.username ||
    currentUser?.username ||
    currentUser?.displayName ||
    user?.displayName ||
    (currentUser?.email ? String(currentUser.email).split('@')[0] : undefined) ||
    (user?.email ? String(user.email).split('@')[0] : undefined) ||
    'User'
  );

  const resolvedAvatar = user?.avatar || currentUser?.avatar || 'https://i.pravatar.cc/150?img=11';
  const resolvedBio = user?.bio || currentUser?.bio || '';
  const resolvedFollowers = (user?.followers ?? currentUser?.followers ?? 0) as number;
  const resolvedFollowing = (user?.following ?? currentUser?.following ?? 0) as number;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.headerLeft} />
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7} onPress={() => router.push('/settings')}>
            <Settings size={22} color={colors.text} />
          </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.profileTopSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
                  <Image source={{ uri: resolvedAvatar }} style={styles.avatar} />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.displayName, { color: colors.text }]}>{resolvedUsername}</Text>
                {user?.isVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              {resolvedBio ? (
                <Text style={[styles.bio, { color: colors.icon }]}>{resolvedBio}</Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
            <View style={styles.stats}>
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={[styles.statValue, { color: colors.text }]}>{photos.length}</Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>Posts</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity 
                style={styles.statItem} 
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/followers',
                  params: { userId: user.id, username: user.username }
                })}
              >
                <Text style={[styles.statValue, { color: colors.text }]}> 
                  {resolvedFollowers}
                </Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>Followers</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity 
                style={styles.statItem} 
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/following',
                  params: { userId: user.id, username: user.username }
                })}
              >
                <Text style={[styles.statValue, { color: colors.text }]}>{resolvedFollowing}</Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isOwnProfile && (
            <TouchableOpacity style={styles.followButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.followButtonGradient}
              >
                <Text style={styles.followButtonText}>Follow</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'grid' && { borderBottomColor: colors.tint }]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.7}
          >
            <Grid size={20} color={viewMode === 'grid' ? colors.tint : colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'list' && { borderBottomColor: colors.tint }]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <List size={20} color={viewMode === 'list' ? colors.tint : colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Create Post Button */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity 
            style={[styles.createPostButton, { backgroundColor: colors.tint }]} 
            onPress={() => router.push('/create-post')}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={styles.photoItem}
              activeOpacity={0.8}
              onPress={() => router.push('/post-detail')}
            >
              <Image source={{ uri: photo }} style={styles.photoImage} />
            </TouchableOpacity>
          ))}
        </View>

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
  headerLeft: {
    width: 40,
  },
  username: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: SPACING.xl,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    marginRight: SPACING.lg,
  },
  profileInfo: {
    flex: 1,
    paddingTop: SPACING.sm,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  nameContainer: {
    marginBottom: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  displayName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHT.bold,
  },
  bio: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingVertical: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  followButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...NEUMORPHIC.raised,
  },
  followButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    // Dynamic border color applied inline
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    width: imageSize,
    height: imageSize,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5E5',
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
  createButtonContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  createPostButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
