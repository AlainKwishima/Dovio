import React from 'react';
import { AuthProvider } from './AuthContext';
import { SocialProvider } from './SocialContext';
import { WalletProvider } from './WalletContext';
import { StoriesProvider } from './StoriesContext';
import { MessagingProvider } from './MessagingContext';
import { UserManagementProvider } from './UserManagementContext';

interface GlobalProvidersProps {
  children: React.ReactNode;
}

/**
 * Global context providers wrapper that combines all app contexts
 * in the correct order to avoid dependency issues
 */
export const GlobalProviders: React.FC<GlobalProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <UserManagementProvider>
        <WalletProvider>
          <SocialProvider>
            <StoriesProvider>
              <MessagingProvider>
                {children}
              </MessagingProvider>
            </StoriesProvider>
          </SocialProvider>
        </WalletProvider>
      </UserManagementProvider>
    </AuthProvider>
  );
};

// Export all hooks for easy importing
export { useAuth } from './AuthContext';
export { useSocial } from './SocialContext';
export { useWallet } from './WalletContext';
export { useStories } from './StoriesContext';
export { useMessaging } from './MessagingContext';
export { useUserManagement } from './UserManagementContext';

// Export providers individually in case they're needed
export { AuthProvider } from './AuthContext';
export { SocialProvider } from './SocialContext';
export { WalletProvider } from './WalletContext';
export { StoriesProvider } from './StoriesContext';
export { MessagingProvider } from './MessagingContext';
export { UserManagementProvider } from './UserManagementContext';