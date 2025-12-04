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
import { useTheme, ThemeMode, getThemeModeLabel } from '../../../../shared/contexts/ThemeContext';

type Props = ParentScreenProps<'Settings'>;

const ParentSettingsScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [connectedChildren, setConnectedChildren] = useState<User[]>([]);
  const [familyConnections, setFamilyConnections] = useState<FamilyConnection[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(0.85);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  // Theme context
  const { themeMode, isDarkMode, setTheme } = useTheme();

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
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
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
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleTestVoice = async () => {
    try {
      await testVoice();
    } catch (error) {
      console.error('Error testing voice:', error);
      Alert.alert('오류', '음성 테스트에 실패했습니다.');
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
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const getSpeedLabel = (speed: VoiceSpeed): string => {
    switch (speed) {
      case 0.7:
        return '느리게';
      case 0.85:
        return '보통';
      case 1.0:
        return '빠르게';
      default:
        return '보통';
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

  /**
   * Handle theme mode change
   */
  const handleThemeChange = async (mode: ThemeMode) => {
    try {
      setIsSettingsSaving(true);
      await setTheme(mode);
    } catch (error) {
      console.error('Error saving theme setting:', error);
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  /**
   * Get theme mode emoji
   */
  const getThemeModeEmoji = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return '\u{2600}\u{FE0F}'; // Sun
      case 'dark':
        return '\u{1F319}'; // Crescent moon
      case 'system':
        return '\u{1F4F1}'; // Mobile phone
      default:
        return '\u{1F4F1}';
    }
  };

  const handleGenerateCode = () => {
    navigation.navigate('InvitationCode');
  };

  const handleRemoveConnection = (connection: FamilyConnection) => {
    const childName = connection.child?.name || '자녀';
    Alert.alert('연결 해제', `${childName}님과의 연결을 해제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFamilyConnection(connection.id);
            // Reload data after removal
            await loadData();
            Alert.alert('완료', '연결이 해제되었습니다.');
          } catch (error) {
            console.error('Error removing connection:', error);
            Alert.alert('오류', '연결 해제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              // Navigation will be handled by auth state change
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('오류', '로그아웃할 수 없습니다');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className={`text-xl mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Profile card */}
        <View
          className={`p-8 rounded-2xl items-center mb-6 border-2 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Text className="text-6xl mb-4">👤</Text>
          <Text
            className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            accessibilityLabel={`이름: ${user?.name || '사용자'}`}
          >
            {user?.name || '사용자'}
          </Text>
          <Text
            className={`text-xl mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            accessibilityLabel={`이메일: ${user?.email || ''}`}
          >
            {user?.email || ''}
          </Text>
          <TouchableOpacity
            className={`flex-row items-center gap-2 px-6 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            onPress={() => navigation.navigate('ProfileEdit')}
            activeOpacity={0.7}
            accessibilityLabel="프로필 수정"
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
            <Text
              className={`text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              프로필 수정
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings options */}
        <View className="gap-4">
          {/* Theme mode selection */}
          <View
            className={`p-6 rounded-2xl border-2 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <Text
              className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              화면 모드
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
                accessibilityHint="화면을 밝은 모드로 설정합니다"
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === 'light' }}
              >
                <Text className="text-4xl mb-1">{getThemeModeEmoji('light')}</Text>
                <Text
                  className={`text-xl font-semibold ${
                    themeMode === 'light'
                      ? 'text-white'
                      : isDarkMode
                        ? 'text-white'
                        : 'text-gray-900'
                  }`}
                >
                  {getThemeModeLabel('light')}
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
                accessibilityHint="화면을 어두운 모드로 설정합니다"
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === 'dark' }}
              >
                <Text className="text-4xl mb-1">{getThemeModeEmoji('dark')}</Text>
                <Text
                  className={`text-xl font-semibold ${
                    themeMode === 'dark'
                      ? 'text-white'
                      : isDarkMode
                        ? 'text-white'
                        : 'text-gray-900'
                  }`}
                >
                  {getThemeModeLabel('dark')}
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
                accessibilityHint="시스템 설정에 따라 화면 모드를 설정합니다"
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === 'system' }}
              >
                <Text className="text-4xl mb-1">{getThemeModeEmoji('system')}</Text>
                <Text
                  className={`text-xl font-semibold ${
                    themeMode === 'system'
                      ? 'text-white'
                      : isDarkMode
                        ? 'text-white'
                        : 'text-gray-900'
                  }`}
                >
                  {getThemeModeLabel('system')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Voice guidance toggle */}
          <View
            className={`h-[72px] flex-row items-center justify-between px-6 rounded-2xl border-2 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            accessibilityLabel="음성 안내 설정"
            accessibilityRole="adjustable"
            accessibilityState={{ checked: voiceEnabled }}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">🔊</Text>
              <Text
                className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                음성 안내
              </Text>
            </View>
            <View className="justify-center items-center w-[60px] h-9">
              <Switch
                value={voiceEnabled}
                onValueChange={handleVoiceToggle}
                trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: '#86EFAC' }}
                thumbColor={voiceEnabled ? '#22C55E' : isDarkMode ? '#9CA3AF' : '#F3F4F6'}
                ios_backgroundColor={isDarkMode ? '#4B5563' : '#D1D5DB'}
                accessibilityLabel={voiceEnabled ? '음성 안내 켜짐' : '음성 안내 꺼짐'}
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
              accessibilityLabel="음성 테스트"
              accessibilityHint="음성 안내 테스트 메시지를 재생합니다"
              accessibilityRole="button"
            >
              <Text className="text-2xl">🎧</Text>
              <Text className="text-lg font-semibold text-white">음성 테스트</Text>
            </TouchableOpacity>
          )}

          {/* Voice speed control - only show when voice is enabled */}
          {voiceEnabled && (
            <View
              className={`p-6 rounded-2xl border-2 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <Text
                className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                음성 속도
              </Text>
              <View className="flex-row gap-3">
                {/* Slow speed button */}
                <TouchableOpacity
                  className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                    voiceSpeed === 0.7
                      ? 'bg-primary border-primary'
                      : isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
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
                      voiceSpeed === 0.7
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}
                  >
                    {getSpeedLabel(0.7)}
                  </Text>
                </TouchableOpacity>

                {/* Normal speed button */}
                <TouchableOpacity
                  className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                    voiceSpeed === 0.85
                      ? 'bg-primary border-primary'
                      : isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
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
                      voiceSpeed === 0.85
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}
                  >
                    {getSpeedLabel(0.85)}
                  </Text>
                </TouchableOpacity>

                {/* Fast speed button */}
                <TouchableOpacity
                  className={`flex-1 h-[72px] items-center justify-center rounded-xl border-2 ${
                    voiceSpeed === 1.0
                      ? 'bg-primary border-primary'
                      : isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
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
                      voiceSpeed === 1.0
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
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
            className={`h-[72px] flex-row items-center justify-between px-6 rounded-2xl border-2 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            accessibilityLabel="진동 설정"
            accessibilityRole="adjustable"
            accessibilityState={{ checked: vibrationEnabled }}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">📳</Text>
              <Text
                className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                진동
              </Text>
            </View>
            <View className="justify-center items-center w-[60px] h-9">
              <Switch
                value={vibrationEnabled}
                onValueChange={handleVibrationToggle}
                trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: '#86EFAC' }}
                thumbColor={vibrationEnabled ? '#22C55E' : isDarkMode ? '#9CA3AF' : '#F3F4F6'}
                ios_backgroundColor={isDarkMode ? '#4B5563' : '#D1D5DB'}
                accessibilityLabel={vibrationEnabled ? '진동 켜짐' : '진동 꺼짐'}
                disabled={isSettingsSaving}
              />
            </View>
          </View>

          {/* Family connections section */}
          <View
            className={`p-5 rounded-2xl border-2 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <View className="flex-row items-center mb-4">
              <Text className="text-4xl mr-4">👨‍👩‍👧</Text>
              <Text
                className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                가족 연결
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
                      className={`flex-row items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                    >
                      <View className="flex-row items-center flex-1">
                        <View
                          className={`w-11 h-11 rounded-full justify-center items-center mr-3 ${isDarkMode ? 'bg-primary-900' : 'bg-primary-100'}`}
                        >
                          <Text className="text-lg font-bold text-primary">
                            {child.name?.charAt(0) || '?'}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {child.name}
                          </Text>
                          <Text
                            className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                          >
                            자녀
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveConnection(connection)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel={`${child.name} 연결 해제`}
                      >
                        <Ionicons name="close-circle" size={28} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text
                className={`text-lg text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
              >
                연결된 자녀가 없습니다
              </Text>
            )}

            {/* Generate invitation code button */}
            <TouchableOpacity
              className={`flex-row items-center justify-center py-4 rounded-xl gap-2 border-2 border-success ${isDarkMode ? 'bg-success-900' : 'bg-success-50'}`}
              onPress={handleGenerateCode}
              activeOpacity={0.7}
              accessibilityLabel="초대 코드 생성"
              accessibilityHint="자녀와 연결할 초대 코드를 생성합니다"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={28} color="#22C55E" />
              <Text className="text-xl font-semibold text-success">초대 코드 생성</Text>
            </TouchableOpacity>
          </View>

          {/* Logout button */}
          <TouchableOpacity
            className={`h-[72px] flex-row items-center px-6 rounded-2xl border-2 shadow-sm mt-4 ${isDarkMode ? 'bg-error-900 border-error-800' : 'bg-error-50 border-error-100'}`}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="로그아웃"
            accessibilityHint="앱에서 로그아웃합니다"
            accessibilityRole="button"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-4xl mr-4">🚪</Text>
              <Text className="text-2xl font-semibold text-error">로그아웃</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text
          className={`text-lg text-center mt-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
        >
          PillCare v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentSettingsScreen;
