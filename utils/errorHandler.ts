import { Alert } from 'react-native';
import type { ApiError } from '@/types/api';

export class ErrorHandler {
  static handleApiError(error: ApiError | Error, context?: string): void {
    let title = 'Error';
    let message = 'An unexpected error occurred. Please try again.';

    if ('statusCode' in error) {
      // Handle API errors
      switch (error.statusCode) {
        case 400:
          title = 'Invalid Request';
          message = error.message || 'Please check your input and try again.';
          break;
        case 401:
          title = 'Authentication Required';
          message = 'Please log in to continue.';
          break;
        case 403:
          title = 'Access Denied';
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found.';
          break;
        case 429:
          title = 'Too Many Requests';
          message = 'Please wait a moment before trying again.';
          break;
        case 500:
          title = 'Server Error';
          message = 'Something went wrong on our end. Please try again later.';
          break;
        default:
          title = 'Error';
          message = error.message || 'An unexpected error occurred.';
      }
    } else {
      // Handle regular errors
      message = error.message || 'An unexpected error occurred.';
    }

    if (context) {
      console.error(`Error in ${context}:`, error);
    } else {
      console.error('Error:', error);
    }

    Alert.alert(title, message);
  }

  static handleNetworkError(): void {
    Alert.alert(
      'Network Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }

  static handleValidationError(errors: Record<string, string[]>): string {
    const firstError = Object.values(errors)[0];
    return firstError ? firstError[0] : 'Validation error';
  }

  static logError(error: Error | ApiError, context?: string): void {
    if (context) {
      console.error(`Error in ${context}:`, error);
    } else {
      console.error('Error:', error);
    }

    // Here you could integrate with crash reporting services like Sentry
    // Sentry.captureException(error);
  }
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export const createLoadingState = (): LoadingState => ({
  isLoading: false,
  error: null,
});

export const useAsyncOperation = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (error instanceof Error || ('statusCode' in (error as any))) {
        ErrorHandler.handleApiError(error as ApiError);
      } else {
        ErrorHandler.handleApiError(new Error('Unknown error occurred'));
      }
      return null;
    }
  };
};

// Utility function to safely parse JSON
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    ErrorHandler.logError(error as Error, 'JSON Parse');
    return defaultValue;
  }
};

// Utility function to handle async operations with loading states
export const withLoadingState = async <T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T | null> => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await operation();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    setError(errorMessage);
    ErrorHandler.logError(error as Error);
    return null;
  } finally {
    setLoading(false);
  }
};

// Simple adapter to match previous usage pattern in contexts
export const handleApiError = (error: any, setError: (msg: string | null) => void) => {
  const message = error?.message || 'An error occurred';
  setError(message);
  ErrorHandler.logError(error as any);
};

// Retry mechanism for failed operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};