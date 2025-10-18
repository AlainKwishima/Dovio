import "@rork/polyfills";
import { BundleInspector } from '@rork/inspector';
import { RorkSafeInsets } from '@rork/safe-insets';
import { RorkErrorBoundary } from '@rork/rork-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { SocialProvider } from '@/contexts/SocialContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { View, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import api from '@/services/api';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="post-detail"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="chat-room"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="dovio-ai"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="call-screen"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setError(null);
      const ok = await api.healthCheck();
      setHealthy(ok);
      if (ok) {
        SplashScreen.hideAsync();
      }
    } catch (e: any) {
      setHealthy(false);
      setError('Unable to reach server');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <SocialProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <BundleInspector>
                  <RorkSafeInsets>
                    <RorkErrorBoundary>
                      {healthy === false ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.lg }}>
                          <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: Colors.light.text, textAlign: 'center' }}>
                            Can’t reach the server
                          </Text>
                          <Text style={{ fontSize: FONT_SIZE.md, color: Colors.light.icon, textAlign: 'center' }}>
                            Make sure the backend is running and your device can access it.
                          </Text>
                          <TouchableOpacity
                            onPress={checkHealth}
                            style={{ backgroundColor: Colors.light.tint, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg }}
                            activeOpacity={0.8}
                          >
                            <Text style={{ color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <RootLayoutNav />
                      )}
                    </RorkErrorBoundary>
                  </RorkSafeInsets>
                </BundleInspector>
              </GestureHandlerRootView>
            </SocialProvider>
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
