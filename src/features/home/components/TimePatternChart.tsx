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
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
   * Get bar color class based on missed rate
   */
  const getBarColorClass = (rate: number): string => {
    if (rate >= 30) return 'bg-error';
    if (rate >= 15) return 'bg-warning';
    return 'bg-success';
  };

  /**
   * Get text color based on missed rate
   */
  const getTextColor = (rate: number): string => {
    if (rate >= 30) return '#EF4444'; // error
    if (rate >= 15) return '#F59E0B'; // warning
    return '#22C55E'; // success
  };

  if (isLoading) {
    return (
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-base font-bold text-gray-900">시간대별 미복약 패턴</Text>
        <View className="h-40 justify-center items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      </View>
    );
  }

  return (
    <View
      className="bg-white rounded-xl p-4 mb-4 shadow-sm"
      accessibilityRole="summary"
      accessibilityLabel="시간대별 미복약 패턴 차트"
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-bold text-gray-900">시간대별 미복약 패턴</Text>
        {mostMissedPeriod && (
          <View className="px-2 py-1 rounded-md" style={{ backgroundColor: '#EF444420' }}>
            <Text className="text-[11px] font-semibold text-error">
              {TIME_PERIODS.find((p) => p.key === mostMissedPeriod)?.label} 주의
            </Text>
          </View>
        )}
      </View>

      <View className="gap-3">
        {TIME_PERIODS.map((period) => {
          const periodData = data[period.key];
          const missedRate = calculateMissedRate(periodData);
          const barWidth = getBarWidth(periodData);
          const barColorClass = getBarColorClass(missedRate);
          const textColor = getTextColor(missedRate);
          const isHighlighted = period.key === mostMissedPeriod;

          return (
            <View
              key={period.key}
              className={`flex-row items-center py-2 px-2 rounded-lg ${isHighlighted ? 'bg-gray-100' : ''}`}
              accessibilityLabel={`${period.label} 시간대, 미복약률 ${missedRate}%, ${periodData.total}회 중 ${periodData.missed}회 미복용`}
            >
              {/* Icon & Label */}
              <View className="flex-row items-center gap-1.5" style={{ width: 70 }}>
                <Ionicons name={period.icon as any} size={20} color={period.color} />
                <Text className="text-sm font-semibold text-gray-700">{period.label}</Text>
              </View>

              {/* Bar */}
              <View className="flex-1 flex-row items-center mx-2">
                <View className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <View
                    className={`h-full rounded-full ${barColorClass}`}
                    style={{ width: barWidth as any, minWidth: 2 }}
                  />
                </View>
                <Text
                  className="text-sm font-bold"
                  style={{ color: textColor, minWidth: 40, textAlign: 'right' }}
                >
                  {missedRate}%
                </Text>
              </View>

              {/* Count */}
              <Text className="text-xs text-gray-500" style={{ minWidth: 40, textAlign: 'right' }}>
                {periodData.missed}/{periodData.total}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer Note */}
      <View className="flex-row items-center gap-1 mt-3 pt-3 border-t border-gray-200">
        <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
        <Text className="text-[11px] text-gray-500">미복약 비율이 높은 시간대를 확인하세요</Text>
      </View>
    </View>
  );
};

export default TimePatternChart;
