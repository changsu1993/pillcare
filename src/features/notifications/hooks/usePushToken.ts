/**
 * usePushToken Hook
 *
 * Custom hook for managing Expo push tokens.
 * - Gets push token on mount
 * - Saves token to database
 * - Handles token refresh
 *
 * Usage:
 * ```typescript
 * const { token, isLoading, error, refreshToken } = usePushToken();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getExpoPushToken, requestNotificationPermissions } from '../services/notifications';
import { savePushToken } from '../../../shared/services/api';

interface UsePushTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  refreshToken: () => Promise<void>;
}

/**
 * Hook for managing push notification token
 *
 * @description
 * This hook:
 * 1. Requests notification permissions
 * 2. Gets Expo push token
 * 3. Saves token to database
 * 4. Provides refresh capability
 *
 * Note: Push tokens only work on physical devices.
 * On simulators/emulators, token will be null.
 */
export const usePushToken = (): UsePushTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const initializePushToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permissions
      const permissionGranted = await requestNotificationPermissions();
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        console.log('Notification permission denied');
        setError('Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Get push token
      const pushToken = await getExpoPushToken();

      if (pushToken) {
        setToken(pushToken);

        // Save to database
        try {
          await savePushToken(pushToken);
          console.log('Push token saved to database');
        } catch (saveError) {
          console.error('Failed to save push token:', saveError);
          // Don't set error - token is still valid locally
        }
      } else {
        console.log('Could not get push token');
        // This is expected in development without proper EAS config
        if (__DEV__) {
          console.log('Push tokens may not work in development mode');
        }
      }
    } catch (err) {
      console.error('Error initializing push token:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializePushToken();
  }, [initializePushToken]);

  // Refresh function for manual refresh
  const refreshToken = useCallback(async () => {
    await initializePushToken();
  }, [initializePushToken]);

  return {
    token,
    isLoading,
    error,
    hasPermission,
    refreshToken,
  };
};

export default usePushToken;
