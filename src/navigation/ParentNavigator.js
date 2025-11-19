/**
 * ParentNavigator - Parent App Navigation
 *
 * Navigation for elderly parent users:
 * - Home (today's medications)
 * - Settings
 *
 * Features:
 * - Large bottom tab icons (60px)
 * - High contrast colors
 * - Simple navigation (max 2 levels)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens (placeholders for now)
import ParentHomeScreen from '../screens/parent/HomeScreen';
// import ParentSettingsScreen from '../screens/parent/SettingsScreen';

const Tab = createBottomTabNavigator();

// Placeholder for Settings screen
const PlaceholderSettings = () => (
  <Text style={{ fontSize: 24, textAlign: 'center', marginTop: 100 }}>
    설정 화면 (준비 중)
  </Text>
);

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 72, // Larger tab bar for elderly users
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 16, // Large text
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#22C55E', // Success green
        tabBarInactiveTintColor: '#9CA3AF', // Medium gray
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          height: 64,
        },
        headerTitleStyle: {
          fontSize: 24, // Large header text
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ParentHomeScreen}
        options={{
          title: '오늘의 약',
          tabBarLabel: '홈',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size + 8} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={PlaceholderSettings}
        options={{
          title: '설정',
          tabBarLabel: '설정',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size + 8} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
