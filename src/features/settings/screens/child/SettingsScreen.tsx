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
import { useTranslation } from 'react-i18next';
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
import { resetOnboardingStatus } from '../../../onboarding';
import { useTheme, ThemeMode } from '../../../../shared/contexts';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: string;
}

type NavigationProp = NativeStackNavigationProp<ChildStackParamList, 'Settings'>;

const ChildSettingsScreen = () => {
  const { t } = useTranslation(['settings', 'common']);
  const navigation = useNavigation<NavigationProp>();
  const { isDarkMode, themeMode, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectedParent, setConnectedParent] = useState<User | null>(null);
  const [familyConnections, setFamilyConnections] = useState<FamilyConnection[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [missedAlertEnabled, setMissedAlertEnabled] = useState(true);

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
          Alert.alert(
            t('settings:notification.permissionRequired'),
            t('settings:notification.permissionMessage'),
            [{ text: t('common:button.confirm') }]
          );
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
      console.error('Notification settings save failed:', error);
      // Revert on error
      setNotificationsEnabled(!enabled);
      Alert.alert(t('common:error.generic'), t('settings:error.saveFailed'));
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
          Alert.alert(
            t('settings:notification.permissionRequired'),
            t('settings:notification.missedPermissionMessage'),
            [{ text: t('common:button.confirm') }]
          );
          return;
        }
        setNotificationsEnabled(true);
        await updateNotificationPreferences({ push_enabled: true });
      }

      setMissedAlertEnabled(enabled);

      // Save to database
      await updateNotificationPreferences({ missed_medication_alert: enabled });
    } catch (error) {
      console.error('Missed alert settings save failed:', error);
      // Revert on error
      setMissedAlertEnabled(!enabled);
      Alert.alert(t('common:error.generic'), t('settings:error.saveFailed'));
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleEnterCode = () => {
    navigation.navigate('EnterCode');
  };

  const handleRemoveConnection = (connection: FamilyConnection) => {
    const parentName = connection.parent?.name || t('settings:family.parent');
    Alert.alert(
      t('settings:family.disconnectTitle'),
      t('settings:family.disconnectParentMessage', { name: parentName }),
      [
        { text: t('common:button.cancel'), style: 'cancel' },
        {
          text: t('settings:family.disconnect'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyConnection(connection.id);
              await loadData();
              Alert.alert(t('common:button.done'), t('settings:family.disconnected'));
            } catch (error) {
              console.error('Error removing connection:', error);
              Alert.alert(t('common:error.generic'), t('settings:family.disconnectFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t('settings:button.signOut'), t('settings:message.signOutConfirm'), [
      { text: t('common:button.cancel'), style: 'cancel' },
      {
        text: t('settings:button.signOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Sign out failed:', error);
            Alert.alert(t('common:error.generic'), t('settings:error.signOutFailed'));
          }
        },
      },
    ]);
  };

  const handleViewTutorial = async () => {
    try {
      await resetOnboardingStatus('child');
      Alert.alert(t('settings:tutorial.title'), t('settings:tutorial.message'), [
        { text: t('common:button.confirm') },
      ]);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert(t('common:error.generic'), t('settings:error.saveFailed'));
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    try {
      setIsSavingPrefs(true);
      await setTheme(mode);
    } catch (error) {
      console.error('Error saving theme setting:', error);
      Alert.alert(t('common:error.generic'), t('settings:error.themeSaveFailed'));
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return t('settings:theme.light');
      case 'dark':
        return t('settings:theme.dark');
      case 'system':
        return t('settings:theme.system');
      default:
        return t('settings:theme.system');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        {/* Profile section */}
        <View className="bg-white mt-4 px-4 py-3 border-t border-b border-gray-200">
          <Text className="text-xs font-semibold text-gray-500 mb-3 uppercase">
            {t('settings:title.profile')}
          </Text>
          <View className="flex-row items-center py-2">
            <View className="w-[60px] h-[60px] rounded-full bg-primary justify-center items-center">
              <Text className="text-2xl font-bold text-white">
                {profile?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {profile?.name || t('settings:profile.noName')}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">{profile?.email}</Text>
              <View className="mt-1.5 bg-primary-100 px-2.5 py-1 rounded-xl self-start">
                <Text className="text-xs font-semibold text-primary">
                  {t('settings:family.child')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
              onPress={() => navigation.navigate('ProfileEdit')}
              accessibilityLabel={t('settings:button.editProfile')}
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification settings section */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {t('settings:title.notifications')}
          </Text>

          <View
            className={`flex-row items-center justify-between py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <View className="flex-row items-center flex-1 gap-3">
              <Ionicons
                name="notifications-outline"
                size={24}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
              <Text className={`text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {t('settings:notification.pushNotifications')}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={isSavingPrefs}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>

          <View
            className={`flex-row items-center justify-between py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <View className="flex-row items-center flex-1 gap-3">
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
              <View>
                <Text className={`text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {t('settings:notification.missedAlert')}
                </Text>
                <Text
                  className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {t('settings:notification.missedAlertDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={missedAlertEnabled}
              onValueChange={handleMissedAlertToggle}
              disabled={isSavingPrefs || !notificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={missedAlertEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Theme settings section */}
        <View
          className={`mt-4 px-4 py-3 border-t border-b ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <Text
            className={`text-xs font-semibold mb-3 uppercase ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {t('settings:title.theme')}
          </Text>

          {/* Light mode option */}
          <TouchableOpacity
            className={`flex-row items-center justify-between py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
            onPress={() => handleThemeChange('light')}
            disabled={isSavingPrefs}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="sunny-outline" size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {getThemeLabel('light')}
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 justify-center items-center ${
                themeMode === 'light'
                  ? 'border-primary bg-primary'
                  : isDarkMode
                    ? 'border-gray-600'
                    : 'border-gray-300'
              }`}
            >
              {themeMode === 'light' && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>

          {/* Dark mode option */}
          <TouchableOpacity
            className={`flex-row items-center justify-between py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
            onPress={() => handleThemeChange('dark')}
            disabled={isSavingPrefs}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="moon-outline" size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {getThemeLabel('dark')}
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 justify-center items-center ${
                themeMode === 'dark'
                  ? 'border-primary bg-primary'
                  : isDarkMode
                    ? 'border-gray-600'
                    : 'border-gray-300'
              }`}
            >
              {themeMode === 'dark' && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>

          {/* System mode option */}
          <TouchableOpacity
            className={`flex-row items-center justify-between py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
            onPress={() => handleThemeChange('system')}
            disabled={isSavingPrefs}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
              <View>
                <Text className={`text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {getThemeLabel('system')}
                </Text>
                <Text
                  className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {t('settings:theme.systemDescription')}
                </Text>
              </View>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 justify-center items-center ${
                themeMode === 'system'
                  ? 'border-primary bg-primary'
                  : isDarkMode
                    ? 'border-gray-600'
                    : 'border-gray-300'
              }`}
            >
              {themeMode === 'system' && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Family connection section */}
        <View className="bg-white mt-4 px-4 py-3 border-t border-b border-gray-200">
          <Text className="text-xs font-semibold text-gray-500 mb-3 uppercase">
            {t('settings:section.family')}
          </Text>

          {/* Connected parent list */}
          {connectedParent ? (
            <View className="bg-success-50 rounded-xl p-4 mb-3 border border-success-200">
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-full bg-success justify-center items-center">
                  <Text className="text-[22px] font-bold text-white">
                    {connectedParent.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View className="ml-3.5 flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {connectedParent.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{connectedParent.email}</Text>
                  <View className="mt-1.5 bg-success-100 px-2.5 py-1 rounded-xl self-start">
                    <Text className="text-xs font-semibold text-success-600">
                      {t('settings:family.parent')}
                    </Text>
                  </View>
                </View>
              </View>
              {familyConnections.length > 0 && (
                <TouchableOpacity
                  className="flex-row items-center justify-center mt-3 py-2.5 bg-error-50 rounded-lg gap-1.5"
                  onPress={() => handleRemoveConnection(familyConnections[0])}
                >
                  <Ionicons name="unlink" size={18} color="#EF4444" />
                  <Text className="text-sm font-semibold text-error">
                    {t('settings:family.disconnect')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="items-center py-6 bg-gray-50 rounded-xl mb-3 border border-gray-200 border-dashed">
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text className="text-base font-semibold text-gray-500 mt-3">
                {t('settings:family.noParent')}
              </Text>
              <Text className="text-xs text-gray-400 mt-1 text-center">
                {t('settings:family.enterCodeHint')}
              </Text>
            </View>
          )}

          {/* Enter code button */}
          <TouchableOpacity
            className="flex-row items-center py-3.5 px-4 bg-primary-50 rounded-xl border border-primary-200 gap-2.5"
            onPress={handleEnterCode}
          >
            <Ionicons name="keypad-outline" size={24} color="#3B82F6" />
            <Text className="flex-1 text-base font-semibold text-primary">
              {t('settings:family.enterCode')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Other section */}
        <View className="bg-white mt-4 px-4 py-3 border-t border-b border-gray-200">
          <Text className="text-xs font-semibold text-gray-500 mb-3 uppercase">
            {t('settings:section.support')}
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3.5 border-b border-gray-100"
            onPress={handleViewTutorial}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="book-outline" size={24} color="#6B7280" />
              <Text className="text-base text-gray-900">{t('settings:tutorial.viewTitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
              <Text className="text-base text-gray-900">{t('settings:support.help')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Ionicons name="document-text-outline" size={24} color="#6B7280" />
              <Text className="text-base text-gray-900">{t('settings:about.terms')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Ionicons name="shield-checkmark-outline" size={24} color="#6B7280" />
              <Text className="text-base text-gray-900">{t('settings:about.privacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 mt-6 mx-4 py-3.5 bg-error-50 rounded-xl border border-error-200"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text className="text-base font-semibold text-error">{t('settings:button.signOut')}</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text className="text-center text-xs text-gray-400 mt-6 mb-8">
          {t('common:appName')} v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChildSettingsScreen;
