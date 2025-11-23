/**
 * ChildSettingsScreen - 자녀 설정 화면
 *
 * 자녀 사용자의 설정 및 프로필 관리 화면
 * - 프로필 정보 표시
 * - 알림 설정
 * - 가족 연결 관리
 * - 로그아웃
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase, signOut, getCurrentUser } from '../../services/supabase';
import {
  getConnectedParent,
  getFamilyConnections,
  removeFamilyConnection,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/api';
import { User, FamilyConnection, NotificationPreferences } from '../../types/database.types';
import { ChildStackParamList } from '../../types/navigation.types';
import { requestNotificationPermissions } from '../../services/notifications';

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* 프로필 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{profile?.name?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || '이름 없음'}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>자녀</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 알림 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
              <Text style={styles.settingLabel}>푸시 알림</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={isSavingPrefs}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="alert-circle-outline" size={24} color="#6B7280" />
              <View>
                <Text style={styles.settingLabel}>미복용 알림</Text>
                <Text style={styles.settingDescription}>부모님이 약을 놓치면 알림을 받습니다</Text>
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

        {/* 가족 연결 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>가족 연결</Text>

          {/* Connected parent list */}
          {connectedParent ? (
            <View style={styles.connectedParentCard}>
              <View style={styles.parentInfo}>
                <View style={styles.parentAvatar}>
                  <Text style={styles.parentAvatarText}>
                    {connectedParent.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.parentDetails}>
                  <Text style={styles.parentName}>{connectedParent.name}</Text>
                  <Text style={styles.parentEmail}>{connectedParent.email}</Text>
                  <View style={styles.parentBadge}>
                    <Text style={styles.parentBadgeText}>부모님</Text>
                  </View>
                </View>
              </View>
              {familyConnections.length > 0 && (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => handleRemoveConnection(familyConnections[0])}
                >
                  <Ionicons name="unlink" size={18} color="#EF4444" />
                  <Text style={styles.disconnectText}>연결 해제</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noConnectionCard}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noConnectionText}>연결된 부모님이 없습니다</Text>
              <Text style={styles.noConnectionSubtext}>
                부모님의 초대 코드를 입력하여 연결하세요
              </Text>
            </View>
          )}

          {/* Enter code button */}
          <TouchableOpacity style={styles.enterCodeButton} onPress={handleEnterCode}>
            <Ionicons name="keypad-outline" size={24} color="#3B82F6" />
            <Text style={styles.enterCodeText}>초대 코드 입력</Text>
            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* 기타 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기타</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
              <Text style={styles.menuLabel}>도움말</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Ionicons name="document-text-outline" size={24} color="#6B7280" />
              <Text style={styles.menuLabel}>이용약관</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#6B7280" />
              <Text style={styles.menuLabel}>개인정보 처리방침</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        {/* 앱 버전 */}
        <Text style={styles.versionText}>PillCare v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 32,
  },
  // Connected parent styles
  connectedParentCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  parentDetails: {
    marginLeft: 14,
    flex: 1,
  },
  parentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  parentEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  parentBadge: {
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  parentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 6,
  },
  disconnectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  noConnectionCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noConnectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noConnectionSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  enterCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  enterCodeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default ChildSettingsScreen;
