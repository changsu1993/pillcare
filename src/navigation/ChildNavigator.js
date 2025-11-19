/**
 * ChildNavigator - Child App Navigation
 *
 * Navigation for adult child users who monitor parents:
 * - Timeline (real-time parent medication status)
 * - Records (weekly/monthly adherence reports)
 * - Settings (profile, notifications, family management)
 *
 * Features:
 * - Standard UI (not elderly-optimized)
 * - Rich data visualization
 * - Real-time updates via Supabase subscriptions
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens (placeholders for now)
import ChildTimelineScreen from '../screens/child/TimelineScreen';
// import ChildRecordsScreen from '../screens/child/RecordsScreen';
// import ChildSettingsScreen from '../screens/child/SettingsScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens
const PlaceholderRecords = () => (
  <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 100 }}>
    복약 기록 화면 (준비 중)
  </Text>
);

const PlaceholderSettings = () => (
  <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 100 }}>
    설정 화면 (준비 중)
  </Text>
);

export default function ChildNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 56, // Standard tab bar height
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#3B82F6', // Primary blue
        tabBarInactiveTintColor: '#9CA3AF', // Medium gray
        headerStyle: {
          height: 56,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Timeline"
        component={ChildTimelineScreen}
        options={{
          title: '부모님 복약 현황',
          tabBarLabel: '타임라인',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Records"
        component={PlaceholderRecords}
        options={{
          title: '복약 기록',
          tabBarLabel: '기록',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
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
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
