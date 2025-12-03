/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OAuth Service Tests
 *
 * Tests for Google and Apple OAuth flows in src/shared/services/oauth.ts
 */

import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  signInWithGoogle,
  signInWithApple,
  isAppleAuthAvailable,
  getRedirectUri,
  getProviderDisplayName,
} from '../oauth';
import { supabase } from '../supabase';

// Mock Platform module with getter for OS
let mockPlatformOS = 'ios';
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    select: jest.fn((obj: any) => obj.ios || obj.default),
  },
}));

// Mock modules
jest.mock('expo-web-browser');
jest.mock('expo-apple-authentication');
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signInWithIdToken: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

const mockWebBrowser = WebBrowser as jest.Mocked<typeof WebBrowser>;
const mockAppleAuth = AppleAuthentication as jest.Mocked<typeof AppleAuthentication>;
const mockSupabaseAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

describe('OAuth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = 'ios';
  });

  describe('getRedirectUri', () => {
    it('should return properly formatted redirect URI', () => {
      const uri = getRedirectUri();

      expect(uri).toBe('pillcare://auth/callback');
    });
  });

  describe('signInWithGoogle', () => {
    it('should initiate Google OAuth flow', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'pillcare://auth/callback#access_token=test-token&refresh_token=refresh-token',
      });

      mockSupabaseAuth.setSession.mockResolvedValue({
        data: { user: { id: 'user-id' }, session: {} },
        error: null,
      });

      await signInWithGoogle();

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          skipBrowserRedirect: true,
        }),
      });
      expect(mockWebBrowser.openAuthSessionAsync).toHaveBeenCalled();
      expect(mockSupabaseAuth.setSession).toHaveBeenCalledWith({
        access_token: 'test-token',
        refresh_token: 'refresh-token',
      });
    });

    it('should throw error when OAuth URL not received', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { url: null, provider: 'google' },
        error: null,
      });

      await expect(signInWithGoogle()).rejects.toThrow('OAuth URL not received');
    });

    it('should throw error when OAuth request fails', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: new Error('OAuth configuration error'),
      });

      await expect(signInWithGoogle()).rejects.toThrow('OAuth configuration error');
    });

    it('should handle user cancellation gracefully', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'cancel',
      });

      // Korean error message for cancellation
      await expect(signInWithGoogle()).rejects.toThrow('취소');
    });

    it('should throw error when session creation fails', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'pillcare://auth/callback#access_token=test-token&refresh_token=refresh-token',
      });

      mockSupabaseAuth.setSession.mockResolvedValue({
        data: null,
        error: new Error('Session creation failed'),
      });

      await expect(signInWithGoogle()).rejects.toThrow('Session creation failed');
    });
  });

  describe('signInWithApple', () => {
    describe('on iOS', () => {
      beforeEach(() => {
        mockPlatformOS = 'ios';
      });

      it('should use native Apple authentication', async () => {
        mockAppleAuth.signInAsync.mockResolvedValue({
          identityToken: 'apple-id-token',
          user: 'apple-user-id',
          email: 'test@apple.com',
          fullName: { givenName: 'Test', familyName: 'User' },
          authorizationCode: 'auth-code',
          realUserStatus: 1,
          state: null,
        });

        mockSupabaseAuth.signInWithIdToken.mockResolvedValue({
          data: { user: { id: 'user-id' }, session: {} },
          error: null,
        });

        await signInWithApple();

        expect(mockAppleAuth.signInAsync).toHaveBeenCalledWith({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        expect(mockSupabaseAuth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'apple',
          token: 'apple-id-token',
        });
      });

      it('should throw error when identity token is missing', async () => {
        mockAppleAuth.signInAsync.mockResolvedValue({
          identityToken: null,
          user: 'apple-user-id',
          email: null,
          fullName: null,
          authorizationCode: null,
          realUserStatus: 0,
          state: null,
        });

        await expect(signInWithApple()).rejects.toThrow('Apple');
      });

      it('should throw error when Supabase ID token sign-in fails', async () => {
        mockAppleAuth.signInAsync.mockResolvedValue({
          identityToken: 'apple-id-token',
          user: 'apple-user-id',
          email: 'test@apple.com',
          fullName: null,
          authorizationCode: 'auth-code',
          realUserStatus: 1,
          state: null,
        });

        mockSupabaseAuth.signInWithIdToken.mockResolvedValue({
          data: null,
          error: new Error('ID token verification failed'),
        });

        await expect(signInWithApple()).rejects.toThrow('ID token verification failed');
      });

      it('should handle user cancellation', async () => {
        const cancelError = { code: 'ERR_REQUEST_CANCELED' };
        mockAppleAuth.signInAsync.mockRejectedValue(cancelError);

        // Korean error message for cancellation
        await expect(signInWithApple()).rejects.toThrow('취소');
      });
    });

    describe('on Android', () => {
      beforeEach(() => {
        mockPlatformOS = 'android';
      });

      afterEach(() => {
        mockPlatformOS = 'ios'; // Reset to default
      });

      it('should use OAuth flow on Android', async () => {
        mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
          data: { url: 'https://appleid.apple.com/oauth', provider: 'apple' },
          error: null,
        });

        mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
          type: 'success',
          url: 'pillcare://auth/callback#access_token=test-token&refresh_token=refresh-token',
        });

        mockSupabaseAuth.setSession.mockResolvedValue({
          data: { user: { id: 'user-id' }, session: {} },
          error: null,
        });

        await signInWithApple();

        expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'apple',
          options: expect.objectContaining({
            skipBrowserRedirect: true,
          }),
        });
        expect(mockAppleAuth.signInAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('isAppleAuthAvailable', () => {
    it('should check availability on iOS', async () => {
      mockPlatformOS = 'ios';
      mockAppleAuth.isAvailableAsync.mockResolvedValue(true);

      const result = await isAppleAuthAvailable();

      expect(result).toBe(true);
      expect(mockAppleAuth.isAvailableAsync).toHaveBeenCalled();
    });

    it('should return true on Android (web fallback available)', async () => {
      mockPlatformOS = 'android';

      const result = await isAppleAuthAvailable();

      expect(result).toBe(true);
      expect(mockAppleAuth.isAvailableAsync).not.toHaveBeenCalled();
    });

    it('should return false on iOS when not available', async () => {
      mockPlatformOS = 'ios';
      mockAppleAuth.isAvailableAsync.mockResolvedValue(false);

      const result = await isAppleAuthAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getProviderDisplayName', () => {
    it('should return "Google" for google provider', () => {
      expect(getProviderDisplayName('google')).toBe('Google');
    });

    it('should return "Apple" for apple provider', () => {
      expect(getProviderDisplayName('apple')).toBe('Apple');
    });

    it('should return provider name as fallback', () => {
      // @ts-expect-error - Testing fallback behavior with invalid provider
      expect(getProviderDisplayName('unknown')).toBe('unknown');
    });
  });
});

describe('OAuth Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log errors to console in development', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    mockSupabaseAuth.signInWithOAuth.mockRejectedValue(new Error('Network error'));

    await expect(signInWithGoogle()).rejects.toThrow('Network error');

    expect(consoleSpy).toHaveBeenCalledWith('Google sign-in error:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
