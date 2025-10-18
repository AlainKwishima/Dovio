import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, UserCheck, UserPlus, MessageCircle, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';

// Mock user data
const mockUserData = {
  '6': {
    id: '6',
    username: 'david_brown',
    displayName: 'David Brown',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Musician & producer 🎵\nCreating beats that move souls\n📍 Los Angeles, CA',
    followerCount: 2840,
    followingCount: 856,
    postCount: 127,
    isVerified: false,
  },
  '7': {
    id: '7',
    username: 'emma_davis',
    displayName: 'Emma Davis',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    bio: 'Fashion influencer ✨\nStylist & Content Creator\n🌟 Inspiring confidence through fashion\n📧 emma@fashionco.com',
    followerCount: 18540,
    followingCount: 1204,
    postCount: 542,
    isVerified: true,
  },
  '8': {
    id: '8',
    username: 'chris_wilson',
    displayName: 'Chris Wilson',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Fitness coach & trainer 💪\nHelping you achieve your goals\n🏋️‍♂️ DM for coaching\n📍 Miami, FL',
    followerCount: 5624,
    followingCount: 423,
    postCount: 289,
    isVerified: false,
  },
};

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; username?: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const { isFollowing, toggleFollow } = useSocial();
  const insets = useSafeAreaInsets();

  const userId = params.userId || '6';
  const userData = mockUserData[userId as keyof typeof mockUserData] || mockUserData['6'];
  
  const [user] = useState(userData);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const isCurrentUser = currentUser?.id === user.id;
  const isFollowingUser = isFollowing(user.id);

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

  const handleFollowToggle = () => {
    toggleFollow(user.id);
  };

  const handleMessage = () => {
    // Navigate to chat or show message interface
    Alert.alert('Message', `Send a message to ${user.displayName}`);
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'More Options',
      'Choose an action',
      [
        { text: 'Report User', style: 'destructive' },
        { text: 'Block User', style: 'destructive' },
        { text: 'Share Profile' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleStatsPress = (type: 'followers' | 'following') => {
    if (type === 'followers') {
      router.push({
        pathname: '/followers',
        params: { userId: user.id, username: user.username }
      });
    } else {
      router.push({
        pathname: '/following',
        params: { userId: user.id, username: user.username }
      });
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMoreOptions}
          activeOpacity={0.7}
        >
          <MoreVertical size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <Image source={{ uri: user.avatar }} style={styles.profileImage} />
          
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {user.displayName}
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
          </View>

          {user.bio && (
            <Text style={[styles.bio, { color: colors.text }]}>
              {user.bio}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {user.postCount.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Posts</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => handleStatsPress('followers')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {user.followerCount.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Followers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => handleStatsPress('following')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {user.followingCount.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          {!isCurrentUser && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={handleFollowToggle}
                activeOpacity={0.8}
              >
                {isFollowingUser ? (
                  <View style={[styles.followingButton, { backgroundColor: colors.background, borderColor: colors.tint }]}>
                    <UserCheck size={18} color={colors.tint} strokeWidth={2} />
                    <Text style={[styles.followingText, { color: colors.tint }]}>Following</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.followGradient}
                  >
                    <UserPlus size={18} color="white" strokeWidth={2} />
                    <Text style={styles.followText}>Follow</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.background, borderColor: colors.tint }]}
                onPress={handleMessage}
                activeOpacity={0.8}
              >
                <MessageCircle size={18} color={colors.tint} strokeWidth={2} />
                <Text style={[styles.messageText, { color: colors.tint }]}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Posts Grid Placeholder */}
        <View style={[styles.postsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
          
          <View style={styles.postsGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View 
                key={item} 
                style={[styles.postPlaceholder, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.postPlaceholderText, { color: colors.icon }]}>
                  Post {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </Animated.ScrollView>
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
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginRight: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: 'white',
    fontWeight: FONT_WEIGHT.bold,
  },
  username: {
    fontSize: FONT_SIZE.md,
  },
  bio: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    flex: 1,
  },
  followGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  followText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: 'white',
  },
  followingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  followingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  postsSection: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 16,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postPlaceholder: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postPlaceholderText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
});