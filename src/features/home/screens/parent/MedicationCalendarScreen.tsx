/**
 * MedicationCalendarScreen - Parent Medication History Calendar
 *
 * Elderly-friendly medication history calendar with:
 * - Monthly calendar grid view
 * - Color-coded adherence rates
 * - Day selection for detailed logs
 * - Large touch targets (44px minimum)
 * - High contrast colors
 * - Simple navigation
 *
 * Features:
 * - Previous/Next month navigation
 * - Daily adherence rate visualization
 * - Selected day medication details
 * - Monthly adherence summary
 * - Pull to refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getUserProfile,
  getMonthlyAdherenceData,
  getMedicationLogs,
} from '../../../../shared/services/api';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { User, MedicationLog } from '../../../../shared/types/database.types';

type Props = ParentScreenProps<'MedicationCalendar'>;

interface MonthlyData {
  [date: string]: { rate: number; taken: number; total: number };
}

interface DayLog {
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  taken: boolean;
}

const MedicationCalendarScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['home', 'common']);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayLogs, setSelectedDayLogs] = useState<DayLog[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const profile = await getUserProfile();
      setUserProfile(profile);

      const monthly = await getMonthlyAdherenceData(
        profile.id,
        selectedMonth.year,
        selectedMonth.month
      );
      setMonthlyData(monthly);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError(t('home:error.loadData'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const goToPreviousMonth = (): void => {
    setSelectedDate(null); // Clear selected date when changing months
    setSelectedDayLogs([]);
    setSelectedMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = (): void => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    setSelectedDate(null); // Clear selected date when changing months
    setSelectedDayLogs([]);
    setSelectedMonth((prev) => {
      if (prev.year === currentYear && prev.month >= currentMonth) {
        return prev;
      }
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleDayPress = async (day: number): Promise<void> => {
    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);

    // Load detailed logs for selected day
    try {
      const startOfDay = new Date(selectedMonth.year, selectedMonth.month - 1, day);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedMonth.year, selectedMonth.month - 1, day);
      endOfDay.setHours(23, 59, 59, 999);

      const logs: MedicationLog[] = await getMedicationLogs(null, startOfDay, endOfDay);

      // Transform logs to DayLog format
      const dayLogs: DayLog[] = logs.map((log) => {
        const scheduledDate = new Date(log.scheduled_at);
        const hours = scheduledDate.getHours();
        const minutes = scheduledDate.getMinutes();
        const scheduledTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        return {
          medicationName: log.medications?.name || t('home:calendar.unknown'),
          dosage: log.medications?.dosage || '',
          scheduledTime,
          taken: log.taken,
        };
      });

      // Sort by scheduled time
      dayLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

      setSelectedDayLogs(dayLogs);
    } catch (err) {
      console.error('Error loading day logs:', err);
      setSelectedDayLogs([]);
    }
  };

  const getRateBgColor = (rate: number): string => {
    if (rate >= 80) return 'bg-success';
    if (rate >= 50) return 'bg-warning';
    return 'bg-error';
  };

  const getRateTextColor = (rate: number): string => {
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-error';
  };

  const generateCalendarGrid = (): (number | null)[][] => {
    const firstDay = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    const lastDay = new Date(selectedMonth.year, selectedMonth.month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const grid: (number | null)[][] = [];
    let currentDay = 1;

    for (let week = 0; week < 6; week++) {
      const weekRow: (number | null)[] = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startDayOfWeek) {
          weekRow.push(null);
        } else if (currentDay > daysInMonth) {
          weekRow.push(null);
        } else {
          weekRow.push(currentDay);
          currentDay++;
        }
      }
      grid.push(weekRow);
      if (currentDay > daysInMonth) break;
    }

    return grid;
  };

  const getCalendarDayStyle = (
    day: number | null
  ): {
    bgClass: string;
    textClass: string;
    borderClass: string;
  } => {
    if (!day) {
      return {
        bgClass: 'bg-transparent',
        textClass: 'text-transparent',
        borderClass: 'border-transparent',
      };
    }

    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = monthlyData[dateStr];
    const isSelected = selectedDate === dateStr;

    if (!dayData || dayData.total === 0) {
      return {
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-500',
        borderClass: isSelected ? 'border-4 border-primary' : 'border border-gray-200',
      };
    }

    const rate = dayData.rate;
    let bgClass = '';
    let textClass = '';

    if (rate >= 80) {
      bgClass = 'bg-success/20';
      textClass = 'text-success';
    } else if (rate >= 50) {
      bgClass = 'bg-warning/20';
      textClass = 'text-warning';
    } else {
      bgClass = 'bg-error/20';
      textClass = 'text-error';
    }

    return {
      bgClass,
      textClass,
      borderClass: isSelected ? 'border-4 border-primary' : 'border border-gray-300',
    };
  };

  // Calculate monthly statistics
  const getMonthlyStats = () => {
    const dates = Object.values(monthlyData);
    if (dates.length === 0) return { rate: 0, taken: 0, total: 0 };

    const totalTaken = dates.reduce((sum, day) => sum + day.taken, 0);
    const totalScheduled = dates.reduce((sum, day) => sum + day.total, 0);
    const rate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

    return { rate, taken: totalTaken, total: totalScheduled };
  };

  // Weekday keys for i18n
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-2xl text-gray-900 mt-4">{t('common:loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-2xl text-error text-center mt-4 mb-6">{error}</Text>
          <TouchableOpacity
            className="bg-success px-8 py-5 rounded-2xl min-h-[60px]"
            onPress={loadData}
          >
            <Text className="text-2xl font-semibold text-white">{t('common:button.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const calendarGrid = generateCalendarGrid();
  const monthlyStats = getMonthlyStats();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Monthly Summary Card */}
        <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
            {t('home:calendar.monthlyStatus')}
          </Text>
          <View className="flex-row justify-around items-center">
            <View className="items-center">
              <Text className={`text-5xl font-bold ${getRateTextColor(monthlyStats.rate)}`}>
                {monthlyStats.rate}%
              </Text>
              <Text className="text-base text-gray-700 mt-2">
                {t('home:calendar.adherenceRate')}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-gray-900">
                {monthlyStats.taken}/{monthlyStats.total}
              </Text>
              <Text className="text-base text-gray-700 mt-2">{t('home:calendar.takenTotal')}</Text>
            </View>
          </View>
        </View>

        {/* Calendar Card */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          {/* Month Navigation */}
          <View className="flex-row justify-between items-center mb-5">
            <TouchableOpacity
              onPress={goToPreviousMonth}
              className="p-3 rounded-xl bg-gray-100 min-h-[60px] min-w-[60px] items-center justify-center"
              accessibilityLabel={t('home:calendar.prevMonth')}
              accessibilityHint={t('home:calendar.prevMonthHint')}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={28} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">
              {t('home:calendar.yearMonth', {
                year: selectedMonth.year,
                month: selectedMonth.month,
              })}
            </Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              className="p-3 rounded-xl bg-gray-100 min-h-[60px] min-w-[60px] items-center justify-center"
              accessibilityLabel={t('home:calendar.nextMonth')}
              accessibilityHint={t('home:calendar.nextMonthHint')}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-forward" size={28} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View className="flex-row mb-3">
            {weekdayKeys.map((dayKey, index) => (
              <Text
                key={dayKey}
                className={`flex-1 text-center text-lg font-bold ${
                  index === 0 ? 'text-error' : index === 6 ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {t(`home:calendar.weekdays.${dayKey}`)}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="gap-2">
            {calendarGrid.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row gap-2">
                {week.map((day, dayIndex) => {
                  const dayStyle = getCalendarDayStyle(day);
                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      disabled={
                        !day ||
                        !monthlyData[
                          `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        ]
                      }
                      onPress={() => day && handleDayPress(day)}
                      className={`flex-1 aspect-square rounded-xl justify-center items-center ${dayStyle.bgClass} ${dayStyle.borderClass} min-h-[60px]`}
                      accessibilityLabel={day ? `${day}일` : ''}
                      accessibilityRole="button"
                    >
                      <Text
                        className={`text-xl font-bold ${day ? dayStyle.textClass : 'text-transparent'}`}
                      >
                        {day || ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View className="flex-row flex-wrap justify-center gap-4 mt-5 pt-5 border-t-2 border-gray-200">
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 rounded bg-success/20 border border-gray-300" />
              <Text className="text-base text-gray-600">{t('home:calendar.legend.above80')}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 rounded bg-warning/20 border border-gray-300" />
              <Text className="text-base text-gray-600">
                {t('home:calendar.legend.between50and79')}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 rounded bg-error/20 border border-gray-300" />
              <Text className="text-base text-gray-600">{t('home:calendar.legend.below50')}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 rounded bg-gray-100 border border-gray-200" />
              <Text className="text-base text-gray-600">{t('home:calendar.legend.noRecord')}</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Details */}
        {selectedDate && (
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              {t('home:calendar.dayRecord', {
                month: new Date(selectedDate).getMonth() + 1,
                day: new Date(selectedDate).getDate(),
              })}
            </Text>

            {selectedDayLogs.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-xl text-gray-700">{t('home:calendar.noRecordForDay')}</Text>
              </View>
            ) : (
              <View className="gap-4">
                {selectedDayLogs.map((log, index) => (
                  <View
                    key={index}
                    className={`p-5 rounded-xl border-2 ${
                      log.taken ? 'bg-success/10 border-success' : 'bg-error/10 border-error'
                    }`}
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-xl font-bold text-gray-900">{log.medicationName}</Text>
                      {log.taken ? (
                        <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
                      ) : (
                        <Ionicons name="close-circle" size={28} color="#EF4444" />
                      )}
                    </View>
                    <Text className="text-lg text-gray-700 mb-1">{log.dosage}</Text>
                    <Text className="text-lg text-gray-700">{log.scheduledTime}</Text>
                    <Text
                      className={`text-lg font-semibold mt-2 ${
                        log.taken ? 'text-success' : 'text-error'
                      }`}
                    >
                      {log.taken ? t('home:calendar.takenComplete') : t('home:calendar.notTaken')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MedicationCalendarScreen;
