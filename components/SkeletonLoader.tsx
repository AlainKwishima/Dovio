import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BORDER_RADIUS, SPACING } from '@/constants/theme';
import Colors from '@/constants/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = BORDER_RADIUS.md, style }: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <View style={styles.postCard}>
      <SkeletonLoader width="100%" height={400} borderRadius={0} />
      <View style={styles.postFooter}>
        <View style={styles.userInfo}>
          <SkeletonLoader width={40} height={40} borderRadius={BORDER_RADIUS.full} />
          <View style={styles.userText}>
            <SkeletonLoader width={120} height={16} style={{ marginBottom: SPACING.xs }} />
            <SkeletonLoader width={80} height={12} />
          </View>
        </View>
        <View style={styles.actions}>
          <SkeletonLoader width={60} height={20} style={{ marginRight: SPACING.lg }} />
          <SkeletonLoader width={60} height={20} style={{ marginRight: SPACING.lg }} />
          <SkeletonLoader width={60} height={20} />
        </View>
      </View>
    </View>
  );
}

export function CommentSkeleton() {
  return (
    <View style={styles.commentItem}>
      <SkeletonLoader width={40} height={40} borderRadius={BORDER_RADIUS.full} />
      <View style={styles.commentContent}>
        <SkeletonLoader width={100} height={14} style={{ marginBottom: SPACING.xs }} />
        <SkeletonLoader width="100%" height={16} style={{ marginBottom: SPACING.xs }} />
        <SkeletonLoader width="80%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.light.border,
  },
  postCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BORDER_RADIUS.xxl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  postFooter: {
    padding: SPACING.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  userText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  commentContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
});
