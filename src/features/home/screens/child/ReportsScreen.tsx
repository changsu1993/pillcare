/**
 * ReportsScreen - Medication Adherence Reports
 *
 * Shows medication adherence statistics and calendar view.
 *
 * Features:
 * - Weekly adherence rate chart (bar chart style)
 * - Monthly calendar with color-coded days
 * - Statistics summary
 * - Pull-to-refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
} from '../../../../shared/services/api';
import { User } from '../../../../shared/types/database.types';

// Color constants
const COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F9FAFB',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#1A1A1A',
};

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

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (!parent) {
        return;
      }

      // Load weekly data
      const weekly = await getWeeklyAdherenceData(parent.id);
      setWeeklyData(weekly);

      // Load monthly data
      const monthly = await getMonthlyAdherenceData(
        parent.id,
        selectedMonth.year,
        selectedMonth.month
      );
      setMonthlyData(monthly);

      // Calculate rates
      const wRate = await calculateAdherenceRate(parent.id, 7);
      setWeeklyRate(wRate);

      const mRate = await calculateAdherenceRate(parent.id, 30);
      setMonthlyRate(mRate);
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

  /**
   * Navigate to previous month
   */
  const goToPreviousMonth = (): void => {
    setSelectedMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  /**
   * Navigate to next month
   */
  const goToNextMonth = (): void => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    setSelectedMonth((prev) => {
      if (prev.year === currentYear && prev.month >= currentMonth) {
        return prev; // Don't go beyond current month
      }
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  /**
   * Get rate color
   */
  const getRateColor = (rate: number): string => {
    if (rate >= 80) return COLORS.success;
    if (rate >= 50) return COLORS.warning;
    return COLORS.error;
  };

  /**
   * Get day names in Korean
   */
  const getDayName = (dateStr: string): string => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  /**
   * Generate calendar grid for selected month
   */
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

  /**
   * Get calendar day style based on adherence
   */
  const getCalendarDayStyle = (
    day: number | null
  ): { backgroundColor: string; textColor: string } => {
    if (!day) {
      return { backgroundColor: 'transparent', textColor: COLORS.gray400 };
    }

    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = monthlyData[dateStr];

    if (!dayData || dayData.total === 0) {
      return { backgroundColor: COLORS.gray100, textColor: COLORS.gray700 };
    }

    const rate = dayData.rate;
    if (rate >= 80) {
      return { backgroundColor: COLORS.success + '30', textColor: COLORS.success };
    }
    if (rate >= 50) {
      return { backgroundColor: COLORS.warning + '30', textColor: COLORS.warning };
    }
    return { backgroundColor: COLORS.error + '30', textColor: COLORS.error };
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No parent connected
  if (!parentInfo) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.gray400} />
          <Text style={styles.emptyTitle}>부모님을 연결해주세요</Text>
          <Text style={styles.emptySubtitle}>
            부모님의 복약 리포트를 확인하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarGrid = generateCalendarGrid();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>주간 복약률</Text>
            <Text style={[styles.summaryValue, { color: getRateColor(weeklyRate) }]}>
              {weeklyRate}%
            </Text>
            <Text style={styles.summaryPeriod}>최근 7일</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>월간 복약률</Text>
            <Text style={[styles.summaryValue, { color: getRateColor(monthlyRate) }]}>
              {monthlyRate}%
            </Text>
            <Text style={styles.summaryPeriod}>최근 30일</Text>
          </View>
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>주간 복약률</Text>
          <View style={styles.weeklyChart}>
            {weeklyData.map((day) => (
              <View key={day.date} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(day.rate, 5)}%`,
                        backgroundColor: getRateColor(day.rate),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{getDayName(day.date)}</Text>
                <Text style={styles.barValue}>{day.rate}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Calendar */}
        <View style={styles.sectionCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNav}>
              <Ionicons name="chevron-back" size={24} color={COLORS.gray700} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {selectedMonth.year}년 {selectedMonth.month}월
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNav}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          {/* Day names */}
          <View style={styles.calendarWeekHeader}>
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <Text
                key={day}
                style={[
                  styles.calendarDayName,
                  day === '일' && styles.calendarDaySunday,
                  day === '토' && styles.calendarDaySaturday,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarGrid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {week.map((day, dayIndex) => {
                  const dayStyle = getCalendarDayStyle(day);
                  return (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={[styles.calendarDay, { backgroundColor: dayStyle.backgroundColor }]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          { color: day ? dayStyle.textColor : 'transparent' },
                          dayIndex === 0 && day && styles.calendarDaySundayText,
                          dayIndex === 6 && day && styles.calendarDaySaturdayText,
                        ]}
                      >
                        {day || ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success + '30' }]} />
              <Text style={styles.legendText}>80% 이상</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning + '30' }]} />
              <Text style={styles.legendText}>50-79%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error + '30' }]} />
              <Text style={styles.legendText}>50% 미만</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.gray100 }]} />
              <Text style={styles.legendText}>기록 없음</Text>
            </View>
          </View>
        </View>

        {/* Statistics Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>이번 주 통계</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>
                {weeklyData.reduce((sum, d) => sum + d.taken, 0)}회
              </Text>
              <Text style={styles.statLabel}>복용 완료</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={styles.statValue}>
                {weeklyData.reduce((sum, d) => sum + (d.total - d.taken), 0)}회
              </Text>
              <Text style={styles.statLabel}>미복용</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="medical" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>
                {weeklyData.reduce((sum, d) => sum + d.total, 0)}회
              </Text>
              <Text style={styles.statLabel}>총 예정</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray500,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryPeriod: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 16,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNav: {
    padding: 4,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  calendarDaySunday: {
    color: COLORS.error,
  },
  calendarDaySaturday: {
    color: COLORS.primary,
  },
  calendarGrid: {
    gap: 4,
  },
  calendarWeek: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarDaySundayText: {
    // Applied when day is Sunday
  },
  calendarDaySaturdayText: {
    // Applied when day is Saturday
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
  },
});

export default ReportsScreen;
