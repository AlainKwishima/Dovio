import { Tabs, router } from 'expo-router';
import { Home, MessageCircle, Sparkles, Wallet, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { NEUMORPHIC } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function DovioAITabIcon({ focused }: { focused: boolean }) {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.centerIconContainer, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerIconGradient}
      >
        <Sparkles size={28} color="#FFFFFF" strokeWidth={2.5} />
      </LinearGradient>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: colors.shadow.opacity,
          shadowRadius: 12,
          elevation: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 56 + Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <MessageCircle size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // Navigate to Dovio AI page
            router.push('/dovio-ai');
          },
        }}
        options={{
          title: 'Dovio',
          tabBarIcon: ({ focused }) => <DovioAITabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Wallet size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerIconContainer: {
    width: 60,
    height: 60,
    marginTop: -20,
    borderRadius: 30,
    overflow: 'hidden',
    ...NEUMORPHIC.raised,
  },
  centerIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
