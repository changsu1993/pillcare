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
import { ParentTabParamList, ParentStackParamList } from '../shared/types/navigation.types';

// Screens
import ParentHomeScreen from '../features/home/screens/parent/HomeScreen';
import ParentSettingsScreen from '../features/settings/screens/parent/SettingsScreen';
import FullScreenReminderScreen from '../features/medication/screens/parent/FullScreenReminderScreen';
import ConfirmationScreen from '../features/medication/screens/parent/ConfirmationScreen';
import SkipReasonScreen from '../features/medication/screens/parent/SkipReasonScreen';
import MedicationDetailScreen from '../features/medication/screens/parent/MedicationDetailScreen';
import AddMedicationScreen from '../features/medication/screens/parent/AddMedicationScreen';
import EditMedicationScreen from '../features/medication/screens/parent/EditMedicationScreen';
import InvitationCodeScreen from '../features/family/screens/parent/InvitationCodeScreen';
import MedicationCalendarScreen from '../features/home/screens/parent/MedicationCalendarScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createStackNavigator<ParentStackParamList>();

// Home Stack Navigator
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: '700',
        },
        headerTintColor: '#1A1A1A',
      }}
    >
      <Stack.Screen name="Home" component={ParentHomeScreen} options={{ title: '오늘의 약' }} />
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
        name="EditMedication"
        component={EditMedicationScreen}
        options={{
          title: '약 수정하기',
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
      <Stack.Screen
        name="MedicationCalendar"
        component={MedicationCalendarScreen}
        options={{
          title: '복약 이력',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: '700',
        },
        headerTintColor: '#1A1A1A',
      }}
    >
      <Stack.Screen name="Settings" component={ParentSettingsScreen} options={{ title: '설정' }} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const ParentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 90, // Larger tab bar for elderly users
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 16, // Large text
          fontWeight: '600',
          marginTop: 6,
        },
        tabBarActiveTintColor: '#22C55E', // Success green
        tabBarInactiveTintColor: '#9CA3AF', // Medium gray
        tabBarIconStyle: {
          marginBottom: 4,
        },
        headerShown: false, // Headers are shown in Stack navigators
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => <Ionicons name="medical" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default ParentNavigator;
