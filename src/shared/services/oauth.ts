/**
 * OAuth Service Module
 *
 * Handles Google and Apple sign-in integration with Supabase.
 * Uses expo-auth-session for OAuth flow management.
 */

import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

/**
 * Get redirect URI for OAuth callback
 */
export const getRedirectUri = (): string => {
  return makeRedirectUri({
    scheme: 'pillcare',
    path: 'auth/callback',
  });
};

/**
 * Sign in with Google using Supabase OAuth
 *
 * Opens a web browser for Google authentication.
 * After successful auth, Supabase handles session creation.
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const redirectUri = getRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('OAuth URL not received');

    // Open browser for authentication
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type === 'success' && result.url) {
      // Extract tokens from URL
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        // Set session with tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError) throw sessionError;
      }
    } else if (result.type === 'cancel') {
      throw new Error('로그인이 취소되었습니다.');
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign in with Apple using native Apple Authentication
 *
 * Uses expo-apple-authentication for native iOS sign-in.
 * Falls back to Supabase OAuth on Android (not supported natively).
 */
export const signInWithApple = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      // Native Apple Sign-In for iOS
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple 인증 토큰을 받지 못했습니다.');
      }

      // Sign in to Supabase with Apple ID token
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;
    } else {
      // For Android, use Supabase OAuth flow (Apple Sign-In on web)
      const redirectUri = getRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('OAuth URL not received');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;
        }
      } else if (result.type === 'cancel') {
        throw new Error('로그인이 취소되었습니다.');
      }
    }
  } catch (error: unknown) {
    // Handle Apple authentication specific errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_REQUEST_CANCELED'
    ) {
      throw new Error('로그인이 취소되었습니다.');
    }
    console.error('Apple sign-in error:', error);
    throw error;
  }
};

/**
 * Check if Apple Authentication is available
 * (Only available on iOS 13+)
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    // Apple Sign-In via web is available on Android too
    return true;
  }
  return await AppleAuthentication.isAvailableAsync();
};

/**
 * Get OAuth provider display name
 */
export const getProviderDisplayName = (provider: 'google' | 'apple'): string => {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    default:
      return provider;
  }
};
