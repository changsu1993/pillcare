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
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Types
import { ParentTabParamList } from '../types/navigation.types';

// Screens
import ParentHomeScreen from '../screens/parent/HomeScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

// Placeholder for Settings screen
const PlaceholderSettings: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, textAlign: 'center' }}>
      설정 화면 (준비 중)
    </Text>
  </View>
);

const ParentNavigator: React.FC = () => {
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
};

export default ParentNavigator;
