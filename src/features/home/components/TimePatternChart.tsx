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

import React, { memo, useMemo } from 'react';
import { View, Text, ActivityIndicator, DimensionValue } from 'react-native';
import { Ionicons, type Ionicons as IoniconsType } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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

type TimePeriodKey = keyof TimePatternData;

interface TimePeriodConfig {
  key: TimePeriodKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

// Static configuration for time periods - labels are fetched via i18n
const TIME_PERIOD_CONFIGS: TimePeriodConfig[] = [
  { key: 'morning', icon: 'sunny', color: '#F59E0B' },
  { key: 'afternoon', icon: 'partly-sunny', color: '#EAB308' },
  { key: 'evening', icon: 'moon', color: '#3B82F6' },
  { key: 'night', icon: 'moon-outline', color: '#6366F1' },
];

/**
 * Calculate missed rate for a time period
 * Pure function for memoization
 */
const calculateMissedRateValue = (periodData: TimePeriodData): number => {
  if (periodData.total === 0) return 0;
  return Math.round((periodData.missed / periodData.total) * 100);
};

/**
 * Get bar color class based on missed rate
 * Pure function for memoization
 */
const getBarColorClassValue = (rate: number): string => {
  if (rate >= 30) return 'bg-error';
  if (rate >= 15) return 'bg-warning';
  return 'bg-success';
};

/**
 * Get text color based on missed rate
 * Pure function for memoization
 */
const getTextColorValue = (rate: number): string => {
  if (rate >= 30) return '#EF4444';
  if (rate >= 15) return '#F59E0B';
  return '#22C55E';
};

// Helper to get translation key for time period
const getTimePeriodLabelKey = (
  key: TimePeriodKey
):
  | 'reports:timePattern.morning'
  | 'reports:timePattern.afternoon'
  | 'reports:timePattern.evening'
  | 'reports:timePattern.night' => {
  const keyMap = {
    morning: 'reports:timePattern.morning',
    afternoon: 'reports:timePattern.afternoon',
    evening: 'reports:timePattern.evening',
    night: 'reports:timePattern.night',
  } as const;
  return keyMap[key];
};

const TimePatternChart: React.FC<TimePatternChartProps> = memo(({ data, isLoading = false }) => {
  const { t } = useTranslation(['reports']);

  // Memoize computed period data with rates and styles
  const periodDataWithStyles = useMemo(() => {
    return TIME_PERIOD_CONFIGS.map((config) => {
      const periodData = data[config.key];
      const missedRate = calculateMissedRateValue(periodData);
      return {
        ...config,
        label: t(getTimePeriodLabelKey(config.key)),
        periodData,
        missedRate,
        barWidth: `${Math.max(missedRate, 2)}%` as DimensionValue,
        barColorClass: getBarColorClassValue(missedRate),
        textColor: getTextColorValue(missedRate),
      };
    });
  }, [data, t]);

  // Memoize most missed period calculation
  const mostMissedPeriod = useMemo(() => {
    let maxRate = 0;
    let maxPeriod: TimePeriodKey | null = null;

    TIME_PERIOD_CONFIGS.forEach(({ key }) => {
      const rate = calculateMissedRateValue(data[key]);
      if (rate > maxRate) {
        maxRate = rate;
        maxPeriod = key;
      }
    });

    return maxPeriod;
  }, [data]);

  // Memoize most missed period label for display
  const mostMissedPeriodLabel = useMemo(() => {
    if (!mostMissedPeriod) return null;
    return t(getTimePeriodLabelKey(mostMissedPeriod));
  }, [mostMissedPeriod, t]);

  if (isLoading) {
    return (
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-base font-bold text-gray-900">{t('reports:timePattern.title')}</Text>
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
      accessibilityLabel={t('reports:timePattern.chartLabel')}
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-bold text-gray-900">{t('reports:timePattern.title')}</Text>
        {mostMissedPeriod && mostMissedPeriodLabel && (
          <View className="px-2 py-1 rounded-md bg-red-500/20">
            <Text className="text-[11px] font-semibold text-error">
              {t('reports:timePattern.warning', { period: mostMissedPeriodLabel })}
            </Text>
          </View>
        )}
      </View>

      <View className="gap-3">
        {periodDataWithStyles.map((period) => {
          const isHighlighted = period.key === mostMissedPeriod;

          return (
            <View
              key={period.key}
              className={`flex-row items-center py-2 px-2 rounded-lg ${isHighlighted ? 'bg-gray-100' : ''}`}
              accessibilityLabel={t('reports:timePattern.accessibilityLabel', {
                period: period.label,
                rate: period.missedRate,
                total: period.periodData.total,
                missed: period.periodData.missed,
              })}
            >
              {/* Icon & Label */}
              <View className="flex-row items-center gap-1.5 w-[70px]">
                <Ionicons name={period.icon} size={20} color={period.color} />
                <Text className="text-sm font-semibold text-gray-700">{period.label}</Text>
              </View>

              {/* Bar */}
              <View className="flex-1 flex-row items-center mx-2">
                <View className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <View
                    className={`h-full rounded-full min-w-[2px] ${period.barColorClass}`}
                    style={{ width: period.barWidth }}
                  />
                </View>
                <Text
                  className="text-sm font-bold min-w-[40px] text-right"
                  style={{ color: period.textColor }}
                >
                  {period.missedRate}%
                </Text>
              </View>

              {/* Count */}
              <Text className="text-xs text-gray-500 min-w-[40px] text-right">
                {period.periodData.missed}/{period.periodData.total}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer Note */}
      <View className="flex-row items-center gap-1 mt-3 pt-3 border-t border-gray-200">
        <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
        <Text className="text-[11px] text-gray-500">{t('reports:timePattern.footerNote')}</Text>
      </View>
    </View>
  );
});

// Display name for React DevTools
TimePatternChart.displayName = 'TimePatternChart';

export default TimePatternChart;
