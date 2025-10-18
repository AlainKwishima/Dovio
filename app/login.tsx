import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '@/constants/theme';
import api from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle } = useAuth();
  const { colors } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  // Live validation booleans
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordFilled = password.length > 0;

  const handleLogin = async () => {
    setSubmitted(true);
    const nextErrors: typeof errors = {} as any;
    if (!email) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email';
    if (!password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      // Quick connectivity check
      const healthy = await api.healthCheck();
      if (!healthy) throw new Error('Cannot reach server. Please start the backend.');

      await login({ email, password });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const msg = error?.message || 'Failed to login. Please try again.';
      if (/verify\s*.*email/i.test(msg)) {
        router.push({ pathname: '/verify-email', params: { email } });
      }
      setErrors(prev => ({ ...prev, form: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  // Google login temporarily disabled

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <View style={styles.logoInner} />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome to Dovio</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderWidth: (touched.email || submitted) && !isEmailValid ? 1 : 0, borderColor: (touched.email || submitted) && !isEmailValid ? '#EF4444' : colors.card }
          ]}> 
            <Mail size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            />
          </View>
          {errors.email && (touched.email || submitted) ? (
            <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ color: '#EF4444', marginBottom: 8 }}>{errors.email}</Text>
          ) : null}

          <View style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderWidth: (touched.password || submitted) && !isPasswordFilled ? 1 : 0, borderColor: (touched.password || submitted) && !isPasswordFilled ? '#EF4444' : colors.card }
          ]}> 
            <Lock size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.icon} />
              ) : (
                <Eye size={20} color={colors.icon} />
              )}
            </TouchableOpacity>
          </View>
          {errors.password && (touched.password || submitted) ? (
            <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ color: '#EF4444', marginBottom: 8 }}>{errors.password}</Text>
          ) : null}

          {/* Requirements (show only after touch/submit while unmet) */}
          {(submitted || touched.email || touched.password) && (!isEmailValid || !isPasswordFilled) ? (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: colors.text, marginBottom: 6 }}>Requirements:</Text>
              {!isEmailValid ? (
                <Text style={{ color: '#EF4444', marginBottom: 2 }}>• Enter a valid email address</Text>
              ) : null}
              {!isPasswordFilled ? (
                <Text style={{ color: '#EF4444' }}>• Enter your password</Text>
              ) : null}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl }}>
            <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
              <Text style={[styles.forgotText, { color: colors.tint }]}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: rememberMe ? colors.tint : 'transparent' }}>
                {rememberMe ? <View style={{ width: 10, height: 10, backgroundColor: '#fff' }} /> : null}
              </View>
              <Text style={{ color: colors.icon }}>Remember me for 30 days</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {errors.form ? (
            <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ color: '#EF4444', textAlign: 'center', marginTop: SPACING.md }}>{errors.form}</Text>
          ) : null}

          {/* Google login temporarily disabled */}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>Don’t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.tint }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: Colors.light.icon,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.small,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
  },
  eyeIcon: {
    padding: SPACING.sm,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
  },
  forgotText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.tint,
  },
  loginButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.medium,
  },
  loginButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: FONT_SIZE.sm,
    color: Colors.light.icon,
    marginHorizontal: SPACING.md,
  },
  googleButton: {
    backgroundColor: Colors.light.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    ...SHADOW.small,
  },
  googleButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZE.md,
    color: Colors.light.icon,
  },
  footerLink: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.tint,
  },
});
