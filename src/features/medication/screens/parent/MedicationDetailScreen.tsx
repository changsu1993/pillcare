/**
 * MedicationDetailScreen - Detailed medication information
 *
 * Shows medication details and 7-day history.
 * Large text, clear visual indicators.
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - Clear status indicators
 * - Large touch targets
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import {
  getMedication,
  getMedicationLogs,
  deleteMedicationWithNotifications,
} from '../../../../shared/services/api';
import { Medication, MedicationLog } from '../../../../shared/types/database.types';

type Props = ParentScreenProps<'MedicationDetail'>;

const MedicationDetailScreen = ({ route, navigation }: Props) => {
  const { medicationId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMedicationDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load medication info
      const medData = await getMedication(medicationId);
      setMedication(medData);

      // Load last 7 days of logs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const logsData = await getMedicationLogs(medicationId, sevenDaysAgo);
      setLogs(logsData);
    } catch (err) {
      console.error('Error loading medication details:', err);
      setError('약 정보를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [medicationId]);

  useEffect(() => {
    loadMedicationDetails();
  }, [loadMedicationDetails]);

  const handleDelete = () => {
    if (!medication) return;

    Alert.alert(
      '약 삭제',
      `"${medication.name}"을(를) 삭제하시겠습니까?\n\n삭제하면 복약 알림도 함께 취소됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicationWithNotifications(medicationId);
              Alert.alert('완료', '약이 삭제되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('Error deleting medication:', err);
              Alert.alert('오류', '약을 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-6">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">불러오는 중...</Text>
      </View>
    );
  }

  if (error || !medication) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-6">
        <Text className="text-2xl text-error text-center mb-6">
          {error || '약을 찾을 수 없습니다'}
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-8 py-4 rounded-xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-xl font-semibold text-white text-center">뒤로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Medication icon */}
        <Text className="text-6xl text-center mb-4">💊</Text>

        {/* Medication name */}
        <Text
          className="text-4xl font-bold text-gray-900 text-center mb-6"
          accessibilityLabel={`약 이름: ${medication.name}`}
          accessibilityRole="header"
        >
          {medication.name}
        </Text>

        {/* Dosage */}
        <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
          <Text className="text-xl font-semibold text-gray-600 mb-2">복용량</Text>
          <Text className="text-2xl font-semibold text-gray-900">{medication.dosage}</Text>
        </View>

        {/* Reminder times */}
        <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
          <Text className="text-xl font-semibold text-gray-600 mb-2">복용 시간</Text>
          <View className="flex-row flex-wrap gap-3">
            {medication.reminder_times.map((time, index) => (
              <View key={index} className="bg-blue-100 px-5 py-3 rounded-xl">
                <Text className="text-2xl font-semibold text-blue-900">{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
          <Text className="text-xl font-semibold text-gray-600 mb-2">복용 기간</Text>
          <Text className="text-2xl font-semibold text-gray-900">
            {new Date(medication.start_date).toLocaleDateString('ko-KR')}
            {medication.end_date && (
              <Text> ~ {new Date(medication.end_date).toLocaleDateString('ko-KR')}</Text>
            )}
          </Text>
        </View>

        {/* Notes */}
        {medication.notes && (
          <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
            <Text className="text-xl font-semibold text-gray-600 mb-2">메모</Text>
            <Text className="text-2xl font-semibold text-gray-900">{medication.notes}</Text>
          </View>
        )}

        {/* 7-day history */}
        <View className="bg-white p-6 rounded-2xl mt-2 border-2 border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-4">최근 7일 복약 이력</Text>
          <View className="flex-row justify-between flex-wrap">
            {Array.from({ length: 7 }).map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - index));
              const dateStr = date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              });

              // Check if there's a log for this date
              const dayLogs = logs.filter((log) => {
                const logDate = new Date(log.scheduled_at);
                return logDate.toDateString() === date.toDateString();
              });

              const allTaken = dayLogs.length > 0 && dayLogs.every((log) => log.taken);
              const someMissed = dayLogs.some((log) => !log.taken);
              const isPending = dayLogs.length === 0 && date <= new Date();

              return (
                <View key={index} className="items-center w-[14%]">
                  <Text className="text-sm text-gray-600 mb-2">{dateStr}</Text>
                  <View className="w-10 h-10 justify-center items-center">
                    {allTaken && <Text className="text-3xl text-success">✓</Text>}
                    {someMissed && <Text className="text-3xl text-error">✗</Text>}
                    {isPending && <Text className="text-3xl text-gray-400">○</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-gray-50 p-6 border-t border-gray-200">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-blue-500 h-[60px] justify-center items-center rounded-2xl shadow-sm"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-white">뒤로</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-success h-[60px] justify-center items-center rounded-2xl shadow-sm"
            onPress={() => navigation.navigate('EditMedication', { medicationId })}
            activeOpacity={0.7}
            accessibilityLabel="약 수정"
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-white">수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-error h-[60px] justify-center items-center rounded-2xl shadow-sm"
            onPress={handleDelete}
            activeOpacity={0.7}
            accessibilityLabel="약 삭제"
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-white">삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MedicationDetailScreen;
