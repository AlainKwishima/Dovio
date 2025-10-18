import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Colors from '@/constants/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@theme_preference_mode';

export interface ThemeState {
  mode: ThemeMode;
  scheme: Exclude<ColorSchemeName, null | undefined>;
  colors: typeof Colors.light;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

function resolveScheme(mode: ThemeMode, systemScheme: Exclude<ColorSchemeName, null | undefined>): Exclude<ColorSchemeName, null | undefined> {
  if (mode === 'system') return systemScheme;
  return mode;
}

export const [ThemeProvider, useTheme] = createContextHook<ThemeState>(() => {
  const initialSystemScheme = (Appearance.getColorScheme() ?? 'light') as 'light' | 'dark';
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(initialSystemScheme);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme ?? 'light') as 'light' | 'dark');
    });
    return () => sub.remove();
  }, []);

  const scheme = useMemo(() => resolveScheme(mode, systemScheme), [mode, systemScheme]);
  const colors = useMemo(() => (scheme === 'dark' ? Colors.dark : Colors.light), [scheme]);

  const persist = async (next: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  };

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await persist(next);
  }, []);

  const toggle = useCallback(async () => {
    const next: ThemeMode = scheme === 'dark' ? 'light' : 'dark';
    await setMode(next);
  }, [scheme, setMode]);

  return {
    mode,
    scheme,
    colors,
    setMode,
    toggle,
  };
});
