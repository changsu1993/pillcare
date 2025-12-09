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
import { getSettings, saveSettings } from '../../services/settings';
import { testVoice, stopSpeaking } from '../../../notifications/services/voice';
import { resetOnboardingStatus } from '../../../onboarding';
import { useTheme, ThemeMode } from '../../../../shared/contexts';
import {
  ProfileCard,
  VoiceSettingsSection,
  ThemeSelector,
  FamilyConnectionsSection,
} from '../../components';
import type { VoiceSpeed } from '../../components';

type Props = ParentScreenProps<'Settings'>;

const ParentSettingsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['settings', 'common']);
  const { isDarkMode, themeMode, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [, setConnectedChildren] = useState<User[]>([]);
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
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Profile card */}
        <ProfileCard user={user} onEditPress={() => navigation.navigate('ProfileEdit')} />

        {/* Settings options */}
        <View className="gap-4">
          {/* Voice settings (toggle, test button, speed selector) */}
          <VoiceSettingsSection
            voiceEnabled={voiceEnabled}
            onVoiceToggle={handleVoiceToggle}
            voiceSpeed={voiceSpeed}
            onVoiceSpeedChange={handleVoiceSpeedChange}
            onTestVoice={handleTestVoice}
            isDisabled={isSettingsSaving}
          />

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
          <ThemeSelector
            themeMode={themeMode}
            onThemeChange={handleThemeChange}
            isDarkMode={isDarkMode}
            isDisabled={isSettingsSaving}
          />

          {/* Family connections section */}
          <FamilyConnectionsSection
            familyConnections={familyConnections}
            onRemoveConnection={handleRemoveConnection}
            onGenerateCode={handleGenerateCode}
          />

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
