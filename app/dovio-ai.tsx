import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, NEUMORPHIC } from '@/constants/theme';

export default function DovioAIScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} activeOpacity={0.7}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Sparkles size={80} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.title, { color: colors.text }]}>Dovio AI</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Your Smart Companion</Text>

          <View style={[styles.comingSoonBadge, { backgroundColor: `${colors.tint}15` }]}>
            <Text style={[styles.comingSoonText, { color: colors.tint }]}>Coming Soon</Text>
          </View>

          <Text style={[styles.description, { color: colors.icon }]}>
            Meet Dovio AI, your intelligent AI assistant that helps you create amazing content, 
            suggests engaging captions, and provides personalized recommendations.
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.featureText, { color: colors.text }]}>Smart content suggestions</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.featureText, { color: colors.text }]}>AI-powered caption generation</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.featureText, { color: colors.text }]}>Personalized recommendations</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.featureText, { color: colors.text }]}>24/7 assistance</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.notifyButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.notifyButtonGradient}
            >
              <Text style={styles.notifyButtonText}>Notify Me When Available</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    minHeight: '80%',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEUMORPHIC.raised,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    marginBottom: SPACING.lg,
  },
  comingSoonBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xl,
  },
  comingSoonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  description: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: SPACING.xxxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: FONT_SIZE.md,
  },
  notifyButton: {
    alignSelf: 'stretch',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...NEUMORPHIC.raised,
  },
  notifyButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  notifyButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
});