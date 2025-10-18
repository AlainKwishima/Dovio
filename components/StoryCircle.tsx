import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
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
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {isCurrentUser ? (
          <View style={[styles.currentUserBorder, { backgroundColor: colors.border }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
              <View style={[styles.addIcon, { backgroundColor: colors.tint }]}>
                <Plus size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        ) : !story.isViewed ? (
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.viewedBorder, { backgroundColor: colors.border }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
              <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
            </View>
          </View>
        )}
      </View>
      <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
        {isCurrentUser ? 'Your Story' : story.user.username}
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
