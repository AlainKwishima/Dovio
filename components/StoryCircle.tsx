import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, User } from 'lucide-react-native';
import { Story } from '@/types';
import { BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, NEUMORPHIC } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface StoryCircleProps {
  story: Story;
  onPress: () => void;
  isCurrentUser?: boolean;
}

export default function StoryCircle({ story, onPress, isCurrentUser = false }: StoryCircleProps) {
  const { colors } = useTheme();
  const isCreateStory = (story as any).isCreateStory;
  
  const renderAvatar = () => {
    if (story.user.avatar) {
      return <Image source={{ uri: story.user.avatar }} style={styles.avatar} />;
    }
    // Placeholder when no avatar
    return (
      <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
        <User size={32} color={colors.textSecondary} strokeWidth={1.5} />
      </View>
    );
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {isCreateStory ? (
          <View style={[styles.createStoryBorder, { borderColor: colors.border }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              {renderAvatar()}
              <View style={[styles.addIcon, { backgroundColor: colors.tint }]}>
                <Plus size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        ) : isCurrentUser ? (
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              {renderAvatar()}
            </View>
          </LinearGradient>
        ) : !story.isViewed ? (
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              {renderAvatar()}
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.viewedBorder, { backgroundColor: colors.border }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              {renderAvatar()}
            </View>
          </View>
        )}
      </View>
      <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
        {isCreateStory ? 'Your Story' : isCurrentUser ? 'My Stories' : (story.user.fullNames || story.user.username || 'User')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  avatarContainer: {
    marginBottom: SPACING.xs,
  },
  gradientBorder: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    ...NEUMORPHIC.raised,
  },
  viewedBorder: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
  },
  currentUserBorder: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  createStoryBorder: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  addIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    maxWidth: 76,
    textAlign: 'center',
  },
});
