/**
 * ParentNavigator - Parent App Navigation
 *
 * Navigation for elderly parent users with Stack + Tabs structure:
 * - Bottom Tabs: Home, Settings
 * - Stack Screens: FullScreenReminder, Confirmation, SkipReason, MedicationDetail
 *
 * Features:
 * - Large bottom tab icons (60px)
 * - High contrast colors
 * - Simple navigation (max 2 levels)
 * - Elderly-friendly UI
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Types
import { ParentTabParamList, ParentStackParamList } from '../types/navigation.types';

// Screens
import ParentHomeScreen from '../screens/parent/HomeScreen';
import ParentSettingsScreen from '../screens/parent/SettingsScreen';
import FullScreenReminderScreen from '../screens/parent/FullScreenReminderScreen';
import ConfirmationScreen from '../screens/parent/ConfirmationScreen';
import SkipReasonScreen from '../screens/parent/SkipReasonScreen';
import MedicationDetailScreen from '../screens/parent/MedicationDetailScreen';
import AddMedicationScreen from '../screens/parent/AddMedicationScreen';
import InvitationCodeScreen from '../screens/parent/InvitationCodeScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createStackNavigator<ParentStackParamList>();

// Home Stack Navigator
const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          height: 64,
        },
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: '700',
        },
        headerTintColor: '#1A1A1A',
      }}
    >
      <Stack.Screen
        name="Home"
        component={ParentHomeScreen}
        options={{ title: '오늘의 약' }}
      />
      <Stack.Screen
        name="FullScreenReminder"
        component={FullScreenReminderScreen}
        options={{
          title: '복약 알림',
          headerShown: false, // Full screen modal
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{
          title: '복약 완료',
          headerShown: false, // Full screen confirmation
        }}
      />
      <Stack.Screen
        name="SkipReason"
        component={SkipReasonScreen}
        options={{
          title: '건너뛰기 이유',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{
          title: '약 상세 정보',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{
          title: '약 추가하기',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="InvitationCode"
        component={InvitationCodeScreen}
        options={{
          title: '가족 초대',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          height: 64,
        },
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={ParentSettingsScreen}
        options={{ title: '설정' }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
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
        headerShown: false, // Headers are shown in Stack navigators
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size + 8} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size + 8} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ParentNavigator;
