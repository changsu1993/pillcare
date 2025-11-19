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

// Screens (placeholders for now)
import WelcomeScreen from '../screens/auth/WelcomeScreen';
// import SignInScreen from '../screens/auth/SignInScreen';
// import SignUpScreen from '../screens/auth/SignUpScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
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
      {/* TODO: Add SignIn and SignUp screens */}
    </Stack.Navigator>
  );
}
