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
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTodayScheduledMedications,
  scheduleAllMedicationNotifications,
} from '../../../../shared/services/api';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { ScheduledMedication } from '../../../../shared/types/database.types';
import {
  requestNotificationPermissions,
  sendTestNotification,
  getAllScheduledNotifications,
} from '../../../notifications/services/notifications';

type Props = ParentScreenProps<'Home'>;

const ParentHomeScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [medications, setMedications] = useState<ScheduledMedication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);

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
        Alert.alert('알림 권한 필요', '약 복용 알림을 받으려면 알림 권한이 필요합니다.', [
          { text: '나중에', style: 'cancel' },
          {
            text: '설정으로 이동',
            onPress: () => Linking.openSettings(),
          },
        ]);
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
      const scheduled = await getTodayScheduledMedications();
      setMedications(scheduled);
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
      Alert.alert('테스트 알림', '5초 후에 알림이 표시됩니다.', [{ text: '확인' }]);
    } catch (error) {
      console.error('테스트 알림 실패:', error);
      Alert.alert('오류', '테스트 알림 전송에 실패했습니다.', [{ text: '확인' }]);
    }
  };

  /**
   * 예약된 알림 확인 (개발/디버깅용)
   */
  const handleCheckScheduledNotifications = async (): Promise<void> => {
    try {
      const notifications = await getAllScheduledNotifications();
      Alert.alert('예약된 알림', `현재 ${notifications.length}개의 알림이 예약되어 있습니다.`, [
        { text: '확인' },
      ]);
    } catch (error) {
      console.error('예약된 알림 확인 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-xl text-error text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-8 py-4 rounded-xl"
          onPress={loadTodayMedications}
        >
          <Text className="text-xl font-semibold text-white">다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (no medications scheduled)
  if (medications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* 알림 권한 경고 (권한이 없을 때만 표시) */}
          {!hasNotificationPermission && (
            <View className="bg-yellow-100 rounded-xl p-5 mb-4 border-2 border-warning">
              <Text className="text-xl font-bold text-yellow-900 mb-2 text-center">
                ⚠️ 알림 권한이 필요합니다
              </Text>
              <Text className="text-base text-yellow-900 mb-4 text-center leading-5">
                약 복용 알림을 받으려면 설정에서 권한을 허용해주세요.
              </Text>
              <TouchableOpacity
                className="bg-warning px-6 py-3 rounded-lg self-center"
                onPress={() => Linking.openSettings()}
              >
                <Text className="text-base font-semibold text-white">설정으로 이동</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 개발/테스트용 버튼 */}
          <View className="bg-gray-100 rounded-xl p-4 mb-4 border border-gray-300">
            <Text className="text-sm font-semibold text-gray-600 mb-3">개발자 도구</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
                onPress={handleTestNotification}
              >
                <Text className="text-xs font-semibold text-white">테스트 알림</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
                onPress={handleCheckScheduledNotifications}
              >
                <Text className="text-xs font-semibold text-white">예약된 알림 확인</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="justify-center items-center py-16">
            <Text className="text-8xl mb-6">✓</Text>
            <Text className="text-3xl text-gray-600 text-center leading-10">
              오늘 드실 약이{'\n'}
              없습니다
            </Text>
          </View>

          {/* 약 추가하기 버튼 */}
          <TouchableOpacity
            className="bg-success rounded-2xl py-6 px-8 items-center justify-center min-h-[72px] mt-4 shadow-lg"
            onPress={() => navigation.navigate('AddMedication')}
            accessibilityLabel="약 추가하기"
            accessibilityHint="탭하여 새로운 약을 등록합니다"
            accessibilityRole="button"
          >
            <Text className="text-3xl font-bold text-white">+ 약 추가하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* 알림 권한 경고 (권한이 없을 때만 표시) */}
        {!hasNotificationPermission && (
          <View className="bg-yellow-100 rounded-xl p-5 mb-4 border-2 border-warning">
            <Text className="text-xl font-bold text-yellow-900 mb-2 text-center">
              ⚠️ 알림 권한이 필요합니다
            </Text>
            <Text className="text-base text-yellow-900 mb-4 text-center leading-5">
              약 복용 알림을 받으려면 설정에서 권한을 허용해주세요.
            </Text>
            <TouchableOpacity
              className="bg-warning px-6 py-3 rounded-lg self-center"
              onPress={() => Linking.openSettings()}
            >
              <Text className="text-base font-semibold text-white">설정으로 이동</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 개발/테스트용 버튼 */}
        <View className="bg-gray-100 rounded-xl p-4 mb-4 border border-gray-300">
          <Text className="text-sm font-semibold text-gray-600 mb-3">개발자 도구</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
              onPress={handleTestNotification}
            >
              <Text className="text-xs font-semibold text-white">테스트 알림</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
              onPress={handleCheckScheduledNotifications}
            >
              <Text className="text-xs font-semibold text-white">예약된 알림 확인</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medication list */}
        {medications.map((med) => (
          <TouchableOpacity
            key={med.id}
            className={`bg-white rounded-2xl p-6 border-[3px] shadow-sm ${
              med.taken ? 'border-success opacity-60' : 'border-yellow-400'
            }`}
            onPress={() =>
              navigation.navigate('MedicationDetail', { medicationId: med.medication_id })
            }
            activeOpacity={0.7}
            accessibilityLabel={`${med.medication_name} 상세 보기`}
            accessibilityHint="탭하여 약 상세 정보를 확인합니다"
            accessibilityRole="button"
          >
            {/* Medication name */}
            <Text className="text-3xl font-bold text-gray-900 mb-2">{med.medication_name}</Text>

            {/* Dosage */}
            <Text className="text-2xl text-gray-600 mb-4">{med.dosage}</Text>

            {/* Status */}
            <View className="mb-3">
              {med.taken ? (
                <Text className="text-2xl font-semibold text-success">복용 완료 ✓</Text>
              ) : (
                <Text className="text-2xl font-semibold text-warning">복용 대기 중</Text>
              )}
            </View>

            {/* Scheduled time */}
            <Text className="text-xl text-gray-400">{med.scheduled_time}</Text>
          </TouchableOpacity>
        ))}

        {/* 약 추가하기 버튼 */}
        <TouchableOpacity
          className="bg-success rounded-2xl py-6 px-8 items-center justify-center min-h-[72px] mt-4 shadow-lg"
          onPress={() => navigation.navigate('AddMedication')}
          accessibilityLabel="약 추가하기"
          accessibilityHint="탭하여 새로운 약을 등록합니다"
          accessibilityRole="button"
        >
          <Text className="text-3xl font-bold text-white">+ 약 추가하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentHomeScreen;
