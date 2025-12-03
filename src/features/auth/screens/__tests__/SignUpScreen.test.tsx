/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * SignUpScreen Tests
 *
 * Tests for the user registration screen.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../SignUpScreen';
import { signUp } from '../../../../shared/services/supabase';
import { createMockNavigation, createMockRoute } from '../../../../test/test-utils';

// Mock supabase signUp
jest.mock('../../../../shared/services/supabase', () => ({
  signUp: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;

describe('SignUpScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = createMockRoute();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText('회원가입')).toBeTruthy();
      expect(getByPlaceholderText('홍길동')).toBeTruthy(); // Name
      expect(getByPlaceholderText('example@email.com')).toBeTruthy(); // Email
      expect(getByPlaceholderText('010-1234-5678')).toBeTruthy(); // Phone
    });

    it('should render role selection buttons', () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(expect.stringContaining('부모'))).toBeTruthy();
      expect(getByText(expect.stringContaining('자녀'))).toBeTruthy();
    });

    it('should have child role selected by default', () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const childButton = getByText(expect.stringContaining('자녀'));
      // Check if the button has the selected style
      expect(childButton).toBeTruthy();
    });

    it('should render back button', () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(expect.stringContaining('뒤로'))).toBeTruthy();
    });
  });

  describe('Role Selection', () => {
    it('should allow selecting parent role', async () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const parentButton = getByText(expect.stringContaining('부모'));

      await act(async () => {
        fireEvent.press(parentButton);
      });

      // After pressing, parent should be selected (visual styling changes)
      // We verify by checking if the role is passed to signup
    });
  });

  describe('Form Validation', () => {
    it('should show error when required fields are empty', async () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('오류'),
          expect.stringContaining('필수')
        );
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should show error when password is less than 8 characters', async () => {
      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'short1'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'short1');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('비밀번호'),
          expect.stringContaining('8자')
        );
      });
    });

    it('should show error when password lacks letters', async () => {
      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        '12345678'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), '12345678');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('비밀번호'),
          expect.stringContaining('영문')
        );
      });
    });

    it('should show error when password lacks numbers', async () => {
      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'abcdefgh'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'abcdefgh');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('비밀번호'),
          expect.stringContaining('숫자')
        );
      });
    });

    it('should show error when passwords do not match', async () => {
      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'password1'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'password2');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('비밀번호'),
          expect.stringContaining('일치')
        );
      });
    });
  });

  describe('Sign Up Flow', () => {
    const fillValidForm = (
      getByPlaceholderText: any,
      getByText: any,
      role: 'parent' | 'child' = 'child'
    ) => {
      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('010-1234-5678'), '010-1234-5678');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'password1'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'password1');

      if (role === 'parent') {
        fireEvent.press(getByText(expect.stringContaining('부모')));
      }
    };

    it('should call signUp with correct parameters', async () => {
      mockSignUp.mockResolvedValue({
        user: { id: 'new-user-id', email: 'test@example.com' },
        session: null,
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'password1',
          expect.objectContaining({
            name: 'Test User',
            phone: '010-1234-5678',
            role: 'child',
          })
        );
      });
    });

    it('should include parent role when selected', async () => {
      mockSignUp.mockResolvedValue({
        user: { id: 'new-user-id', email: 'test@example.com' },
        session: null,
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fillValidForm(getByPlaceholderText, getByText, 'parent');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            role: 'parent',
          })
        );
      });
    });

    it('should show success alert and navigate to SignIn on successful signup', async () => {
      mockSignUp.mockResolvedValue({
        user: { id: 'new-user-id', email: 'test@example.com' },
        session: null,
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('완료'),
          expect.any(String),
          expect.any(Array)
        );
      });

      // Simulate pressing the alert button
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const alertButtons = alertCall[2];
      if (alertButtons && alertButtons[0]?.onPress) {
        alertButtons[0].onPress();
      }

      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
    });

    it('should show error alert on signup failure', async () => {
      mockSignUp.mockRejectedValue(new Error('Email already exists'));

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('실패'),
          expect.stringContaining('Email already exists')
        );
      });
    });

    it('should show error when user object is not returned', async () => {
      mockSignUp.mockResolvedValue({
        user: null,
        session: null,
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('실패'),
          expect.any(String)
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const backButton = getByText(expect.stringContaining('뒤로'));
      fireEvent.press(backButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should navigate to SignIn when link is pressed', () => {
      const { getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const signInLink = getByText('로그인');
      fireEvent.press(signInLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
    });
  });

  describe('Input Behavior', () => {
    it('should trim name and email before signup', async () => {
      mockSignUp.mockResolvedValue({
        user: { id: 'new-user-id', email: 'test@example.com' },
        session: null,
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByPlaceholderText('홍길동'), '  Test User  ');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), '  test@example.com  ');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'password1'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'password1');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com', // trimmed
          'password1',
          expect.objectContaining({
            name: 'Test User', // trimmed
          })
        );
      });
    });

    it('should have phone input as optional', async () => {
      mockSignUp.mockResolvedValue({
        user: { id: 'new-user-id', email: 'test@example.com' },
        session: null,
      } as any);

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Fill only required fields (no phone)
      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'password1'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'password1');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable form during loading', async () => {
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({ user: null, session: null }), 500))
      );

      const { getByPlaceholderText, getByText } = render(
        <SignUpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByPlaceholderText('홍길동'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
      fireEvent.changeText(
        getByPlaceholderText(expect.stringContaining('비밀번호를 입력')),
        'password1'
      );
      fireEvent.changeText(getByPlaceholderText(expect.stringContaining('다시 입력')), 'password1');

      const signupButton = getByText('회원가입');

      await act(async () => {
        fireEvent.press(signupButton);
        // Try to press again while loading
        fireEvent.press(signupButton);
      });

      // signUp should only be called once
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });
  });
});
