
import type { PropsWithChildren } from 'react';
import React from 'react';

export function RorkSafeInsets({ children }: PropsWithChildren) {
  // On native, use the default safe area context from react-native-safe-area-context
  // which is already provided by expo-router
  return <>{children}</>;
}
