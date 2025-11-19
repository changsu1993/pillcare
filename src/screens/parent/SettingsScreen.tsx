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
 */

import React, { useState, useEffect } from 'react';
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
import { ParentScreenProps } from '../../types/navigation.types';
import { getUserProfile } from '../../services/api';
import { supabase } from '../../services/supabase';
import { User } from '../../types/database.types';

type Props = ParentScreenProps<'Settings'>;

const ParentSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
    // TODO: Load saved preferences from AsyncStorage
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await getUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = (value: boolean) => {
    setVoiceEnabled(value);
    // TODO: Save to AsyncStorage
    // await AsyncStorage.setItem('voiceEnabled', JSON.stringify(value));
  };

  const handleVibrationToggle = (value: boolean) => {
    setVibrationEnabled(value);
    // TODO: Save to AsyncStorage
    // await AsyncStorage.setItem('vibrationEnabled', JSON.stringify(value));
  };

  const handleFamilyConnections = () => {
    Alert.alert('준비 중', '가족 연결 관리 기능은 준비 중입니다.');
    // TODO: Navigate to family connections screen
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text
            style={styles.profileName}
            accessibilityLabel={`이름: ${user?.name || '사용자'}`}
          >
            {user?.name || '사용자'}
          </Text>
          <Text
            style={styles.profileEmail}
            accessibilityLabel={`이메일: ${user?.email || ''}`}
          >
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
            />
          </View>

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
            />
          </View>

          {/* Family connections */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleFamilyConnections}
            activeOpacity={0.7}
            accessibilityLabel="가족 연결 관리"
            accessibilityHint="가족 연결을 관리합니다"
            accessibilityRole="button"
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👨‍👩‍👧</Text>
              <Text style={styles.settingLabel}>가족 연결</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

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
              <Text style={[styles.settingLabel, styles.logoutText]}>
                로그아웃
              </Text>
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
});

export default ParentSettingsScreen;
