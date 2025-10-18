import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { User } from '@/types/api';
import api from '@/services/api';
import type { LoginRequest, RegisterRequest } from '@/types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<any>;
  requestEmailVerification: (email: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  accounts: Array<{ user: User; accessToken: string; refreshToken: string }>;
  addAccount: (email: string, password: string) => Promise<void>;
  switchAccount: (index: number) => Promise<void>;
  removeAccount: (index: number) => Promise<void>;
}

const AUTH_STORAGE_KEY = '@dovio_auth';
const AUTH_ACCOUNTS_KEY = '@dovio_accounts';

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);

  const normalizeUser = (u: any): User => {
    if (!u) return u;
    const emailPrefix = (u.email ? String(u.email).split('@')[0] : '') || u.username || u.displayName || 'user';
    return {
      ...u,
      username: u.username || emailPrefix,
      displayName: u.displayName || u.username || emailPrefix,
      avatar: u.avatar || 'https://i.pravatar.cc/150?img=11',
    } as User;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Array<{ user: User; accessToken: string; refreshToken: string }>>([]);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      // Check if tokens exist
      if (api.isAuthenticated()) {
        // Try to load user profile from API
        const response = await api.getUserProfile();
        if (response.success && response.data) {
          setUser(response.data);
          await saveAuthState(response.data);
        } else {
          // Token is invalid, clear it
          await api.clearTokens();
        }
      } else {
        // Try to load from local storage as fallback
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const authData = JSON.parse(stored);
          setUser(authData.user);
        }
      }
      const storedAccounts = await AsyncStorage.getItem(AUTH_ACCOUNTS_KEY);
      if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
    } catch (error) {
      console.error('Failed to load auth state:', error);
      // Clear invalid tokens
      await api.clearTokens();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (userData: User) => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userData }));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  const persistAccounts = async (accs: Array<{ user: User; accessToken: string; refreshToken: string }>) => {
    setAccounts(accs);
    try { await AsyncStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accs)); } catch {}
  };

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.login(credentials);
      if (response.success && response.data) {
        const data: any = response.data as any;
        const nu = normalizeUser(data.user);
        setUser(nu);
        await saveAuthState(nu);
        const accessToken = api.getAccessToken() || '';
        // Persist refresh token when available (for account switching reliability)
        const acc = { user: data.user, accessToken, refreshToken: (data.refreshToken || '') } as any;
        const idx = accounts.findIndex(a => a.user.id === data.user.id);
        const next = [...accounts];
        if (idx >= 0) next[idx] = acc; else next.push(acc);
        await persistAccounts(next);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const status = error?.statusCode || error?.status;
      const rawMsg = String(error?.message || '');
      let errorMessage = 'Login failed. Please try again.';
      // Friendly messages based on common backend patterns
      if (status === 404 || error?.code === 'USER_NOT_FOUND') {
        errorMessage = 'No such user found. Please register first.';
      } else if (status === 401 || error?.code === 'INVALID_CREDENTIALS') {
        errorMessage = 'Invalid email or password.';
      } else if (status === 403 || /verify\s*.*email/i.test(rawMsg) || error?.code === 'EMAIL_NOT_VERIFIED') {
        errorMessage = 'Please verify your email to continue. Check your inbox for the verification email.';
      } else if (status === 423 || /locked/i.test(rawMsg)) {
        errorMessage = 'Account locked due to multiple failed attempts. Please try again later.';
      } else if (rawMsg) {
        errorMessage = rawMsg;
      }
      setError(errorMessage);
      console.error('Login failed:', error);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.register(data);
      if (response.success && response.data) {
        // Do not set logged-in state on register; require email verification and login
        // Return verification data to caller when available (dev)
        return response.data;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error?.statusCode === 409 || error?.code === 'USER_ALREADY_EXISTS' || /exists/i.test(error?.message || '')) {
        errorMessage = 'User already exists. Please log in instead.';
      }
      setError(errorMessage);
      console.error('Registration failed:', error);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailVerification = async (_email: string) => {
    // No-op: backend triggers verification during registration
    return;
  };

  const verifyEmail = async (_email: string, token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.verifyEmail(token);
    } catch (e: any) {
      const msg = e?.message || 'Verification failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Google login temporarily disabled
      Alert.alert('Temporarily Disabled', 'Google login is temporarily disabled. Please use email/password.');
      throw new Error('Google login is temporarily disabled');
    } catch (error: any) {
      const errorMessage = error.message || 'Google login failed. Please try again.';
      setError(errorMessage);
      console.error('Google login failed:', error);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Call API logout endpoint
      await api.logout();
      // Clear local state
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local state
      await api.clearTokens();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addAccount = async (email: string, password: string) => {
    const resp = await api.login({ email, password });
    if (resp.success && resp.data) {
      const d: any = resp.data as any;
      const accessToken = api.getAccessToken() || '';
      const acc = { user: d.user, accessToken, refreshToken: '' };
      const idx = accounts.findIndex(a => a.user.id === d.user.id);
      const next = [...accounts];
      if (idx >= 0) next[idx] = acc; else next.push(acc);
      await persistAccounts(next);
    } else {
      throw new Error(resp.error || 'Unable to add account');
    }
  };

  const switchAccount = async (index: number) => {
    const acc = accounts[index];
    if (!acc) return;
    await api.setTokens(acc.accessToken, acc.refreshToken);
    setUser(acc.user);
    await saveAuthState(acc.user);
  };

  const removeAccount = async (index: number) => {
    const next = accounts.filter((_, i) => i !== index);
    await persistAccounts(next);
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.updateUserProfile(data);
      if (response.success && response.data) {
        const nu = normalizeUser(response.data);
        setUser(nu);
        await saveAuthState(nu);
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error: any) {
      // Hybrid fallback: apply locally so user sees changes
      setUser(prev => prev ? normalizeUser({ ...prev, ...data }) : (data as any));
      if (user) await saveAuthState(normalizeUser({ ...user, ...data } as any));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!api.isAuthenticated()) return;
    
    try {
      const response = await api.getUserProfile();
      if (response.success && response.data) {
        const nu = normalizeUser(response.data);
        setUser(nu);
        await saveAuthState(nu);
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    requestEmailVerification,
    verifyEmail,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshProfile,
    clearError,
    accounts,
    addAccount,
    switchAccount,
    removeAccount,
  };
});
