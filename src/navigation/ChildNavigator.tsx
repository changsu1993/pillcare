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
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Types
import { ChildTabParamList } from '../types/navigation.types';

// Screens
import ChildTimelineScreen from '../screens/child/TimelineScreen';

const Tab = createBottomTabNavigator<ChildTabParamList>();

// Placeholder screens
const PlaceholderRecords: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18, textAlign: 'center' }}>
      복약 기록 화면 (준비 중)
    </Text>
  </View>
);

const PlaceholderSettings: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18, textAlign: 'center' }}>
      설정 화면 (준비 중)
    </Text>
  </View>
);

const ChildNavigator: React.FC = () => {
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
};

export default ChildNavigator;
