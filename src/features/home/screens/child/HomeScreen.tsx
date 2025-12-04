/**
 * ChildHomeScreen - Child Home Screen
 *
 * Main dashboard for child users to monitor parent's medication status.
 *
 * Features:
 * - Parent's today medication timeline
 * - Visual status indicators (taken/pending/missed)
 * - Quick call parent button
 * - Pull-to-refresh functionality
 * - Real-time adherence rate display
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getConnectedParent,
  getParentTodayLogs,
  getParentMedications,
} from '../../../../shared/services/api';
import { User, MedicationLog, Medication } from '../../../../shared/types/database.types';
import { useTheme } from '../../../../shared/contexts/ThemeContext';

interface TodayMedicationItem {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: 'taken' | 'pending' | 'missed';
  log?: MedicationLog;
}

/**
 * Get status icon and color - moved outside component for better performance
 */
const getStatusDisplayConfig = (
  status: 'taken' | 'pending' | 'missed'
): { icon: string; colorClass: string; bgColorClass: string; text: string } => {
  switch (status) {
    case 'taken':
      return {
        icon: 'checkmark-circle',
        colorClass: 'text-success',
        bgColorClass: 'bg-success',
        text: '복용 완료',
      };
    case 'pending':
      return {
        icon: 'time',
        colorClass: 'text-warning',
        bgColorClass: 'bg-warning',
        text: '대기 중',
      };
    case 'missed':
      return {
        icon: 'close-circle',
        colorClass: 'text-error',
        bgColorClass: 'bg-error',
        text: '미복용',
      };
  }
};

/**
 * Memoized medication timeline item component
 */
interface TimelineItemProps {
  item: TodayMedicationItem;
  isLast: boolean;
  isDarkMode: boolean;
}

