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

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  getConnectedParent,
  getParentTodayLogs,
  getParentMedications,
} from '../../../../shared/services/api';
import { User, MedicationLog, Medication } from '../../../../shared/types/database.types';
import RefillAlertBanner from '../../../medication/components/RefillAlertBanner';
import { useTheme } from '../../../../shared/contexts';

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
  status: 'taken' | 'pending' | 'missed',
  statusTexts: { taken: string; pending: string; missed: string }
): { icon: string; colorClass: string; bgColorClass: string; text: string } => {
  switch (status) {
    case 'taken':
      return {
        icon: 'checkmark-circle',
        colorClass: 'text-success',
        bgColorClass: 'bg-success',
        text: statusTexts.taken,
      };
    case 'pending':
      return {
        icon: 'time',
        colorClass: 'text-warning',
        bgColorClass: 'bg-warning',
        text: statusTexts.pending,
      };
    case 'missed':
      return {
        icon: 'close-circle',
        colorClass: 'text-error',
        bgColorClass: 'bg-error',
        text: statusTexts.missed,
      };
  }
};

/**
 * Memoized medication timeline item component
 */
interface TimelineItemProps {
  item: TodayMedicationItem;
  isLast: boolean;
  statusTexts: { taken: string; pending: string; missed: string };
}

const TimelineItem = memo(({ item, isLast, statusTexts }: TimelineItemProps) => {
  const statusDisplay = useMemo(
    () => getStatusDisplayConfig(item.status, statusTexts),
    [item.status, statusTexts]
  );

  return (
    <View className="flex-row mb-4">
      {/* Timeline line */}
      <View className="w-7 items-center mr-3">
        <View
          className={`w-6 h-6 rounded-full justify-center items-center ${statusDisplay.bgColorClass}`}
        >
          <Ionicons name={statusDisplay.icon as any} size={12} color="#FFFFFF" />
        </View>
        {!isLast && <View className="flex-1 w-0.5 bg-gray-200 mt-1 -mb-2" />}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-xs text-gray-500 mb-1.5">{item.scheduledTime}</Text>
        <View
          className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${statusDisplay.bgColorClass.replace('bg-', 'border-l-')}`}
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-semibold text-gray-900 flex-1">
              {item.medicationName}
            </Text>
            <View className={`px-2 py-1 rounded ${statusDisplay.bgColorClass}/20`}>
              <Text className={`text-xs font-semibold ${statusDisplay.colorClass}`}>
                {statusDisplay.text}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-gray-500">{item.dosage}</Text>
        </View>
      </View>
    </View>
  );
});

TimelineItem.displayName = 'TimelineItem';

const ChildHomeScreen = () => {
  const { t } = useTranslation(['home', 'common', 'medication', 'settings']);
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [todayItems, setTodayItems] = useState<TodayMedicationItem[]>([]);
  const [parentMedications, setParentMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Track if initial load is complete (using ref to avoid re-renders)
  const isInitialLoadRef = useRef<boolean>(true);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // Get connected parent
      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (!parent) {
        setTodayItems([]);
        setParentMedications([]);
        return;
      }

      // Get today's logs and medications
      const [logs, medications] = await Promise.all([
        getParentTodayLogs(parent.id),
        getParentMedications(parent.id),
      ]);

      // Store all medications for inventory tracking
      setParentMedications(medications);

      // Build today's medication items from medications and logs
      const items = buildTodayItems(medications, logs);
      setTodayItems(items);
    } catch (err) {
      console.error('Error loading child home data:', err);
      setError(t('home:error.loadData'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

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
    loadData().finally(() => {
      isInitialLoadRef.current = false;
    });
  }, [loadData]);

  // Refresh data when screen comes into focus
  // Note: Empty dependency array to prevent infinite loops
  useFocusEffect(
    useCallback(() => {
      // Only reload if initial load is complete (not on first mount)
      if (!isInitialLoadRef.current) {
        loadData();
      }
    }, [loadData])
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
      Alert.alert(t('home:alert.noPhoneNumber'), t('home:alert.noPhoneMessage'));
      return;
    }

    const phoneUrl = `tel:${parentInfo.phone_number}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert(t('common:error.generic'), t('home:error.cannotCall'));
        }
      })
      .catch((err) => {
        console.error('Error opening phone:', err);
        Alert.alert(t('common:error.generic'), t('home:error.cannotCall'));
      });
  }, [parentInfo?.phone_number, t]);

  // Memoized status texts for TimelineItem - must be before conditional returns
  const statusTexts = useMemo(
    () => ({
      taken: t('home:stats.taken'),
      pending: t('home:stats.pending'),
      missed: t('home:stats.missed'),
    }),
    [t]
  );

  // Loading state
  if (isLoading) {
    return (
      <View
        className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`text-base mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('common:loading')}
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
          <Text className="text-base font-semibold text-white">{t('common:button.retry')}</Text>
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
            className={`text-xl font-bold mt-4 mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
          >
            {t('home:child.noParentTitle')}
          </Text>
          <Text
            className={`text-sm text-center leading-5 mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {t('home:child.noParentMessage')}
          </Text>
          <TouchableOpacity className="flex-row items-center bg-primary px-5 py-3 rounded-lg gap-2">
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white">
              {t('settings:button.connectFamily')}
            </Text>
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
              <Text
                className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {t('home:child.greeting', { name: parentInfo.name })}
              </Text>
              <Text className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('home:child.title')}
              </Text>
            </View>
          </View>

          <View
            className={`flex-row justify-between items-center rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('home:child.adherenceRate')}
            </Text>
            <Text className={`text-3xl font-bold ${adherenceRateColorClass}`}>
              {adherenceRate}%
            </Text>
          </View>

          {/* Stats Row - using memoized values */}
          <View className="flex-row justify-around items-center">
            <View className="items-center flex-1">
              <Text
                className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {takenCount}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('home:stats.taken')}
              </Text>
            </View>
            <View className={`w-px h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <View className="items-center flex-1">
              <Text
                className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {pendingCount}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('home:stats.pending')}
              </Text>
            </View>
            <View className={`w-px h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <View className="items-center flex-1">
              <Text
                className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {missedCount}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('home:stats.missed')}
              </Text>
            </View>
          </View>
        </View>

        {/* Refill Alert Banner - show if any medications have low inventory */}
        {parentMedications.length > 0 && (
          <View className="mb-4">
            <RefillAlertBanner
              medications={parentMedications}
              variant="child"
              onPress={() => navigation.navigate('MedicationStack', { screen: 'MedicationList' })}
            />
          </View>
        )}

        {/* Today's Medications Section */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {t('home:child.todayMedications')}
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
              {t('home:timeline.noData')}
            </Text>
          </View>
        ) : (
          <View className="pl-1">
            {todayItems.map((item, index) => (
              <TimelineItem
                key={`${item.medicationId}-${item.scheduledTime}`}
                item={item}
                isLast={index === todayItems.length - 1}
                statusTexts={statusTexts}
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
        <Text className="text-base font-bold text-white">{t('home:child.callParent')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChildHomeScreen;
