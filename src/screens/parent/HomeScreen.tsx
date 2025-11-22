/**
 * ParentHomeScreen - Elderly Parent Home Screen
 *
 * Shows today's medications with large, high-contrast UI.
 * This is the primary screen parents see.
 *
 * Features:
 * - Large medication cards (elderly-friendly)
 * - Visual status indicators (taken/pending)
 * - One-tap action buttons
 * - Voice guidance support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayLogs, scheduleAllMedicationNotifications } from '../../services/api';
import { ParentScreenProps } from '../../types/navigation.types';
import { MedicationLog } from '../../types/database.types';
import {
  requestNotificationPermissions,
  sendTestNotification,
  getAllScheduledNotifications,
} from '../../services/notifications';

type Props = ParentScreenProps<'Home'>;

const ParentHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] =
    useState<boolean>(false);

  useEffect(() => {
    loadTodayMedications();
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async (): Promise<void> => {
    try {
      const hasPermission = await requestNotificationPermissions();
      setHasNotificationPermission(hasPermission);

      if (!hasPermission) {
        // 권한이 없으면 안내 메시지 표시 및 설정으로 이동 옵션 제공
        Alert.alert(
          '알림 권한 필요',
          '약 복용 알림을 받으려면 알림 권한이 필요합니다.',
          [
            { text: '나중에', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } else {
        // 권한이 있으면 모든 약의 알림 예약
        try {
          await scheduleAllMedicationNotifications();
          console.log('모든 약의 알림이 예약되었습니다.');
        } catch (error) {
          console.error('알림 예약 실패:', error);
        }
      }
    } catch (error) {
      console.error('알림 권한 확인 실패:', error);
    }
  };

  const loadTodayMedications = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const logs = await getTodayLogs();
      setMedications(logs);
    } catch (err) {
      console.error('Error loading medications:', err);
      setError('복약 정보를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 테스트 알림 전송 (개발/디버깅용)
   */
  const handleTestNotification = async (): Promise<void> => {
    try {
      await sendTestNotification();
      Alert.alert('테스트 알림', '5초 후에 알림이 표시됩니다.', [
        { text: '확인' },
      ]);
    } catch (error) {
      console.error('테스트 알림 실패:', error);
      Alert.alert('오류', '테스트 알림 전송에 실패했습니다.', [
        { text: '확인' },
      ]);
    }
  };

  /**
   * 예약된 알림 확인 (개발/디버깅용)
   */
  const handleCheckScheduledNotifications = async (): Promise<void> => {
    try {
      const notifications = await getAllScheduledNotifications();
      Alert.alert(
        '예약된 알림',
        `현재 ${notifications.length}개의 알림이 예약되어 있습니다.`,
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('예약된 알림 확인 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadTodayMedications}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (no medications scheduled)
  if (medications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 알림 권한 경고 (권한이 없을 때만 표시) */}
          {!hasNotificationPermission && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionWarningText}>
                ⚠️ 알림 권한이 필요합니다
              </Text>
              <Text style={styles.permissionWarningSubtext}>
                약 복용 알림을 받으려면 설정에서 권한을 허용해주세요.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.permissionButtonText}>설정으로 이동</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 개발/테스트용 버튼 */}
          <View style={styles.devContainer}>
            <Text style={styles.devTitle}>개발자 도구</Text>
            <View style={styles.devButtons}>
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleTestNotification}
              >
                <Text style={styles.devButtonText}>테스트 알림</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleCheckScheduledNotifications}
              >
                <Text style={styles.devButtonText}>예약된 알림 확인</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✓</Text>
            <Text style={styles.emptyText}>
              오늘 드실 약이{'\n'}
              없습니다
            </Text>
          </View>

          {/* 약 추가하기 버튼 */}
          <TouchableOpacity
            style={styles.addMedicationButton}
            onPress={() => navigation.navigate('AddMedication')}
            accessibilityLabel="약 추가하기"
            accessibilityHint="탭하여 새로운 약을 등록합니다"
            accessibilityRole="button"
          >
            <Text style={styles.addMedicationButtonText}>+ 약 추가하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 알림 권한 경고 (권한이 없을 때만 표시) */}
        {!hasNotificationPermission && (
          <View style={styles.permissionWarning}>
            <Text style={styles.permissionWarningText}>
              ⚠️ 알림 권한이 필요합니다
            </Text>
            <Text style={styles.permissionWarningSubtext}>
              약 복용 알림을 받으려면 설정에서 권한을 허용해주세요.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.permissionButtonText}>설정으로 이동</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 개발/테스트용 버튼 */}
        <View style={styles.devContainer}>
          <Text style={styles.devTitle}>개발자 도구</Text>
          <View style={styles.devButtons}>
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.devButtonText}>테스트 알림</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleCheckScheduledNotifications}
            >
              <Text style={styles.devButtonText}>예약된 알림 확인</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medication list */}
        {medications.map((med) => (
          <View
            key={`${med.medication_id}-${med.scheduled_at}`}
            style={[
              styles.medicationCard,
              med.taken && styles.medicationCardTaken,
            ]}
          >
            {/* Medication name */}
            <Text style={styles.medicationName}>
              {med.medications?.name || '약 이름 없음'}
            </Text>

            {/* Dosage */}
            <Text style={styles.medicationDosage}>
              {med.medications?.dosage || '복용량 정보 없음'}
            </Text>

            {/* Status */}
            <View style={styles.statusContainer}>
              {med.taken ? (
                <Text style={styles.statusTaken}>복용 완료 ✓</Text>
              ) : (
                <Text style={styles.statusPending}>복용 대기 중</Text>
              )}
            </View>

            {/* Scheduled time */}
            <Text style={styles.scheduledTime}>
              {new Date(med.scheduled_at).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}

        {/* 약 추가하기 버튼 */}
        <TouchableOpacity
          style={styles.addMedicationButton}
          onPress={() => navigation.navigate('AddMedication')}
          accessibilityLabel="약 추가하기"
          accessibilityHint="탭하여 새로운 약을 등록합니다"
          accessibilityRole="button"
        >
          <Text style={styles.addMedicationButtonText}>+ 약 추가하기</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingText: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  errorText: {
    fontSize: 20,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 28,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 40,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: '#FCD34D', // Yellow for pending
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationCardTaken: {
    borderColor: '#22C55E', // Green for taken
    opacity: 0.6,
  },
  medicationName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  medicationDosage: {
    fontSize: 22,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusTaken: {
    fontSize: 24,
    fontWeight: '600',
    color: '#22C55E',
  },
  statusPending: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F59E0B',
  },
  scheduledTime: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  permissionWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  permissionWarningText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionWarningSubtext: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  devContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  devButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  devButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addMedicationButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    marginTop: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addMedicationButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ParentHomeScreen;
