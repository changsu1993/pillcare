/**
 * ChildNavigator - 자녀 앱 네비게이션
 *
 * 부모 모니터링을 위한 자녀 사용자 네비게이션:
 * - 홈 (부모님 복약 현황)
 * - 약 관리 (약 목록, 추가, 수정, 삭제)
 * - 리포트 (복약 통계 및 기록)
 * - 설정 (프로필, 알림, 가족 연결)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Types
import { ChildTabParamList, ChildStackParamList } from '../types/navigation.types';

// Screens
import ChildHomeScreen from '../screens/child/HomeScreen';
import MedicationManageScreen from '../screens/child/MedicationManageScreen';
import ReportsScreen from '../screens/child/ReportsScreen';
import ChildSettingsScreen from '../screens/child/SettingsScreen';
import EnterCodeScreen from '../screens/child/EnterCodeScreen';

const Tab = createBottomTabNavigator<ChildTabParamList>();
const Stack = createNativeStackNavigator<ChildStackParamList>();

/**
 * 홈 탭 스택
 */
const HomeStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTitleStyle: { fontSize: 18, fontWeight: '700' },
      headerTintColor: '#1A1A1A',
    }}
  >
    <Stack.Screen
      name="Home"
      component={ChildHomeScreen}
      options={{ title: '부모님 복약 현황' }}
    />
  </Stack.Navigator>
);

/**
 * 약 관리 탭 스택
 */
const MedicationsStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTitleStyle: { fontSize: 18, fontWeight: '700' },
      headerTintColor: '#1A1A1A',
    }}
  >
    <Stack.Screen
      name="MedicationManage"
      component={MedicationManageScreen}
      options={{ title: '약 관리' }}
    />
  </Stack.Navigator>
);

/**
 * 리포트 탭 스택
 */
const ReportsStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTitleStyle: { fontSize: 18, fontWeight: '700' },
      headerTintColor: '#1A1A1A',
    }}
  >
    <Stack.Screen
      name="Reports"
      component={ReportsScreen}
      options={{ title: '복약 리포트' }}
    />
  </Stack.Navigator>
);

/**
 * 설정 탭 스택
 */
const SettingsStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTitleStyle: { fontSize: 18, fontWeight: '700' },
      headerTintColor: '#1A1A1A',
    }}
  >
    <Stack.Screen
      name="Settings"
      component={ChildSettingsScreen}
      options={{ title: '설정' }}
    />
    <Stack.Screen
      name="EnterCode"
      component={EnterCodeScreen}
      options={{ title: '초대 코드 입력' }}
    />
  </Stack.Navigator>
);

/**
 * 자녀 네비게이터 (탭 기반)
 */
const ChildNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 56,
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MedicationsTab"
        component={MedicationsStack}
        options={{
          tabBarLabel: '약 관리',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsStack}
        options={{
          tabBarLabel: '리포트',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ChildNavigator;
