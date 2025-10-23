import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT } from '@/constants/theme';
import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ token?: string; email?: string; username?: string }>();
  const [status, setStatus] = useState<'verifying'|'success'|'error'>('verifying');
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        let token = params?.token as string | undefined;
        if (!token) {
          // Fallback to cached token from registration
          try { token = (await AsyncStorage.getItem('lastEmailVerifyToken')) || undefined; } catch {}
          if (!token) {
            setStatus('error');
            return;
          }
        }
        console.log('🔐 Verifying email with token:', token);
        const result = await api.verifyEmail(token);
        console.log('✅ Email verification result:', result);
        setStatus('success');
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
          Animated.timing(confettiOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true })
        ]).start();
        setTimeout(() => {
          router.replace('/login');
        }, 3500);
      } catch (e) {
        console.error('❌ Email verification error:', e);
        setStatus('error');
      }
    })();
  }, [params?.token]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {status === 'verifying' ? (
          <ActivityIndicator size="large" color={colors.tint} />
        ) : (
          <Animated.View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: status === 'success' ? colors.tint : '#EF4444', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg, transform: [{ scale: scaleAnim }] }}>
            <Text style={{ color: '#fff', fontSize: 56 }}>{status === 'success' ? '✔' : '✕'}</Text>
          </Animated.View>
        )}

        <Text style={[styles.title, { color: colors.text }]}>
          {status === 'success' ? 'Email Confirmed 🎉' : status === 'error' ? 'Verification Needed' : 'Verifying...'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          {status === 'success'
            ? `Thank you for confirming your email${params?.username ? `, ${String(params.username)}` : ''}! Your account is now active.`
            : status === 'error'
            ? 'We could not find a verification token. Please open the link from your email, or return to the app and request a new verification email from Settings.'
            : 'Please wait while we confirm your account.'}
        </Text>
        {status !== 'verifying' ? (
          <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.8} style={{ marginTop: SPACING.lg }}>
            <Text style={{ color: colors.tint, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}>Back to Sign In</Text>
          </TouchableOpacity>
        ) : null}

        {status === 'success' ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', top: '20%', left: 0, right: 0, opacity: confettiOpacity }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {['#34D399', '#60A5FA', '#F59E0B', '#F472B6', '#10B981'].map((c, i) => (
                <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c, transform: [{ translateY: (i % 2 ? 1 : -1) * 6 }] }} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});