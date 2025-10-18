
import { Platform } from 'react-native';
import {
  SafeAreaInsetsContext,
  type EdgeInsets,
} from 'react-native-safe-area-context';
import React, { useEffect, useState, type PropsWithChildren } from 'react';

const DEFAULT_IOS_LIKE_WEB_INSETS: EdgeInsets = { 
  top: 44, 
  right: 0, 
  bottom: 34, 
  left: 0 
};

export function RorkSafeInsets({ children }: PropsWithChildren) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const [insets, setInsets] = useState<EdgeInsets>(DEFAULT_IOS_LIKE_WEB_INSETS);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: validate the event origin if needed
      // if (event.origin !== 'https://your-expected-origin.com') return;

      if (event.data?.type === 'update-safe-area-insets') {
        const { top, right, bottom, left } = event.data.insets;
        
        // Validate that all values are numbers
        if (
          typeof top === 'number' &&
          typeof right === 'number' &&
          typeof bottom === 'number' &&
          typeof left === 'number'
        ) {
          setInsets({ top, right, bottom, left });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent that we're ready to receive insets
    window.parent.postMessage({ type: 'safe-insets-ready' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <SafeAreaInsetsContext.Provider value={insets}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}
