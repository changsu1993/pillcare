/**
 * TrendIndicator - 4-week adherence trend indicator
 *
 * Shows 4-week adherence rate trend with line chart and trend direction.
 * Displays percentage change from previous week.
 *
 * Usage:
 * <TrendIndicator
 *   weeklyRates={[75, 82, 88, 90]}
 *   isLoading={false}
 * />
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrendIndicatorProps {
  weeklyRates: number[]; // Array of 4 weekly adherence rates (oldest to newest)
  isLoading?: boolean;
}

type TrendDirection = 'up' | 'down' | 'stable';

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ weeklyRates, isLoading = false }) => {
  /**
   * Calculate trend direction
   */
  const getTrendDirection = (): TrendDirection => {
    if (weeklyRates.length < 2) return 'stable';

    const latestRate = weeklyRates[weeklyRates.length - 1];
    const previousRate = weeklyRates[weeklyRates.length - 2];
    const diff = latestRate - previousRate;

    if (diff > 3) return 'up';
    if (diff < -3) return 'down';
    return 'stable';
  };

  /**
   * Calculate percentage change from previous week
   */
  const getPercentageChange = (): number => {
    if (weeklyRates.length < 2) return 0;

    const latestRate = weeklyRates[weeklyRates.length - 1];
    const previousRate = weeklyRates[weeklyRates.length - 2];

    return latestRate - previousRate;
  };

  /**
   * Get trend icon and color
   */
  const getTrendStyle = (
    direction: TrendDirection
  ): { icon: string; color: string; bgColor: string; label: string } => {
    switch (direction) {
      case 'up':
        return { icon: 'trending-up', color: '#22C55E', bgColor: '#22C55E20', label: '개선 중' };
      case 'down':
        return { icon: 'trending-down', color: '#EF4444', bgColor: '#EF444420', label: '감소 중' };
      case 'stable':
        return { icon: 'remove', color: '#6B7280', bgColor: '#6B728020', label: '유지 중' };
    }
  };

  /**
   * Get change icon color
   */
  const getChangeIconColor = (change: number): string => {
    if (change > 0) return '#22C55E'; // success
    if (change < 0) return '#EF4444'; // error
    return '#6B7280'; // gray-500
  };

  /**
   * Normalize rates to chart height (0-100 -> 0-100%)
   */
  const normalizeRate = (rate: number): number => {
    return Math.min(Math.max(rate, 0), 100);
  };

  /**
   * Generate line chart with data points
   */
  const renderLineChart = () => {
    if (weeklyRates.length === 0) return null;

    const chartWidth = 100; // percentage
    const pointSpacing = chartWidth / (weeklyRates.length - 1 || 1);

    return (
      <View className="flex-1 relative">
        {/* Grid lines */}
        <View className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: '0%' }} />
        <View className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: '25%' }} />
        <View className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: '50%' }} />
        <View className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: '75%' }} />
        <View className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: '100%' }} />

        {/* Data points */}
        {weeklyRates.map((rate, index) => {
          const normalizedRate = normalizeRate(rate);
          const leftPosition = index * pointSpacing;
          const topPosition = 100 - normalizedRate; // Invert for top-down coordinate system
          const isLatest = index === weeklyRates.length - 1;

          return (
            <React.Fragment key={index}>
              {/* Line segment to next point */}
              {index < weeklyRates.length - 1 && (
                <View
                  className="absolute h-0.5 bg-primary"
                  style={{
                    left: `${leftPosition}%`,
                    top: `${topPosition}%`,
                    width: `${pointSpacing}%`,
                    transformOrigin: '0% 50%',
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          normalizeRate(weeklyRates[index + 1]) - normalizedRate,
                          pointSpacing
                        )}rad`,
                      },
                    ],
                  }}
                />
              )}

              {/* Data point */}
              <View
                className={`absolute w-2.5 h-2.5 rounded-full border-2 border-white ${
                  isLatest ? 'bg-primary' : 'bg-gray-400'
                }`}
                style={{
                  left: `${leftPosition}%`,
                  top: `${topPosition}%`,
                  marginLeft: -5,
                  marginTop: -5,
                }}
                accessibilityLabel={`${index + 1}주차, 복약률 ${rate}%`}
              >
                {/* Rate label */}
                <Text
                  className={`absolute ${isLatest ? 'text-xs font-bold text-primary' : 'text-[10px] font-semibold text-gray-500'}`}
                  style={{
                    top: -22,
                    minWidth: 30,
                    textAlign: 'center',
                    left: -10,
                  }}
                >
                  {rate}%
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-base font-bold text-gray-900">4주 복약률 추이</Text>
        <View className="h-45 justify-center items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      </View>
    );
  }

  if (weeklyRates.length === 0) {
    return (
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-base font-bold text-gray-900">4주 복약률 추이</Text>
        <View className="h-45 justify-center items-center">
          <Text className="text-sm text-gray-400">데이터가 충분하지 않습니다</Text>
        </View>
      </View>
    );
  }

  const trendDirection = getTrendDirection();
  const percentageChange = getPercentageChange();
  const trendStyle = getTrendStyle(trendDirection);
  const latestRate = weeklyRates[weeklyRates.length - 1];
  const changeIconColor = getChangeIconColor(percentageChange);

  return (
    <View
      className="bg-white rounded-xl p-4 mb-4 shadow-sm"
      accessibilityRole="summary"
      accessibilityLabel={`4주 복약률 추이, 현재 ${latestRate}%, ${trendStyle.label}`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-bold text-gray-900">4주 복약률 추이</Text>
        <View
          className="flex-row items-center gap-1 px-2 py-1 rounded-md"
          style={{ backgroundColor: trendStyle.bgColor }}
        >
          <Ionicons name={trendStyle.icon as any} size={14} color={trendStyle.color} />
          <Text className="text-xs font-semibold" style={{ color: trendStyle.color }}>
            {trendStyle.label}
          </Text>
        </View>
      </View>

      {/* Current Rate & Change */}
      <View className="flex-row justify-between mb-5">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">현재 복약률</Text>
          <Text className="text-[28px] font-bold text-primary">{latestRate}%</Text>
        </View>
        {weeklyRates.length >= 2 && (
          <View className="flex-1 items-end">
            <Text className="text-xs text-gray-500 mb-1">지난주 대비</Text>
            <View className="flex-row items-center gap-0.5">
              <Ionicons
                name={
                  percentageChange > 0 ? 'arrow-up' : percentageChange < 0 ? 'arrow-down' : 'remove'
                }
                size={16}
                color={changeIconColor}
              />
              <Text className="text-lg font-bold" style={{ color: changeIconColor }}>
                {Math.abs(percentageChange).toFixed(1)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Line Chart */}
      <View className="h-30 mb-2">{renderLineChart()}</View>

      {/* Week Labels */}
      <View className="flex-row justify-between px-1.5">
        {weeklyRates.map((_, index) => (
          <Text key={index} className="text-[11px] text-gray-500 text-center">
            {index + 1}주
          </Text>
        ))}
      </View>
    </View>
  );
};

export default TrendIndicator;
