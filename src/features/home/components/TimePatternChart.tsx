/**
 * TimePatternChart - Time-based medication adherence pattern chart
 *
 * Shows missed medication rate by time period (morning, afternoon, evening, night).
 * Highlights the most frequently missed time period.
 *
 * Usage:
 * <TimePatternChart
 *   data={{
 *     morning: { missed: 2, total: 14 },
 *     afternoon: { missed: 5, total: 14 },
 *     evening: { missed: 3, total: 14 },
 *     night: { missed: 1, total: 7 }
 *   }}
 *   isLoading={false}
 * />
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Color constants
const COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#1A1A1A',
};

interface TimePeriodData {
  missed: number;
  total: number;
}

interface TimePatternData {
  morning: TimePeriodData; // 06:00-11:59
  afternoon: TimePeriodData; // 12:00-17:59
  evening: TimePeriodData; // 18:00-22:59
  night: TimePeriodData; // 23:00-05:59
}

interface TimePatternChartProps {
  data: TimePatternData;
  isLoading?: boolean;
}

interface TimePeriod {
  key: keyof TimePatternData;
  label: string;
  icon: string;
  color: string;
}

const TIME_PERIODS: TimePeriod[] = [
  { key: 'morning', label: '아침', icon: 'sunny', color: '#F59E0B' },
  { key: 'afternoon', label: '점심', icon: 'partly-sunny', color: '#EAB308' },
  { key: 'evening', label: '저녁', icon: 'moon', color: '#3B82F6' },
  { key: 'night', label: '밤', icon: 'moon-outline', color: '#6366F1' },
];

const TimePatternChart: React.FC<TimePatternChartProps> = ({ data, isLoading = false }) => {
  /**
   * Calculate missed rate for a time period
   */
  const calculateMissedRate = (periodData: TimePeriodData): number => {
    if (periodData.total === 0) return 0;
    return Math.round((periodData.missed / periodData.total) * 100);
  };

  /**
   * Find the time period with highest missed rate
   */
  const getMostMissedPeriod = (): keyof TimePatternData | null => {
    let maxRate = 0;
    let maxPeriod: keyof TimePatternData | null = null;

    TIME_PERIODS.forEach(({ key }) => {
      const rate = calculateMissedRate(data[key]);
      if (rate > maxRate) {
        maxRate = rate;
        maxPeriod = key;
      }
    });

    return maxPeriod;
  };

  const mostMissedPeriod = getMostMissedPeriod();

  /**
   * Get bar width based on missed rate (max width for highest rate)
   */
  const getBarWidth = (periodData: TimePeriodData): string => {
    const rate = calculateMissedRate(periodData);
    return `${Math.max(rate, 2)}%`; // Minimum 2% for visibility
  };

  /**
   * Get bar color based on missed rate
   */
  const getBarColor = (rate: number): string => {
    if (rate >= 30) return COLORS.error;
    if (rate >= 15) return COLORS.warning;
    return COLORS.success;
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>시간대별 미복약 패턴</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel="시간대별 미복약 패턴 차트"
    >
      <View style={styles.header}>
        <Text style={styles.title}>시간대별 미복약 패턴</Text>
        {mostMissedPeriod && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {TIME_PERIODS.find((p) => p.key === mostMissedPeriod)?.label} 주의
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        {TIME_PERIODS.map((period) => {
          const periodData = data[period.key];
          const missedRate = calculateMissedRate(periodData);
          const barWidth = getBarWidth(periodData);
          const barColor = getBarColor(missedRate);
          const isHighlighted = period.key === mostMissedPeriod;

          return (
            <View
              key={period.key}
              style={[styles.barRow, isHighlighted && styles.barRowHighlighted]}
              accessibilityLabel={`${period.label} 시간대, 미복약률 ${missedRate}%, ${periodData.total}회 중 ${periodData.missed}회 미복용`}
            >
              {/* Icon & Label */}
              <View style={styles.labelSection}>
                <Ionicons name={period.icon as any} size={20} color={period.color} />
                <Text style={styles.periodLabel}>{period.label}</Text>
              </View>

              {/* Bar */}
              <View style={styles.barSection}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: barWidth as any,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.rateText, { color: barColor }]}>{missedRate}%</Text>
              </View>

              {/* Count */}
              <Text style={styles.countText}>
                {periodData.missed}/{periodData.total}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer Note */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.gray400} />
        <Text style={styles.footerText}>미복약 비율이 높은 시간대를 확인하세요</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  badge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.error,
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  barRowHighlighted: {
    backgroundColor: COLORS.gray100,
  },
  labelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    gap: 6,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  barSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  barBackground: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.gray200,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
    minWidth: 2,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  countText: {
    fontSize: 12,
    color: COLORS.gray500,
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.gray500,
  },
});

export default TimePatternChart;
