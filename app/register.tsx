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
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, loginWithGoogle } = useAuth();
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; username?: string; email?: string; password?: string; confirmPassword?: string; agree?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; username?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean; agree?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  // Live validation booleans
  const isNameValid = !!name.trim();
  const isUsernameValid = !!username.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMinLen = password.length >= 8;
  const isPasswordHasUpper = /[A-Z]/.test(password);
  const isPasswordHasLower = /[a-z]/.test(password);
  const isPasswordHasNumber = /[0-9]/.test(password);
  const isPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async () => {
    setSubmitted(true);
    const next: typeof errors = {};
    if (!name) next.name = 'Full name is required';
    if (!username) next.username = 'Username is required';
    if (!email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Min 8 characters';
    if (!confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!agree) next.agree = 'You must agree to continue';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsLoading(true);
    try {
      console.log('📝 Starting registration process');
      const healthy = await api.healthCheck();
      console.log('🏥 Health check result:', healthy);
      if (!healthy) throw new Error('Cannot reach server. Please start the backend.');

      const registrationData = {
        username,
        email,
        password,
        confirmPassword,
        displayName: name,
      };
      
      console.log('📝 Registration data:', { ...registrationData, password: '***', confirmPassword: '***' });
      const regData = await register(registrationData);
      console.log('✅ Registration result:', regData);
      
      // On success, direct to verify email screen; include token in dev if provided
      const token = (regData && (regData as any).emailVerificationToken) || undefined;
      console.log('🔐 Email verification token:', token ? 'Present' : 'Missing');
      if (token) {
        try { await AsyncStorage.setItem('lastEmailVerifyToken', token); } catch {}
      }
      router.replace({ pathname: '/verify-email', params: token ? { token, email } : { email } });
      Alert.alert('Verify Email', 'Registration successful! We sent a verification code to your email.');
    } catch (error: any) {
      const msg = error?.message || 'Failed to register. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-up temporarily disabled

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.headerBar, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderColor: ((touched.name || submitted) && !isNameValid) ? '#EF4444' : colors.card, borderWidth: ((touched.name || submitted) && !isNameValid) ? 1 : 0 }
          ]}>
            <User size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              autoCapitalize="words"
            />
          </View>
          {(touched.name || submitted) && errors.name ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{errors.name}</Text> : null}

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: ((touched.username || submitted) && !isUsernameValid) ? '#EF4444' : colors.card, borderWidth: ((touched.username || submitted) && !isUsernameValid) ? 1 : 0 }]}>
            <User size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Username"
              placeholderTextColor={colors.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
            />
          </View>
          {(touched.username || submitted) && errors.username ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{errors.username}</Text> : null}

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: ((touched.email || submitted) && !isEmailValid) ? '#EF4444' : colors.card, borderWidth: ((touched.email || submitted) && !isEmailValid) ? 1 : 0 }]}>
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
          {(touched.email || submitted) && errors.email ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{errors.email}</Text> : null}

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: ((touched.password || submitted) && !(isPasswordMinLen && isPasswordHasUpper && isPasswordHasLower && isPasswordHasNumber)) ? '#EF4444' : colors.card, borderWidth: ((touched.password || submitted) && !(isPasswordMinLen && isPasswordHasUpper && isPasswordHasLower && isPasswordHasNumber)) ? 1 : 0 }]}>
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
          {(touched.password || submitted) && errors.password ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{errors.password}</Text> : null}

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: ((touched.confirmPassword || submitted) && !isPasswordsMatch) ? '#EF4444' : colors.card, borderWidth: ((touched.confirmPassword || submitted) && !isPasswordsMatch) ? 1 : 0 }]}>
            <Lock size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={colors.icon} />
              ) : (
                <Eye size={20} color={colors.icon} />
              )}
            </TouchableOpacity>
          </View>
          {(touched.confirmPassword || submitted) && errors.confirmPassword ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{errors.confirmPassword}</Text> : null}

        {/* Password rules checklist (only show after touch/submit and while unmet) */}
        {(touched.password || touched.confirmPassword || submitted) && !(isPasswordMinLen && isPasswordHasUpper && isPasswordHasLower && isPasswordHasNumber && isPasswordsMatch) ? (
          <View style={{ marginTop: SPACING.xs, marginBottom: SPACING.md }}>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: colors.text, marginBottom: 6 }}>Password requirements:</Text>
            <Text style={{ color: isPasswordMinLen ? '#10B981' : '#EF4444', marginBottom: 2 }}>• At least 8 characters</Text>
            <Text style={{ color: (isPasswordHasUpper && isPasswordHasLower && isPasswordHasNumber) ? '#10B981' : '#EF4444', marginBottom: 2 }}>• Uppercase, lowercase, and a number</Text>
            <Text style={{ color: isPasswordsMatch ? '#10B981' : '#EF4444' }}>• Passwords match</Text>
          </View>
        ) : null}

          <TouchableOpacity onPress={() => setAgree(!agree)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING.sm }}>
          <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: (!agree && (touched.agree || submitted)) ? '#EF4444' : colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: agree ? colors.tint : 'transparent' }}>
              {agree ? <View style={{ width: 10, height: 10, backgroundColor: '#fff' }} /> : null}
            </View>
          <Text style={{ color: (!agree && (touched.agree || submitted)) ? '#EF4444' : colors.icon }}>I agree to the Terms of Service and Privacy Policy</Text>
          </TouchableOpacity>
          {(touched.agree || submitted) && errors.agree ? <Text style={{ color: '#EF4444', marginTop: 4 }}>{errors.agree}</Text> : null}

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading || !agree}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Google login temporarily disabled */}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.tint }]}>Sign In</Text>
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
  headerBar: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
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
  registerButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.lg,
    ...SHADOW.medium,
  },
  registerButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  registerButtonText: {
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
