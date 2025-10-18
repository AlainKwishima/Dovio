// @ts-nocheck
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction } from '@/types';
import { api } from '../services/api';
import { Transaction as WalletTransactionResponse } from '@/types/api';
import { ErrorHandler, withLoadingState, handleApiError } from '../utils/errorHandler';

interface WalletState {
  balance: number;
  totalEarned: number;
  pendingEarnings: number;
  transactions: WalletTransactionResponse[];
  isLoading: boolean;
  error: string | null;
  
  // Wallet operations
  addEarnings: (amount: number, source: string, description: string) => Promise<boolean>;
  withdrawFunds: (amount: number, method: string) => Promise<boolean>;
  getTransactionHistory: (page?: number) => Promise<void>;
  refreshWallet: () => Promise<void>;
  clearError: () => void;
}

const WALLET_CACHE_KEY = '@dovio_wallet_cache';

export const [WalletProvider, useWallet] = createContextHook<WalletState>(() => {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    // Wallet features are disabled - coming soon
    setIsLoading(false);
    setBalance(0);
    setTotalEarned(0);
    setPendingEarnings(0);
    setTransactions([]);
  };

  const loadCachedWalletData = async () => {
    try {
      const cached = await AsyncStorage.getItem(WALLET_CACHE_KEY);
      if (cached) {
        const walletData = JSON.parse(cached);
        setBalance(walletData.balance || 0);
        setTotalEarned(walletData.totalEarned || 0);
        setPendingEarnings(walletData.pendingEarnings || 0);
        setTransactions(walletData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load cached wallet data:', error);
    }
  };

  const saveWalletDataToCache = async (walletData: {
    balance: number;
    totalEarned: number;
    pendingEarnings: number;
    transactions: WalletTransactionResponse[];
  }) => {
    try {
      await AsyncStorage.setItem(
        WALLET_CACHE_KEY,
        JSON.stringify({
          ...walletData,
          lastUpdated: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to cache wallet data:', error);
    }
  };

  const fetchWalletData = async () => {
    try {
      const response = await api.getWalletDetails();
      if (response?.data) {
        const walletData = response.data;
        setBalance(walletData.balance);
        setTotalEarned(walletData.totalEarnings || 0);
        setPendingEarnings(walletData.pendingBalance || 0);
        
        // Cache the updated data
        await saveWalletDataToCache({
          balance: walletData.balance,
          totalEarned: walletData.totalEarnings || 0,
          pendingEarnings: walletData.pendingBalance || 0,
          transactions,
        });
      }
      
      // Also fetch recent transactions
      await fetchTransactions(1);
    } catch (error) {
      handleApiError(error, setError);
      throw error;
    }
  };

  const fetchTransactions = async (page: number = 1) => {
    try {
      const response = await api.getWalletTransactions({ page, limit: 20 });
      if (response?.data) {
        if (page === 1) {
          setTransactions(response.data);
        } else {
          setTransactions(prev => [...prev, ...response.data]);
        }
        
        // Update cache with new transactions
        const currentWalletData = {
          balance,
          totalEarned,
          pendingEarnings,
          transactions: page === 1 ? response.data : [...transactions, ...response.data],
        };
        await saveWalletDataToCache(currentWalletData);
      }
    } catch (error) {
      handleApiError(error, setError);
    }
  };

  const addEarnings = useCallback(
    async (amount: number, source: string, description: string): Promise<boolean> => {
      const transactionData = {
        type: 'earn',
        amount,
        source,
        description,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      } as any;

      try {
        const response = await api.createWalletTransaction(transactionData);
        if (response?.data) {
          // Optimistically update the UI
          setBalance(prev => prev + amount);
          setTotalEarned(prev => prev + amount);
          setTransactions(prev => [response.data, ...prev]);
          
          // Refresh wallet data to ensure accuracy
          await fetchWalletData();
          return true;
        }
        return false;
      } catch (error) {
        handleApiError(error, setError);
        return false;
      }
    },
    [balance, totalEarned, transactions]
  );

  const withdrawFunds = useCallback(
    async (amount: number, method: string): Promise<boolean> => {
      if (amount > balance) {
        setError('Insufficient balance for withdrawal');
        return false;
      }

      const transactionData = {
        type: 'withdraw',
        amount: -amount, // Negative for withdrawal
        source: 'withdrawal',
        description: `Withdrawal via ${method}`,
        metadata: {
          withdrawalMethod: method,
          timestamp: new Date().toISOString(),
        },
      } as any;

      try {
        const response = await api.createWalletTransaction(transactionData);
        if (response?.data) {
          // Optimistically update the UI
          setBalance(prev => prev - amount);
          setTransactions(prev => [response.data, ...prev]);
          
          // Refresh wallet data to ensure accuracy
          await fetchWalletData();
          return true;
        }
        return false;
      } catch (error) {
        handleApiError(error, setError);
        return false;
      }
    },
    [balance]
  );

  const getTransactionHistory = useCallback(
    async (page: number = 1): Promise<void> => {
      await fetchTransactions(page);
    },
    []
  );

  const refreshWallet = useCallback(async (): Promise<void> => {
    await withLoadingState(async () => {
      await fetchWalletData();
    }, setIsLoading, setError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(
    () => ({
      balance,
      totalEarned,
      pendingEarnings,
      transactions,
      isLoading,
      error,
      addEarnings,
      withdrawFunds,
      getTransactionHistory,
      refreshWallet,
      clearError,
    }),
    [
      balance,
      totalEarned,
      pendingEarnings,
      transactions,
      isLoading,
      error,
      addEarnings,
      withdrawFunds,
      getTransactionHistory,
      refreshWallet,
      clearError,
    ]
  );
});
