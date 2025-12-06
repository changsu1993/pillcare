/**
 * ParentSettingsScreen - Parent app settings
 *
 * Large buttons for settings options.
 * Toggle switches for voice and vibration.
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - 72px button height
 * - Clear labels and icons
 * - Voice guidance test button
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
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import {
  getUserProfile,
  getConnectedChildren,
  removeFamilyConnection,
  getFamilyConnections,
} from '../../../../shared/services/api';
import { supabase } from '../../../../shared/services/supabase';
import { User, FamilyConnection } from '../../../../shared/types/database.types';
import { getSettings, saveSettings, VoiceSpeed } from '../../services/settings';
import { testVoice, stopSpeaking } from '../../../notifications/services/voice';
import { resetOnboardingStatus } from '../../../onboarding';
import { useTheme, ThemeMode } from '../../../../shared/contexts';

type Props = ParentScreenProps<'Settings'>;

const ParentSettingsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['settings', 'common']);
  const { isDarkMode, themeMode, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [connectedChildren, setConnectedChildren] = useState<User[]>([]);
  const [familyConnections, setFamilyConnections] = useState<FamilyConnection[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(0.85);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      // Stop any ongoing speech when entering settings
      return () => {
        stopSpeaking();
      };
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profile, children, connections, appSettings] = await Promise.all([
        getUserProfile(),
        getConnectedChildren(),
        getFamilyConnections(),
        getSettings(),
      ]);
      setUser(profile);
      setConnectedChildren(children);
      setFamilyConnections(connections);
      // Load saved settings
      setVoiceEnabled(appSettings.voiceGuidanceEnabled);
      setVibrationEnabled(appSettings.vibrationEnabled);
      setVoiceSpeed(appSettings.voiceSpeed);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = async (value: boolean) => {
    try {
      setIsSettingsSaving(true);
      setVoiceEnabled(value);
      await saveSettings({ voiceGuidanceEnabled: value });

      // If enabling voice, play test message
      if (value) {
        await testVoice();
      } else {
        // Stop any ongoing speech when disabling
        stopSpeaking();
      }
    } catch (error) {
      console.error('Error saving voice setting:', error);
      // Revert on error
      setVoiceEnabled(!value);
      Alert.alert(t('common:error.generic'), t('settings:error.saveFailed'));
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleVibrationToggle = async (value: boolean) => {
    try {
      setIsSettingsSaving(true);
      setVibrationEnabled(value);
      await saveSettings({ vibrationEnabled: value });
    } catch (error) {
      console.error('Error saving vibration setting:', error);
      // Revert on error
      setVibrationEnabled(!value);
      Alert.alert(t('common:error.generic'), t('settings:error.saveFailed'));
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleTestVoice = async () => {
    try {
      await testVoice();
    } catch (error) {
      console.error('Error testing voice:', error);
      Alert.alert(t('common:error.generic'), t('settings:error.voiceTestFailed'));
    }
  };

  const handleVoiceSpeedChange = async (speed: VoiceSpeed) => {
    try {
      setIsSettingsSaving(true);
      setVoiceSpeed(speed);
      await saveSettings({ voiceSpeed: speed });
      // Auto-play test voice after speed change
      await testVoice();
    } catch (error) {
      console.error('Error saving voice speed:', error);
      // Revert on error
      const settings = await getSettings();
      setVoiceSpeed(settings.voiceSpeed);
      Alert.alert(t('common:error.generic'), t('settings:error.saveFailed'));
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const getSpeedLabel = (speed: VoiceSpeed): string => {
    switch (speed) {
      case 0.7:
        return t('settings:voiceSpeed.slow');
      case 0.85:
        return t('settings:voiceSpeed.normal');
      case 1.0:
        return t('settings:voiceSpeed.fast');
      default:
        return t('settings:voiceSpeed.normal');
    }
  };

  const getSpeedEmoji = (speed: VoiceSpeed): string => {
    switch (speed) {
      case 0.7:
        return '\u{1F422}'; // Turtle
      case 0.85:
        return '\u{1F6B6}'; // Walking person
      case 1.0:
        return '\u{1F407}'; // Rabbit
      default:
        return '\u{1F6B6}';
    }
  };

  const handleGenerateCode = () => {
    navigation.navigate('InvitationCode');
  };

  const handleRemoveConnection = (connection: FamilyConnection) => {
    const childName = connection.child?.name || t('settings:family.child');
    Alert.alert(
      t('settings:family.disconnectTitle'),
      t('settings:family.disconnectMessage', { name: childName }),
      [
        { text: t('common:button.cancel'), style: 'cancel' },
        {
          text: t('settings:family.disconnect'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyConnection(connection.id);
              // Reload data after removal
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
    Alert.alert(
      t('settings:button.signOut'),
      t('settings:message.signOutConfirm'),
      [
        {
          text: t('common:button.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings:button.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              // Navigation will be handled by auth state change
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert(t('common:error.generic'), t('settings:error.signOutFailed'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleViewTutorial = async () => {
    try {
      await resetOnboardingStatus('parent');
      // Force app to re-check onboarding status by signing out and back in
      // For now, just show an alert that the tutorial will show on next login
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
      setIsSettingsSaving(true);
      await setTheme(mode);
    } catch (error) {
      console.error('Error saving theme setting:', error);
      Alert.alert(t('common:error.generic'), t('settings:error.themeSaveFailed'));
    } finally {
      setIsSettingsSaving(false);
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

  const getThemeIcon = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return '\u2600\uFE0F'; // Sun
      case 'dark':
        return '\u{1F319}'; // Crescent Moon
      case 'system':
        return '\u{1F4F1}'; // Mobile Phone
      default:
        return '\u{1F4F1}';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">{t('common:loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Profile card */}
        <View className="bg-white p-8 rounded-2xl items-center mb-6 border-2 border-gray-200 shadow-sm">
          <Text className="text-6xl mb-4">&#128100;</Text>
          <Text
            className="text-3xl font-bold text-gray-900 mb-2"
            accessibilityLabel={`${t('settings:label.name')}: ${user?.name || t('settings:profile.user')}`}
          >
            {user?.name || t('settings:profile.user')}
          </Text>
          <Text
            className="text-xl text-gray-700 mb-4"
            accessibilityLabel={`${t('settings:label.email')}: ${user?.email || ''}`}
          >
            {user?.email || ''}
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-gray-100 px-6 py-3 rounded-xl"
            onPress={() => navigation.navigate('ProfileEdit')}
            activeOpacity={0.7}
            accessibilityLabel={t('settings:button.editProfile')}
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={24} color="#374151" />
            <Text className="text-xl font-semibold text-gray-700">
              {t('settings:button.editProfile')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings options */}
        <View className="gap-4">
          {/* Voice guidance toggle */}
          <View
            className="bg-white h-[72px] flex-row items-center justify-between px-6 rounded-2xl border-2 border-gray-200 shadow-sm"
            accessibilityLabel={t('settings:label.voiceGuidance')}
            accessibilityRole="adjustable"
            accessibilityState={{ checked: voiceEnabled }}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">&#128266;</Text>
              <Text className="text-2xl font-semibold text-gray-900">
                {t('settings:label.voiceGuidance')}
              </Text>
            </View>
            <View className="justify-center items-center w-[60px] h-9">
              <Switch
                value={voiceEnabled}
                onValueChange={handleVoiceToggle}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={voiceEnabled ? '#22C55E' : '#F3F4F6'}
                ios_backgroundColor="#D1D5DB"
                accessibilityLabel={
                  voiceEnabled
                    ? t('settings:accessibility.voiceOn')
                    : t('settings:accessibility.voiceOff')
                }
                disabled={isSettingsSaving}
              />
            </View>
          </View>

          {/* Voice test button - only show when voice is enabled */}
          {voiceEnabled && (
            <TouchableOpacity
              className="bg-primary h-14 flex-row items-center justify-center px-6 rounded-xl border-2 border-primary gap-2"
              onPress={handleTestVoice}
              activeOpacity={0.7}
              accessibilityLabel={t('settings:voice.test')}
              accessibilityHint={t('settings:accessibility.voiceTestHint')}
              accessibilityRole="button"
            >
              <Text className="text-2xl">&#127911;</Text>
              <Text className="text-lg font-semibold text-white">{t('settings:voice.test')}</Text>
            </TouchableOpacity>
          )}

          {/* Voice speed control - only show when voice is enabled */}
          {voiceEnabled && (
            <View className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
              <Text className="text-2xl font-semibold text-gray-900 mb-4">
                {t('settings:label.voiceSpeed')}
              </Text>
              <View className="flex-row gap-3">
                {/* Slow speed button */}
                <TouchableOpacity
                  className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                    voiceSpeed === 0.7 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => handleVoiceSpeedChange(0.7)}
                  activeOpacity={0.7}
                  disabled={isSettingsSaving}
                  accessibilityLabel="느리게"
                  accessibilityHint="음성 속도를 느리게 설정합니다"
                  accessibilityRole="button"
                  accessibilityState={{ selected: voiceSpeed === 0.7 }}
                >
                  <Text className="text-4xl mb-1">{getSpeedEmoji(0.7)}</Text>
                  <Text
                    className={`text-xl font-semibold ${
                      voiceSpeed === 0.7 ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {getSpeedLabel(0.7)}
                  </Text>
                </TouchableOpacity>

                {/* Normal speed button */}
                <TouchableOpacity
                  className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                    voiceSpeed === 0.85 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => handleVoiceSpeedChange(0.85)}
                  activeOpacity={0.7}
                  disabled={isSettingsSaving}
                  accessibilityLabel="보통"
                  accessibilityHint="음성 속도를 보통으로 설정합니다"
                  accessibilityRole="button"
                  accessibilityState={{ selected: voiceSpeed === 0.85 }}
                >
                  <Text className="text-4xl mb-1">{getSpeedEmoji(0.85)}</Text>
                  <Text
                    className={`text-xl font-semibold ${
                      voiceSpeed === 0.85 ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {getSpeedLabel(0.85)}
                  </Text>
                </TouchableOpacity>

                {/* Fast speed button */}
                <TouchableOpacity
                  className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                    voiceSpeed === 1.0 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => handleVoiceSpeedChange(1.0)}
                  activeOpacity={0.7}
                  disabled={isSettingsSaving}
                  accessibilityLabel="빠르게"
                  accessibilityHint="음성 속도를 빠르게 설정합니다"
                  accessibilityRole="button"
                  accessibilityState={{ selected: voiceSpeed === 1.0 }}
                >
                  <Text className="text-4xl mb-1">{getSpeedEmoji(1.0)}</Text>
                  <Text
                    className={`text-xl font-semibold ${
                      voiceSpeed === 1.0 ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {getSpeedLabel(1.0)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Vibration toggle */}
          <View
            className={`h-[72px] flex-row items-center justify-between px-6 rounded-2xl border-2 shadow-sm ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            accessibilityLabel={t('settings:label.vibration')}
            accessibilityRole="adjustable"
            accessibilityState={{ checked: vibrationEnabled }}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">&#128243;</Text>
              <Text
                className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {t('settings:label.vibration')}
              </Text>
            </View>
            <View className="justify-center items-center w-[60px] h-9">
              <Switch
                value={vibrationEnabled}
                onValueChange={handleVibrationToggle}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={vibrationEnabled ? '#22C55E' : '#F3F4F6'}
                ios_backgroundColor="#D1D5DB"
                accessibilityLabel={
                  vibrationEnabled
                    ? t('settings:accessibility.vibrationOn')
                    : t('settings:accessibility.vibrationOff')
                }
                disabled={isSettingsSaving}
              />
            </View>
          </View>

          {/* Theme selection */}
          <View
            className={`p-6 rounded-2xl border-2 shadow-sm ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
            >
              {t('settings:title.theme')}
            </Text>
            <View className="flex-row gap-3">
              {/* Light mode button */}
              <TouchableOpacity
                className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                  themeMode === 'light'
                    ? 'bg-primary border-primary'
                    : isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => handleThemeChange('light')}
                activeOpacity={0.7}
                disabled={isSettingsSaving}
                accessibilityLabel="라이트 모드"
                accessibilityHint="화면을 밝게 설정합니다"
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === 'light' }}
              >
                <Text className="text-4xl mb-1">{getThemeIcon('light')}</Text>
                <Text
                  className={`text-xl font-semibold ${
                    themeMode === 'light'
                      ? 'text-white'
                      : isDarkMode
                        ? 'text-gray-100'
                        : 'text-gray-900'
                  }`}
                >
                  {getThemeLabel('light')}
                </Text>
              </TouchableOpacity>

              {/* Dark mode button */}
              <TouchableOpacity
                className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                  themeMode === 'dark'
                    ? 'bg-primary border-primary'
                    : isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => handleThemeChange('dark')}
                activeOpacity={0.7}
                disabled={isSettingsSaving}
                accessibilityLabel="다크 모드"
                accessibilityHint="화면을 어둡게 설정합니다"
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === 'dark' }}
              >
                <Text className="text-4xl mb-1">{getThemeIcon('dark')}</Text>
                <Text
                  className={`text-xl font-semibold ${
                    themeMode === 'dark'
                      ? 'text-white'
                      : isDarkMode
                        ? 'text-gray-100'
                        : 'text-gray-900'
                  }`}
                >
                  {getThemeLabel('dark')}
                </Text>
              </TouchableOpacity>

              {/* System mode button */}
              <TouchableOpacity
                className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                  themeMode === 'system'
                    ? 'bg-primary border-primary'
                    : isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => handleThemeChange('system')}
                activeOpacity={0.7}
                disabled={isSettingsSaving}
                accessibilityLabel="시스템 설정"
                accessibilityHint="시스템 설정에 따라 화면 테마를 자동으로 변경합니다"
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === 'system' }}
              >
                <Text className="text-4xl mb-1">{getThemeIcon('system')}</Text>
                <Text
                  className={`text-xl font-semibold ${
                    themeMode === 'system'
                      ? 'text-white'
                      : isDarkMode
                        ? 'text-gray-100'
                        : 'text-gray-900'
                  }`}
                >
                  {getThemeLabel('system')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Family connections section */}
          <View className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Text className="text-4xl mr-4">&#128106;</Text>
              <Text className="text-2xl font-semibold text-gray-900">
                {t('settings:section.family')}
              </Text>
            </View>

            {/* Connected children list */}
            {connectedChildren.length > 0 ? (
              <View className="mb-4">
                {familyConnections.map((connection) => {
                  const child = connection.child;
                  if (!child) return null;
                  return (
                    <View
                      key={connection.id}
                      className="flex-row items-center justify-between py-3 border-b border-gray-100"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-11 h-11 rounded-full bg-primary-100 justify-center items-center mr-3">
                          <Text className="text-lg font-bold text-primary">
                            {child.name?.charAt(0) || '?'}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-lg font-semibold text-gray-900">{child.name}</Text>
                          <Text className="text-sm text-gray-700 mt-0.5">
                            {t('settings:family.child')}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveConnection(connection)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel={t('settings:accessibility.disconnectChild', {
                          name: child.name,
                        })}
                      >
                        <Ionicons name="close-circle" size={28} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-lg text-gray-700 text-center py-4">
                {t('settings:family.noChildren')}
              </Text>
            )}

            {/* Generate invitation code button */}
            <TouchableOpacity
              className="flex-row items-center justify-center bg-success-50 py-4 rounded-xl gap-2 border-2 border-success"
              onPress={handleGenerateCode}
              activeOpacity={0.7}
              accessibilityLabel={t('settings:family.generateCode')}
              accessibilityHint={t('settings:accessibility.generateCodeHint')}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={28} color="#22C55E" />
              <Text className="text-xl font-semibold text-success">
                {t('settings:family.generateCode')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Tutorial button */}
          <TouchableOpacity
            className="bg-primary-50 h-[72px] flex-row items-center px-6 rounded-2xl border-2 border-primary-100 shadow-sm"
            onPress={handleViewTutorial}
            activeOpacity={0.7}
            accessibilityLabel={t('settings:tutorial.viewTitle')}
            accessibilityHint={t('settings:accessibility.tutorialHint')}
            accessibilityRole="button"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">&#128214;</Text>
              <Text className="text-2xl font-semibold text-primary">
                {t('settings:tutorial.viewTitle')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#3B82F6" />
          </TouchableOpacity>

          {/* Logout button */}
          <TouchableOpacity
            className="bg-error-50 h-[72px] flex-row items-center px-6 rounded-2xl border-2 border-error-100 shadow-sm mt-4"
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel={t('settings:button.signOut')}
            accessibilityHint={t('settings:accessibility.signOutHint')}
            accessibilityRole="button"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">&#128682;</Text>
              <Text className="text-2xl font-semibold text-error">
                {t('settings:button.signOut')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text className="text-lg text-gray-700 text-center mt-8">{t('common:appName')} v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentSettingsScreen;
