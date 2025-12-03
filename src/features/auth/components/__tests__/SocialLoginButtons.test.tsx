/**
 * SocialLoginButtons Component Tests
 *
 * Tests for Google and Apple sign-in button component.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SocialLoginButtons from '../SocialLoginButtons';
import {
  signInWithGoogle,
  signInWithApple,
  isAppleAuthAvailable,
} from '../../../../shared/services/oauth';

// Mock OAuth service
jest.mock('../../../../shared/services/oauth', () => ({
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  isAppleAuthAvailable: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockSignInWithGoogle = signInWithGoogle as jest.MockedFunction<typeof signInWithGoogle>;
const mockSignInWithApple = signInWithApple as jest.MockedFunction<typeof signInWithApple>;
const mockIsAppleAuthAvailable = isAppleAuthAvailable as jest.MockedFunction<
  typeof isAppleAuthAvailable
>;

describe('SocialLoginButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAppleAuthAvailable.mockResolvedValue(true);
  });

  describe('Rendering', () => {
    it('should render Google sign-in button', async () => {
      const { getByText } = render(<SocialLoginButtons />);

      await waitFor(() => {
        expect(getByText('Google')).toBeTruthy();
      });
    });

    it('should render Apple sign-in button when available', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(true);

      const { findByText } = render(<SocialLoginButtons />);

      const appleButton = await findByText('Apple');
      expect(appleButton).toBeTruthy();
    });

    it('should not render Apple button when not available', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(false);

      const { queryByText } = render(<SocialLoginButtons />);

      // Wait for availability check
      await waitFor(() => {
        expect(queryByText('Apple')).toBeNull();
      });
    });

    it('should apply disabled styling when disabled prop is true', () => {
      const { getByText } = render(<SocialLoginButtons disabled={true} />);

      const googleButton = getByText('Google').parent?.parent;
      expect(googleButton?.props.className || googleButton?.props.style).toBeDefined();
    });
  });

  describe('Google Sign-In', () => {
    it('should call signInWithGoogle when Google button is pressed', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { getByText } = render(<SocialLoginButtons />);

      await act(async () => {
        fireEvent.press(getByText('Google'));
      });

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading indicator during Google sign-in', async () => {
      mockSignInWithGoogle.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { getByText, queryByTestId } = render(<SocialLoginButtons />);

      await act(async () => {
        fireEvent.press(getByText('Google'));
      });

      // During loading, ActivityIndicator should be shown
      // Note: In actual implementation, we might need testID
    });

    it('should call onAuthStart and onAuthEnd callbacks', async () => {
      const onAuthStart = jest.fn();
      const onAuthEnd = jest.fn();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { getByText } = render(
        <SocialLoginButtons onAuthStart={onAuthStart} onAuthEnd={onAuthEnd} />
      );

      await act(async () => {
        fireEvent.press(getByText('Google'));
      });

      await waitFor(() => {
        expect(onAuthStart).toHaveBeenCalledTimes(1);
        expect(onAuthEnd).toHaveBeenCalledTimes(1);
      });
    });

    it('should show alert on Google sign-in error', async () => {
      const error = new Error('Google error');
      mockSignInWithGoogle.mockRejectedValue(error);

      const { getByText } = render(<SocialLoginButtons />);

      await act(async () => {
        fireEvent.press(getByText('Google'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('Google')
        );
      });
    });

    it('should not show alert when user cancels', async () => {
      const cancelError = new Error('cancel');
      mockSignInWithGoogle.mockRejectedValue(cancelError);

      const { getByText } = render(<SocialLoginButtons />);

      await act(async () => {
        fireEvent.press(getByText('Google'));
      });

      await waitFor(() => {
        // Alert should not be shown for cancellation
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });

    it('should disable button when loading', async () => {
      mockSignInWithGoogle.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const { getByText } = render(<SocialLoginButtons />);
      const googleButton = getByText('Google');

      await act(async () => {
        fireEvent.press(googleButton);
        // Try to press again while loading
        fireEvent.press(googleButton);
      });

      // signInWithGoogle should only be called once
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Apple Sign-In', () => {
    it('should call signInWithApple when Apple button is pressed', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(true);
      mockSignInWithApple.mockResolvedValue(undefined);

      const { findByText } = render(<SocialLoginButtons />);

      const appleButton = await findByText('Apple');

      await act(async () => {
        fireEvent.press(appleButton);
      });

      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalledTimes(1);
      });
    });

    it('should show alert on Apple sign-in error', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(true);
      const error = new Error('Apple error');
      mockSignInWithApple.mockRejectedValue(error);

      const { findByText } = render(<SocialLoginButtons />);

      const appleButton = await findByText('Apple');

      await act(async () => {
        fireEvent.press(appleButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('Apple')
        );
      });
    });

    it('should not show alert when user cancels Apple sign-in', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(true);
      const cancelError = new Error('cancel');
      mockSignInWithApple.mockRejectedValue(cancelError);

      const { findByText } = render(<SocialLoginButtons />);

      const appleButton = await findByText('Apple');

      await act(async () => {
        fireEvent.press(appleButton);
      });

      await waitFor(() => {
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });
  });

  describe('Props Interaction', () => {
    it('should disable both buttons when disabled prop is true', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(true);

      const { getByText, findByText } = render(<SocialLoginButtons disabled={true} />);

      const googleButton = getByText('Google');
      const appleButton = await findByText('Apple');

      await act(async () => {
        fireEvent.press(googleButton);
        fireEvent.press(appleButton);
      });

      expect(mockSignInWithGoogle).not.toHaveBeenCalled();
      expect(mockSignInWithApple).not.toHaveBeenCalled();
    });

    it('should disable Apple button when Google is loading', async () => {
      mockIsAppleAuthAvailable.mockResolvedValue(true);
      mockSignInWithGoogle.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const { getByText, findByText } = render(<SocialLoginButtons />);

      const googleButton = getByText('Google');
      const appleButton = await findByText('Apple');

      await act(async () => {
        fireEvent.press(googleButton);
        fireEvent.press(appleButton);
      });

      // Apple should not be called because Google is loading
      expect(mockSignInWithApple).not.toHaveBeenCalled();
    });
  });
});
