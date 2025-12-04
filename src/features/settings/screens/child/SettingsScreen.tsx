/**
 * ChildSettingsScreen - 자녀 설정 화면
 *
 * 자녀 사용자의 설정 및 프로필 관리 화면
 * - 프로필 정보 표시
 * - 알림 설정
 * - 가족 연결 관리
 * - 로그아웃
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase, signOut, getCurrentUser } from '../../../../shared/services/supabase';
import {
  getConnectedParent,
  getFamilyConnections,
  removeFamilyConnection,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../../../shared/services/api';
import { User, FamilyConnection } from '../../../../shared/types/database.types';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';
import { requestNotificationPermissions } from '../../../notifications/services/notifications';
import { useTheme, ThemeMode, getThemeModeLabel } from '../../../../shared/contexts/ThemeContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: string;
}

type NavigationProp = NativeStackNavigationProp<ChildStackParamList, 'Settings'>;

const ChildSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectedParent, setConnectedParent] = useState<User | null>(null);
  const [familyConnections, setFamilyConnections] = useState<FamilyConnection[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [missedAlertEnabled, setMissedAlertEnabled] = useState(true);

  // Theme context
  const { themeMode, isDarkMode, setTheme } = useTheme();

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      if (user) {
        const [profileData, parent, connections, prefs] = await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).single(),
          getConnectedParent(),
          getFamilyConnections(),
          getNotificationPreferences(),
        ]);

        if (profileData.data) {
          setProfile(profileData.data);
        }
        setConnectedParent(parent);
        setFamilyConnections(connections);

        // Set notification preferences from database
        if (prefs) {
          setNotificationsEnabled(prefs.push_enabled);
          setMissedAlertEnabled(prefs.missed_medication_alert);
        }
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle push notification toggle
   */
  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      setIsSavingPrefs(true);

      // If enabling, request permission first
      if (enabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert('알림 권한 필요', '알림을 받으려면 설정에서 알림 권한을 허용해주세요.', [
            { text: '확인' },
          ]);
          return;
        }
      }

      setNotificationsEnabled(enabled);

      // Save to database
      await updateNotificationPreferences({ push_enabled: enabled });

      // If disabling push, also disable missed alert
      if (!enabled && missedAlertEnabled) {
        setMissedAlertEnabled(false);
        await updateNotificationPreferences({ missed_medication_alert: false });
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      // Revert on error
      setNotificationsEnabled(!enabled);
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  /**
   * Handle missed medication alert toggle
   */
  const handleMissedAlertToggle = async (enabled: boolean) => {
    try {
      setIsSavingPrefs(true);

      // If enabling, ensure push is also enabled
      if (enabled && !notificationsEnabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert('알림 권한 필요', '미복용 알림을 받으려면 알림 권한을 허용해주세요.', [
            { text: '확인' },
          ]);
          return;
        }
        setNotificationsEnabled(true);
        await updateNotificationPreferences({ push_enabled: true });
      }

      setMissedAlertEnabled(enabled);

      // Save to database
      await updateNotificationPreferences({ missed_medication_alert: enabled });
    } catch (error) {
      console.error('미복용 알림 설정 저장 실패:', error);
      // Revert on error
      setMissedAlertEnabled(!enabled);
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleEnterCode = () => {
    navigation.navigate('EnterCode');
  };

  const handleRemoveConnection = (connection: FamilyConnection) => {
    const parentName = connection.parent?.name || '부모님';
    Alert.alert(
      '연결 해제',
      `${parentName}님과의 연결을 해제하시겠습니까?\n\n연결 해제 시 부모님의 복약 현황을 확인할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyConnection(connection.id);
              await loadData();
              Alert.alert('완료', '연결이 해제되었습니다.');
            } catch (error) {
              console.error('Error removing connection:', error);
              Alert.alert('오류', '연결 해제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('로그아웃 실패:', error);
            Alert.alert('오류', '로그아웃에 실패했습니다.');
          }
        },
      },
    ]);
  };

  /**
   * Handle theme mode change
   */
  const handleThemeChange = async (mode: ThemeMode) => {
    try {
      setIsSavingPrefs(true);
      await setTheme(mode);
    } catch (error) {
      console.error('Error saving theme setting:', error);
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  if (isLoading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['bottom']}
    >
      <ScrollView className="flex-1">
        {/* 프로필 섹션 */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            프로필
          </Text>
          <View className="flex-row items-center py-2">
            <View className="w-[60px] h-[60px] rounded-full bg-primary justify-center items-center">
              <Text className="text-2xl font-bold text-white">
                {profile?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text
                className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {profile?.name || '이름 없음'}
              </Text>
              <Text className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {profile?.email}
              </Text>
              <View
                className={`mt-1.5 px-2.5 py-1 rounded-xl self-start ${isDarkMode ? 'bg-primary-900' : 'bg-primary-100'}`}
              >
                <Text className="text-xs font-semibold text-primary">자녀</Text>
              </View>
            </View>
            <TouchableOpacity
              className={`w-10 h-10 rounded-full justify-center items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              onPress={() => navigation.navigate('ProfileEdit')}
              accessibilityLabel="프로필 수정"
              accessibilityRole="button"
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={isDarkMode ? '#D1D5DB' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 화면 설정 섹션 */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            화면 설정
          </Text>

          <View
            className={`flex-row items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <View className="flex-row items-center flex-1 gap-3">
              <Ionicons name="moon-outline" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                화면 모드
              </Text>
            </View>
          </View>

          {/* Theme mode radio buttons */}
          <View className="py-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                className={`flex-row items-center justify-between py-3 px-2 rounded-lg ${themeMode === mode ? (isDarkMode ? 'bg-primary-900' : 'bg-primary-50') : ''}`}
                onPress={() => handleThemeChange(mode)}
                disabled={isSavingPrefs}
                accessibilityLabel={getThemeModeLabel(mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: themeMode === mode }}
              >
                <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getThemeModeLabel(mode)}
                </Text>
                <View
                  className={`w-5 h-5 rounded-full border-2 justify-center items-center ${themeMode === mode ? 'border-primary bg-primary' : isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}
                >
                  {themeMode === mode && <View className="w-2 h-2 rounded-full bg-white" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 알림 설정 섹션 */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            알림 설정
          </Text>

          <View
            className={`flex-row items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <View className="flex-row items-center flex-1 gap-3">
              <Ionicons
                name="notifications-outline"
                size={24}
                color={isDarkMode ? '#D1D5DB' : '#6B7280'}
              />
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                푸시 알림
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={isSavingPrefs}
              trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: '#93C5FD' }}
              thumbColor={notificationsEnabled ? '#3B82F6' : isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
          </View>

          <View
            className={`flex-row items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <View className="flex-row items-center flex-1 gap-3">
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={isDarkMode ? '#D1D5DB' : '#6B7280'}
              />
              <View>
                <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  미복용 알림
                </Text>
                <Text
                  className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  부모님이 약을 놓치면 알림을 받습니다
                </Text>
              </View>
            </View>
            <Switch
              value={missedAlertEnabled}
              onValueChange={handleMissedAlertToggle}
              disabled={isSavingPrefs || !notificationsEnabled}
              trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: '#93C5FD' }}
              thumbColor={missedAlertEnabled ? '#3B82F6' : isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* 가족 연결 섹션 */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            가족 연결
          </Text>

          {/* Connected parent list */}
          {connectedParent ? (
            <View
              className={`rounded-xl p-4 mb-3 border ${isDarkMode ? 'bg-success-900 border-success-700' : 'bg-success-50 border-success-200'}`}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-full bg-success justify-center items-center">
                  <Text className="text-[22px] font-bold text-white">
                    {connectedParent.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View className="ml-3.5 flex-1">
                  <Text
                    className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {connectedParent.name}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {connectedParent.email}
                  </Text>
                  <View
                    className={`mt-1.5 px-2.5 py-1 rounded-xl self-start ${isDarkMode ? 'bg-success-800' : 'bg-success-100'}`}
                  >
                    <Text className="text-xs font-semibold text-success-600">부모님</Text>
                  </View>
                </View>
              </View>
              {familyConnections.length > 0 && (
                <TouchableOpacity
                  className={`flex-row items-center justify-center mt-3 py-2.5 rounded-lg gap-1.5 ${isDarkMode ? 'bg-error-900' : 'bg-error-50'}`}
                  onPress={() => handleRemoveConnection(familyConnections[0])}
                >
                  <Ionicons name="unlink" size={18} color="#EF4444" />
                  <Text className="text-sm font-semibold text-error">연결 해제</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View
              className={`items-center py-6 rounded-xl mb-3 border border-dashed ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
            >
              <Ionicons
                name="people-outline"
                size={48}
                color={isDarkMode ? '#6B7280' : '#D1D5DB'}
              />
              <Text
                className={`text-base font-semibold mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                연결된 부모님이 없습니다
              </Text>
              <Text
                className={`text-xs mt-1 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                부모님의 초대 코드를 입력하여 연결하세요
              </Text>
            </View>
          )}

          {/* Enter code button */}
          <TouchableOpacity
            className={`flex-row items-center py-3.5 px-4 rounded-xl border gap-2.5 ${isDarkMode ? 'bg-primary-900 border-primary-700' : 'bg-primary-50 border-primary-200'}`}
            onPress={handleEnterCode}
          >
            <Ionicons name="keypad-outline" size={24} color="#3B82F6" />
            <Text className="flex-1 text-base font-semibold text-primary">초대 코드 입력</Text>
            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* 기타 섹션 */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            기타
          </Text>

          <TouchableOpacity
            className={`flex-row items-center justify-between py-3.5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={isDarkMode ? '#D1D5DB' : '#6B7280'}
              />
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                도움말
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center justify-between py-3.5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons
                name="document-text-outline"
                size={24}
                color={isDarkMode ? '#D1D5DB' : '#6B7280'}
              />
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                이용약관
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center justify-between py-3.5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={isDarkMode ? '#D1D5DB' : '#6B7280'}
              />
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                개인정보 처리방침
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          className={`flex-row items-center justify-center gap-2 mt-6 mx-4 py-3.5 rounded-xl border ${isDarkMode ? 'bg-error-900 border-error-700' : 'bg-error-50 border-error-200'}`}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text className="text-base font-semibold text-error">로그아웃</Text>
        </TouchableOpacity>

        {/* 앱 버전 */}
        <Text
          className={`text-center text-xs mt-6 mb-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          PillCare v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChildSettingsScreen;
