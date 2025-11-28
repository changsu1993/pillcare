/**
 * AuthNavigator - Authentication Stack
 *
 * Screens for users who are NOT logged in:
 * - Welcome (landing page)
 * - SignIn (email/password login)
 * - SignUp (registration)
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Types
import { AuthStackParamList } from '../../../shared/types/navigation.types';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import FindEmailScreen from '../screens/FindEmailScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ title: 'PillCare에 오신 것을 환영합니다' }}
      />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: '로그인' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: '비밀번호 찾기' }}
      />
      <Stack.Screen
        name="FindEmail"
        component={FindEmailScreen}
        options={{ title: '아이디 찾기' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: '비밀번호 재설정' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
