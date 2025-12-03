/**
 * MedicationManageScreen - Child's Medication Management
 *
 * Allows child users to manage parent's medications.
 *
 * Features:
 * - List all parent's medications
 * - Add new medication
 * - Edit existing medication
 * - Delete medication (with confirmation)
 * - Toggle medication active/inactive
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getConnectedParent,
  getParentMedications,
  deleteMedication,
  toggleMedicationActive,
} from '../../../../shared/services/api';
import { User, Medication } from '../../../../shared/types/database.types';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;

const MedicationManageScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (parent) {
        const meds = await getParentMedications(parent.id);
        setMedications(meds);
      } else {
        setMedications([]);
      }
    } catch (err) {
      console.error('Error loading medications:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on initial mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus (e.g., returning from add/edit screen)
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        loadData();
      }
    }, [isLoading, loadData])
  );

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  /**
   * Handle add medication - memoized callback
   */
  const handleAddMedication = useCallback((): void => {
    if (!parentInfo) {
      Alert.alert('오류', '부모님 연결이 필요합니다.');
      return;
    }
    navigation.navigate('AddMedication', { parentId: parentInfo.id });
  }, [parentInfo, navigation]);

  /**
   * Handle edit medication - memoized callback
   */
  const handleEditMedication = useCallback(
    (medicationId: string): void => {
      navigation.navigate('EditMedication', { medicationId });
    },
    [navigation]
  );

  /**
   * Handle delete medication
   */
  const handleDeleteMedication = (medication: Medication): void => {
    Alert.alert(
      '약 삭제',
      `'${medication.name}'을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medication.id);
              setMedications((prev) => prev.filter((m) => m.id !== medication.id));
              Alert.alert('완료', '약이 삭제되었습니다.');
            } catch (err) {
              console.error('Error deleting medication:', err);
              Alert.alert('오류', '약 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle toggle active status
   */
  const handleToggleActive = async (medication: Medication, active: boolean): Promise<void> => {
    try {
      await toggleMedicationActive(medication.id, active);
      setMedications((prev) => prev.map((m) => (m.id === medication.id ? { ...m, active } : m)));
    } catch (err) {
      console.error('Error toggling medication active:', err);
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  };

  /**
   * Memoized frequency map for formatting
   */
  const frequencyMap = useMemo<Record<string, string>>(
    () => ({
      once_daily: '하루 1회',
      twice_daily: '하루 2회',
      three_times_daily: '하루 3회',
      as_needed: '필요시',
      weekly: '주 1회',
    }),
    []
  );

  /**
   * Format frequency text - memoized callback
   */
  const formatFrequency = useCallback(
    (frequency: string): string => {
      return frequencyMap[frequency] || frequency;
    },
    [frequencyMap]
  );

  /**
   * Format reminder times - stable reference
   */
  const formatReminderTimes = useCallback((times: string[]): string => {
    return times.join(', ');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-base text-gray-500 mt-3">불러오는 중...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-base text-error text-center mt-3 mb-4">{error}</Text>
        <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg" onPress={loadData}>
          <Text className="text-base font-semibold text-white">다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No parent connected
  if (!parentInfo) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">부모님을 연결해주세요</Text>
          <Text className="text-sm text-gray-500 text-center leading-5">
            부모님의 약을 관리하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-20"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Header Info */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-1">{parentInfo.name}님의 약</Text>
          <Text className="text-sm text-gray-500">
            총 {medications.length}개의 약이 등록되어 있습니다
          </Text>
        </View>

        {/* Medication List */}
        {medications.length === 0 ? (
          <View className="bg-white rounded-xl p-10 items-center">
            <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-semibold text-gray-900 mt-4 mb-2">
              등록된 약이 없습니다
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              부모님이 드시는 약을 등록해주세요
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {medications.map((medication) => (
              <View key={medication.id} className="bg-white rounded-xl p-4 shadow-sm">
                {/* Header with name and toggle */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{medication.name}</Text>
                    <Text className="text-sm text-gray-500">{medication.dosage}</Text>
                  </View>
                  <Switch
                    value={medication.active}
                    onValueChange={(value) => handleToggleActive(medication, value)}
                    trackColor={{ false: '#D1D5DB', true: '#22C55E99' }}
                    thumbColor={medication.active ? '#22C55E' : '#9CA3AF'}
                  />
                </View>

                {/* Details */}
                <View className="bg-gray-100 rounded-lg p-3 gap-2 mb-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="repeat-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-700 flex-1">
                      {formatFrequency(medication.frequency)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-700 flex-1">
                      {formatReminderTimes(medication.reminder_times)}
                    </Text>
                  </View>
                  {medication.notes && (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                        {medication.notes}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Status badge */}
                <View className="mb-3">
                  <View
                    className={`self-start px-2.5 py-1 rounded ${
                      medication.active ? 'bg-success/20' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        medication.active ? 'text-success' : 'text-gray-500'
                      }`}
                    >
                      {medication.active ? '알림 활성화' : '알림 비활성화'}
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View className="flex-row gap-3 border-t border-gray-200 pt-3">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary/10"
                    onPress={() => handleEditMedication(medication.id)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                    <Text className="text-sm font-semibold text-primary">수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg bg-error/10"
                    onPress={() => handleDeleteMedication(medication)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text className="text-sm font-semibold text-error">삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Medication FAB */}
      <TouchableOpacity
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-lg"
        onPress={handleAddMedication}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default MedicationManageScreen;
