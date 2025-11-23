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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ParentScreenProps } from '../../types/navigation.types';
import {
  getUserProfile,
  getConnectedChildren,
  removeFamilyConnection,
  getFamilyConnections,
} from '../../services/api';
import { supabase } from '../../services/supabase';
import { User, FamilyConnection } from '../../types/database.types';
import { getSettings, saveSettings, AppSettings } from '../../services/settings';
import { testVoice, stopSpeaking } from '../../services/voice';

type Props = ParentScreenProps<'Settings'>;

const ParentSettingsScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [connectedChildren, setConnectedChildren] = useState<User[]>([]);
  const [familyConnections, setFamilyConnections] = useState<FamilyConnection[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text style={styles.profileName} accessibilityLabel={`이름: ${user?.name || '사용자'}`}>
            {user?.name || '사용자'}
          </Text>
          <Text style={styles.profileEmail} accessibilityLabel={`이메일: ${user?.email || ''}`}>
            {user?.email || ''}
          </Text>
        </View>

        {/* Settings options */}
        <View style={styles.settingsContainer}>
          {/* Voice guidance toggle */}
          <View
            style={styles.settingItem}
            accessibilityLabel="음성 안내 설정"
            accessibilityRole="adjustable"
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔊</Text>
              <Text style={styles.settingLabel}>음성 안내</Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={handleVoiceToggle}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={voiceEnabled ? '#22C55E' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
              style={styles.switch}
              accessibilityLabel={voiceEnabled ? '음성 안내 켜짐' : '음성 안내 꺼짐'}
              disabled={isSettingsSaving}
            />
          </View>

          {/* Voice test button - only show when voice is enabled */}
          {voiceEnabled && (
            <TouchableOpacity
              style={styles.testVoiceButton}
              onPress={handleTestVoice}
              activeOpacity={0.7}
              accessibilityLabel="음성 테스트"
              accessibilityHint="음성 안내 테스트 메시지를 재생합니다"
              accessibilityRole="button"
            >
              <Text style={styles.testVoiceIcon}>🎧</Text>
              <Text style={styles.testVoiceText}>음성 테스트</Text>
            </TouchableOpacity>
          )}

          {/* Vibration toggle */}
          <View
            style={styles.settingItem}
            accessibilityLabel="진동 설정"
            accessibilityRole="adjustable"
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📳</Text>
              <Text style={styles.settingLabel}>진동</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={vibrationEnabled ? '#22C55E' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
              style={styles.switch}
              accessibilityLabel={vibrationEnabled ? '진동 켜짐' : '진동 꺼짐'}
              disabled={isSettingsSaving}
            />
          </View>

          {/* Family connections section */}
          <View style={styles.familySection}>
            <View style={styles.familySectionHeader}>
              <Text style={styles.settingIcon}>👨‍👩‍👧</Text>
              <Text style={styles.settingLabel}>가족 연결</Text>
            </View>

            {/* Connected children list */}
            {connectedChildren.length > 0 ? (
              <View style={styles.connectedList}>
                {familyConnections.map((connection) => {
                  const child = connection.child;
                  if (!child) return null;
                  return (
                    <View key={connection.id} style={styles.connectedItem}>
                      <View style={styles.connectedInfo}>
                        <View style={styles.childAvatar}>
                          <Text style={styles.childAvatarText}>{child.name?.charAt(0) || '?'}</Text>
                        </View>
                        <View>
                          <Text style={styles.childName}>{child.name}</Text>
                          <Text style={styles.childRole}>자녀</Text>
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
              <Text style={styles.noConnectionText}>연결된 자녀가 없습니다</Text>
            )}

            {/* Generate invitation code button */}
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={handleGenerateCode}
              activeOpacity={0.7}
              accessibilityLabel="초대 코드 생성"
              accessibilityHint="자녀와 연결할 초대 코드를 생성합니다"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={28} color="#22C55E" />
              <Text style={styles.inviteButtonText}>초대 코드 생성</Text>
            </TouchableOpacity>
          </View>

          {/* Logout button */}
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="로그아웃"
            accessibilityHint="앱에서 로그아웃합니다"
            accessibilityRole="button"
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🚪</Text>
              <Text style={[styles.settingLabel, styles.logoutText]}>로그아웃</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text style={styles.version}>PillCare v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  loadingText: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 20,
    color: '#6B7280',
  },
  settingsContainer: {
    gap: 16,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  testVoiceButton: {
    backgroundColor: '#EFF6FF',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    gap: 8,
  },
  testVoiceIcon: {
    fontSize: 24,
  },
  testVoiceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  arrow: {
    fontSize: 32,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  logoutItem: {
    marginTop: 16,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
  version: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
  },
  // Family section styles
  familySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  familySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedList: {
    marginBottom: 16,
  },
  connectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  childRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  noConnectionText: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  inviteButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22C55E',
  },
});

export default ParentSettingsScreen;