const TimelineItem = memo(({ item, isLast, isDarkMode }: TimelineItemProps) => {
  const statusDisplay = useMemo(() => getStatusDisplayConfig(item.status), [item.status]);

  return (
    <View className="flex-row mb-4">
      {/* Timeline line */}
      <View className="w-7 items-center mr-3">
        <View
          className={`w-6 h-6 rounded-full justify-center items-center ${statusDisplay.bgColorClass}`}
        >
          <Ionicons name={statusDisplay.icon as any} size={12} color="#FFFFFF" />
        </View>
        {!isLast && (
          <View
            className={`flex-1 w-0.5 mt-1 -mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className={`text-xs mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.scheduledTime}
        </Text>
        <View
          className={`rounded-xl p-4 border-l-4 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ${statusDisplay.bgColorClass.replace('bg-', 'border-l-')}`}
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`text-base font-semibold flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {item.medicationName}
            </Text>
            <View className={`px-2 py-1 rounded ${statusDisplay.bgColorClass}/20`}>
              <Text className={`text-xs font-semibold ${statusDisplay.colorClass}`}>
                {statusDisplay.text}
              </Text>
            </View>
          </View>
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.dosage}
          </Text>
        </View>
      </View>
    </View>
  );
});

TimelineItem.displayName = 'TimelineItem';

const ChildHomeScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [todayItems, setTodayItems] = useState<TodayMedicationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Theme context
  const { isDarkMode } = useTheme();

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // Get connected parent
      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (!parent) {
        setTodayItems([]);
        return;
      }

      // Get today's logs and medications
      const [logs, medications] = await Promise.all([
        getParentTodayLogs(parent.id),
        getParentMedications(parent.id),
      ]);

      // Build today's medication items from medications and logs
      const items = buildTodayItems(medications, logs);
      setTodayItems(items);
    } catch (err) {
      console.error('Error loading child home data:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Build today's medication items from medications and logs
   */
  const buildTodayItems = (
    medications: Medication[],
    logs: MedicationLog[]
  ): TodayMedicationItem[] => {
    const items: TodayMedicationItem[] = [];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    medications.forEach((med) => {
      med.reminder_times.forEach((time) => {
        // Find matching log
        const matchingLog = logs.find((log) => {
          const logTime = new Date(log.scheduled_at);
          const logTimeStr = `${logTime.getHours().toString().padStart(2, '0')}:${logTime.getMinutes().toString().padStart(2, '0')}`;
          return log.medication_id === med.id && logTimeStr === time;
        });

        // Determine status
        let status: 'taken' | 'pending' | 'missed' = 'pending';
        if (matchingLog) {
          status = matchingLog.taken ? 'taken' : 'missed';
        } else if (time < currentTime) {
          // Past time without log - could be missed
          status = 'pending'; // Keep as pending until explicitly marked
        }

        items.push({
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: time,
          status,
          log: matchingLog,
        });
      });
    });

    // Sort by time
    items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    return items;
  };

  // Load data on initial mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus
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

  // Memoized adherence calculations
  const { adherenceRate, takenCount, pendingCount, missedCount } = useMemo(() => {
    if (todayItems.length === 0) {
      return { adherenceRate: 0, takenCount: 0, pendingCount: 0, missedCount: 0 };
    }
    const taken = todayItems.filter((item) => item.status === 'taken').length;
    const pending = todayItems.filter((item) => item.status === 'pending').length;
    const missed = todayItems.filter((item) => item.status === 'missed').length;
    const rate = Math.round((taken / todayItems.length) * 100);
    return { adherenceRate: rate, takenCount: taken, pendingCount: pending, missedCount: missed };
  }, [todayItems]);

  // Memoized adherence rate color class
  const adherenceRateColorClass = useMemo(() => {
    if (adherenceRate >= 80) return 'text-success';
    if (adherenceRate >= 50) return 'text-warning';
    return 'text-error';
  }, [adherenceRate]);

  // Memoized formatted date
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }, []);

  /**
   * Handle call parent - memoized callback
   */
  const handleCallParent = useCallback((): void => {
    if (!parentInfo?.phone_number) {
      Alert.alert('전화번호 없음', '부모님의 전화번호가 등록되어 있지 않습니다.');
      return;
    }

    const phoneUrl = `tel:${parentInfo.phone_number}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('오류', '전화를 걸 수 없습니다.');
        }
      })
      .catch((err) => {
        console.error('Error opening phone:', err);
        Alert.alert('오류', '전화를 걸 수 없습니다.');
      });
  }, [parentInfo?.phone_number]);

  // Loading state
  if (isLoading) {
    return (
      <View
        className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`text-base mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          불러오는 중...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
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
      <SafeAreaView
        className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
        edges={['bottom']}
      >
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="people-outline" size={64} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
          <Text
            className={`text-xl font-bold mt-4 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            부모님을 연결해주세요
          </Text>
          <Text
            className={`text-sm text-center leading-5 mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            부모님의 복약 현황을 확인하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
          <TouchableOpacity className="flex-row items-center bg-primary px-5 py-3 rounded-lg gap-2">
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white">가족 연결하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['bottom']}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-20"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Parent Info Card */}
        <View
          className={`rounded-2xl p-5 mb-5 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <View className="flex-row items-center mb-5">
            <View
              className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${isDarkMode ? 'bg-primary/30' : 'bg-primary/20'}`}
            >
              <Ionicons name="person" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {parentInfo.name}님
              </Text>
              <Text className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                부모님 복약 현황
              </Text>
            </View>
          </View>

          <View
            className={`flex-row justify-between items-center rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              오늘 복약률
            </Text>
            <Text className={`text-3xl font-bold ${adherenceRateColorClass}`}>
              {adherenceRate}%
            </Text>
          </View>

          {/* Stats Row - using memoized values */}
          <View className="flex-row justify-around items-center">
            <View className="items-center flex-1">
              <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {takenCount}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                복용
              </Text>
            </View>
            <View className={`w-px h-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
            <View className="items-center flex-1">
              <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {pendingCount}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                대기
              </Text>
            </View>
            <View className={`w-px h-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
            <View className="items-center flex-1">
              <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {missedCount}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                미복용
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Medications Section */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            오늘의 복약
          </Text>
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formattedDate}
          </Text>
        </View>

        {/* Medication Timeline - using memoized TimelineItem */}
        {todayItems.length === 0 ? (
          <View
            className={`rounded-xl p-8 items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <Ionicons name="medical-outline" size={32} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
            <Text className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              오늘 예정된 복약이 없습니다
            </Text>
          </View>
        ) : (
          <View className="pl-1">
            {todayItems.map((item, index) => (
              <TimelineItem
                key={`${item.medicationId}-${item.scheduledTime}`}
                item={item}
                isLast={index === todayItems.length - 1}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quick Call Button */}
      <TouchableOpacity
        className="absolute bottom-4 left-4 right-4 flex-row items-center justify-center bg-success py-4 rounded-xl gap-2 shadow-lg"
        onPress={handleCallParent}
        activeOpacity={0.8}
      >
        <Ionicons name="call" size={20} color="#FFFFFF" />
        <Text className="text-base font-bold text-white">부모님께 전화</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChildHomeScreen;
