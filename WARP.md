# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- Stack: Expo Router + React Native + TypeScript, managed with Bun.
- State: React Query for server state, React Context for app state (Auth, Wallet, Social).
- Storage: AsyncStorage for auth and wallet persistence; mock data under data/ for UI.
- Rork integration: .rorkai provides polyfills, error boundaries, safe-insets, an inspector, and an AI toolkit SDK (useRorkAgent). Env var EXPO_PUBLIC_TOOLKIT_URL configures the toolkit backend (defaults to http://localhost:3005).
- Path aliases: "@/*" to repo root; "@rork/*" to .rorkai/* (see tsconfig.json).

Common commands
- Prereqs: Node.js and Bun installed.
- Install dependencies:
```bash path=null start=null
bun i
```
- Start development server (QR code for devices, opens dev tools):
```bash path=null start=null
bun run start
```
- Web preview (auto-reload in browser):
```bash path=null start=null
bun run start-web
```
- Launch simulators from the dev server:
```bash path=null start=null
# after bun run start
# iOS
bun run start -- --ios
# Android
bun run start -- --android
```
- Lint:
```bash path=null start=null
bun run lint
```
- Clear Expo metro cache (useful if stuck):
```bash path=null start=null
bunx expo start --clear
```
- EAS (Expo Application Services) builds and submission (from README):
```bash path=null start=null
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure project once
npx eas-cli build:configure

# Build binaries
npx eas-cli build --platform ios
npx eas-cli build --platform android

# Submit to stores
npx eas-cli submit --platform ios
npx eas-cli submit --platform android

# Web build and hosting
npx eas-cli build --platform web
npx eas-cli hosting:configure
npx eas-cli hosting:deploy
```
Notes on testing
- There is no test runner configured in package.json. If you add Jest or Vitest later, include scripts for running all tests and a single test, then update this file.

High-level architecture
- Routing (Expo Router)
  - File-based routes under app/. Root layout in app/_layout.tsx declares a Stack with screens: onboarding, login, register, (tabs), post-detail, chat-room, edit-profile, settings, lizzy-ai (modal), notifications, call-screen (fullScreenModal). app/(tabs)/_layout.tsx defines bottom tabs: home, messages, add (special “Lizzy” center action), wallet, profile, and a hidden search route.
  - app.json enables typed routes (experiments.typedRoutes: true) and configures expo-router plugin.
- Providers and global wrappers
  - QueryClientProvider from @tanstack/react-query wraps the app for server-state queries.
  - AuthProvider, WalletProvider, SocialProvider expose app-level state and actions via hooks (useAuth, useWallet, useSocial) in contexts/.
  - RorkSafeInsets, RorkErrorBoundary, and BundleInspector wrap the UI at the root for safe areas, error handling, and bundle inspection.
- State and data model
  - AuthContext persists user data to AsyncStorage (key @dovio_auth). WalletContext persists balance, totalEarned, transactions to AsyncStorage (key @lizzy_wallet). SocialContext tracks followed users and liked posts in-memory.
  - types/ defines User, Post, Story, Comment, Notification, Message, Chat, Transaction, WalletData. data/mockData.ts seeds UI with users, posts, stories, notifications, chats, and wallet transactions.
- Styling and design system
  - constants/colors.ts centralizes light/dark palettes, gradients, and shadows (tint #9D7FEA). constants/theme.ts exposes spacing, radii, font sizes/weights, SHADOW presets, and a NEUMORPHIC style used in tab UI.
- Rork AI toolkit
  - .rorkai/toolkit-sdk.ts exposes useRorkAgent with tool calling via the “ai” SDK, plus helpers generateText/generateObject. It relies on EXPO_PUBLIC_TOOLKIT_URL for its backend endpoints; default is http://localhost:3005.

Key configuration
- app.json: app metadata (name, slug, scheme), iOS bundle identifier and permissions, Android package and permissions, web favicon, plugins (expo-router, expo-image-picker), and typedRoutes enabled.
- tsconfig.json: strict TS, path aliases for @/* and @rork/*.
- package.json scripts: start (bunx rork start ...), start-web, start-web-dev, lint (expo lint). Dependencies include expo, react-native, expo-router, react-query, nativewind, lucide-react-native, etc.; devDependencies include typescript and eslint with expo config.

Troubleshooting references (from README)
```bash path=null start=null
# Device connection issues: try tunnel mode
bun run start -- --tunnel

# Clear and restart dev server
bunx expo start --clear

# Reinstall deps
rm -rf node_modules && bun i
```
