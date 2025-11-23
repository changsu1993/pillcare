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
import { AuthStackParamList } from '../types/navigation.types';

// Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

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
    </Stack.Navigator>
  );
};

export default AuthNavigator;
