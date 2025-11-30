/**
 * ReportsScreen - Medication Adherence Reports
 *
 * Shows comprehensive medication adherence statistics:
 * - Weekly/Monthly adherence rate summary
 * - Per-medication adherence breakdown
 * - Time-based missed medication pattern
 * - 4-week adherence trend
 * - Monthly calendar view
 * - Weekly bar chart
 *
 * Features:
 * - Pull-to-refresh
 * - Color-coded adherence visualization
 * - Detailed statistics
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
import {
  getConnectedParent,
  getWeeklyAdherenceData,
  getMonthlyAdherenceData,
  calculateAdherenceRate,
  getMedicationAdherenceByDrug,
  getMissedMedicationPattern,
  getAdherenceTrend,
} from '../../../../shared/services/api';
import { MedicationAdherenceCard, TimePatternChart, TrendIndicator } from '../../components';
import {
  User,
  MedicationAdherence,
  TimeSlotPattern,
  WeeklyTrend,
} from '../../../../shared/types/database.types';

interface WeeklyData {
  date: string;
  rate: number;
  taken: number;
  total: number;
}

interface MonthlyData {
  [date: string]: { rate: number; taken: number; total: number };
}

const ReportsScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [weeklyRate, setWeeklyRate] = useState<number>(0);
  const [monthlyRate, setMonthlyRate] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [error, setError] = useState<string | null>(null);

  // Enhanced report state
  const [medicationAdherences, setMedicationAdherences] = useState<MedicationAdherence[]>([]);
  const [timeSlotPattern, setTimeSlotPattern] = useState<TimeSlotPattern[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<number[]>([]);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (!parent) {
        return;
      }

      // Load all data in parallel for better performance
      const [weekly, monthly, wRate, mRate, medAdherence, timePattern, trends] = await Promise.all([
        getWeeklyAdherenceData(parent.id),
        getMonthlyAdherenceData(parent.id, selectedMonth.year, selectedMonth.month),
        calculateAdherenceRate(parent.id, 7),
        calculateAdherenceRate(parent.id, 30),
        getMedicationAdherenceByDrug(parent.id, 7),
        getMissedMedicationPattern(parent.id, 7),
        getAdherenceTrend(parent.id),
      ]);

      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setWeeklyRate(wRate);
      setMonthlyRate(mRate);
      setMedicationAdherences(medAdherence);
      setTimeSlotPattern(timePattern);
      setWeeklyTrends(trends.map((t: WeeklyTrend) => t.adherence_rate));
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const goToPreviousMonth = (): void => {
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

  const getRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-error';
  };

  const getRateBgColor = (rate: number): string => {
    if (rate >= 80) return 'bg-success';
    if (rate >= 50) return 'bg-warning';
    return 'bg-error';
  };

  const getDayName = (dateStr: string): string => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(dateStr);
    return days[date.getDay()];
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

  const getCalendarDayStyle = (day: number | null): { bgClass: string; textClass: string } => {
    if (!day) {
      return { bgClass: 'bg-transparent', textClass: 'text-gray-400' };
    }

    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = monthlyData[dateStr];

    if (!dayData || dayData.total === 0) {
      return { bgClass: 'bg-gray-100', textClass: 'text-gray-700' };
    }

    const rate = dayData.rate;
    if (rate >= 80) {
      return { bgClass: 'bg-success/30', textClass: 'text-success' };
    }
    if (rate >= 50) {
      return { bgClass: 'bg-warning/30', textClass: 'text-warning' };
    }
    return { bgClass: 'bg-error/30', textClass: 'text-error' };
  };

  // Helper to get time slot data safely
  const getTimeSlotData = (slot: string) => {
    const data = timeSlotPattern.find((p) => p.time_slot === slot);
    return {
      missed: data?.missed_count || 0,
      total: data?.total_count || 0,
    };
  };

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
            부모님의 복약 리포트를 확인하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarGrid = generateCalendarGrid();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
            <Text className="text-sm text-gray-500 mb-2">주간 복약률</Text>
            <Text className={`text-3xl font-bold ${getRateColor(weeklyRate)}`}>{weeklyRate}%</Text>
            <Text className="text-xs text-gray-400 mt-1">최근 7일</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
            <Text className="text-sm text-gray-500 mb-2">월간 복약률</Text>
            <Text className={`text-3xl font-bold ${getRateColor(monthlyRate)}`}>
              {monthlyRate}%
            </Text>
            <Text className="text-xs text-gray-400 mt-1">최근 30일</Text>
          </View>
        </View>

        {/* Trend Indicator - 4 Week Trend */}
        {weeklyTrends.length > 0 && <TrendIndicator weeklyRates={weeklyTrends} isLoading={false} />}

        {/* Per-Medication Adherence Cards */}
        {medicationAdherences.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-4">약별 복약률</Text>
            {medicationAdherences.map((med) => (
              <MedicationAdherenceCard
                key={med.medication_id}
                medicationName={med.medication_name}
                dosage={med.dosage}
                adherenceRate={med.adherence_rate}
                taken={med.total_taken}
                total={med.total_scheduled}
                isLoading={false}
              />
            ))}
          </View>
        )}

        {/* Time Pattern Chart */}
        {timeSlotPattern.length > 0 && (
          <TimePatternChart
            data={{
              morning: getTimeSlotData('morning'),
              afternoon: getTimeSlotData('afternoon'),
              evening: getTimeSlotData('evening'),
              night: getTimeSlotData('night'),
            }}
            isLoading={false}
          />
        )}

        {/* Weekly Bar Chart */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-gray-900 mb-4">주간 복약률</Text>
          <View className="flex-row justify-between h-40 pt-5">
            {weeklyData.map((day) => (
              <View key={day.date} className="flex-1 items-center">
                <View className="flex-1 w-[60%] justify-end mb-2">
                  <View
                    className={`w-full rounded min-h-[4px] ${getRateBgColor(day.rate)}`}
                    style={{ height: `${Math.max(day.rate, 5)}%` }}
                  />
                </View>
                <Text className="text-xs text-gray-500 mb-0.5">{getDayName(day.date)}</Text>
                <Text className="text-[10px] text-gray-400">{day.rate}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Calendar */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={goToPreviousMonth} className="p-1">
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-base font-bold text-gray-900">
              {selectedMonth.year}년 {selectedMonth.month}월
            </Text>
            <TouchableOpacity onPress={goToNextMonth} className="p-1">
              <Ionicons name="chevron-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <Text
                key={day}
                className={`flex-1 text-center text-xs font-semibold ${
                  day === '일' ? 'text-error' : day === '토' ? 'text-primary' : 'text-gray-500'
                }`}
              >
                {day}
              </Text>
            ))}
          </View>

          <View className="gap-1">
            {calendarGrid.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row gap-1">
                {week.map((day, dayIndex) => {
                  const dayStyle = getCalendarDayStyle(day);
                  return (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      className={`flex-1 aspect-square rounded-lg justify-center items-center ${dayStyle.bgClass}`}
                    >
                      <Text
                        className={`text-sm font-medium ${day ? dayStyle.textClass : 'text-transparent'}`}
                      >
                        {day || ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-success/30" />
              <Text className="text-[11px] text-gray-500">80% 이상</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-warning/30" />
              <Text className="text-[11px] text-gray-500">50-79%</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-error/30" />
              <Text className="text-[11px] text-gray-500">50% 미만</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-gray-100" />
              <Text className="text-[11px] text-gray-500">기록 없음</Text>
            </View>
          </View>
        </View>

        {/* Statistics Summary */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-gray-900 mb-4">이번 주 통계</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text className="text-xl font-bold text-gray-900 mt-2 mb-1">
                {weeklyData.reduce((sum, d) => sum + d.taken, 0)}회
              </Text>
              <Text className="text-xs text-gray-500">복용 완료</Text>
            </View>
            <View className="items-center">
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text className="text-xl font-bold text-gray-900 mt-2 mb-1">
                {weeklyData.reduce((sum, d) => sum + (d.total - d.taken), 0)}회
              </Text>
              <Text className="text-xs text-gray-500">미복용</Text>
            </View>
            <View className="items-center">
              <Ionicons name="medical" size={24} color="#3B82F6" />
              <Text className="text-xl font-bold text-gray-900 mt-2 mb-1">
                {weeklyData.reduce((sum, d) => sum + d.total, 0)}회
              </Text>
              <Text className="text-xs text-gray-500">총 예정</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportsScreen;
