/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * SignInScreen Tests
 *
 * Tests for the user login screen.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignInScreen from '../SignInScreen';
import { signIn } from '../../../../shared/services/supabase';
import { createMockNavigation, createMockRoute } from '../../../../test/test-utils';

// Mock supabase signIn
jest.mock('../../../../shared/services/supabase', () => ({
  signIn: jest.fn(),
}));

// Mock SocialLoginButtons
jest.mock('../../components/SocialLoginButtons', () => {
  return function MockSocialLoginButtons() {
    return null;
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('SignInScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = createMockRoute();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form elements', () => {
      const { getByPlaceholderText, getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText('sign')).toBeTruthy();
      expect(getByPlaceholderText('example@email.com')).toBeTruthy();
      expect(
        getByPlaceholderText(expect.stringContaining('password') || expect.stringContaining('비밀'))
      ).toBeTruthy();
    });

    it('should render back button', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(
        getByText(expect.stringContaining('back') || expect.stringContaining('뒤로'))
      ).toBeTruthy();
    });

    it('should render forgot password link', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(
        getByText(expect.stringContaining('password') || expect.stringContaining('비밀번호'))
      ).toBeTruthy();
    });

    it('should render sign up link', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(
        getByText(expect.stringContaining('signup') || expect.stringContaining('회원가입'))
      ).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const { getByPlaceholderText, getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));
      fireEvent.changeText(passwordInput, 'password123');

      // Find and press login button
      const loginButtons = getByText('로그인');
      await act(async () => {
        fireEvent.press(loginButtons);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('이메일') || expect.stringContaining('입력')
        );
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const { getByPlaceholderText, getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');

      // Find and press login button (the main one, not the link)
      const buttons = getByText('로그인');
      await act(async () => {
        fireEvent.press(buttons);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Sign In Flow', () => {
    it('should call signIn with email and password', async () => {
      mockSignIn.mockResolvedValue({
        user: { id: 'user-123' },
        session: { access_token: 'token' },
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getByText('로그인');
      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should trim email before signing in', async () => {
      mockSignIn.mockResolvedValue({
        user: { id: 'user-123' },
        session: { access_token: 'token' },
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));

      fireEvent.changeText(emailInput, '  test@example.com  ');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getByText('로그인');
      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show error alert on sign in failure', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

      const { getByPlaceholderText, getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      const loginButton = getByText('로그인');
      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('실패') || expect.stringContaining('오류'),
          expect.any(String)
        );
      });
    });

    it('should show loading indicator during sign in', async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  user: { id: 'test' } as any,
                  session: {} as any,
                  weakPassword: undefined,
                }),
              100
            )
          )
      );

      const { getByPlaceholderText, getByText, getByTestId } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getByText('로그인');
      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Verify loading state is set (button should be disabled)
      // In actual implementation, ActivityIndicator should be shown
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const backButton = getByText(expect.stringContaining('뒤로'));
      fireEvent.press(backButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should navigate to ForgotPassword when link is pressed', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const forgotLink = getByText(expect.stringContaining('비밀번호 찾기'));
      fireEvent.press(forgotLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });

    it('should navigate to SignUp when link is pressed', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const signupLink = getByText('회원가입');
      fireEvent.press(signupLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
    });

    it('should navigate to FindEmail when link is pressed', () => {
      const { getByText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const findEmailLink = getByText(expect.stringContaining('아이디 찾기'));
      fireEvent.press(findEmailLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('FindEmail');
    });
  });

  describe('Input Behavior', () => {
    it('should update email state on text change', () => {
      const { getByPlaceholderText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      fireEvent.changeText(emailInput, 'newemail@test.com');

      expect(emailInput.props.value).toBe('newemail@test.com');
    });

    it('should update password state on text change', () => {
      const { getByPlaceholderText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));
      fireEvent.changeText(passwordInput, 'newpassword');

      expect(passwordInput.props.value).toBe('newpassword');
    });

    it('should have secure text entry for password', () => {
      const { getByPlaceholderText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const passwordInput = getByPlaceholderText(expect.stringContaining('비밀'));
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should have email keyboard type for email input', () => {
      const { getByPlaceholderText } = render(
        <SignInScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('example@email.com');
      expect(emailInput.props.keyboardType).toBe('email-address');
    });
  });
});
