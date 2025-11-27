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
  ): { icon: string; color: string; label: string } => {
    switch (direction) {
      case 'up':
        return { icon: 'trending-up', color: COLORS.success, label: '개선 중' };
      case 'down':
        return { icon: 'trending-down', color: COLORS.error, label: '감소 중' };
      case 'stable':
        return { icon: 'remove', color: COLORS.gray500, label: '유지 중' };
    }
  };

  /**
   * Normalize rates to chart height (0-100 -> 0-100%)
   */
  const normalizeRate = (rate: number): number => {
    return Math.min(Math.max(rate, 0), 100);
  };

  /**
   * Generate SVG-like path for line chart (simplified version)
   */
  const renderLineChart = () => {
    if (weeklyRates.length === 0) return null;

    const chartHeight = 80;
    const chartWidth = 100; // percentage
    const pointSpacing = chartWidth / (weeklyRates.length - 1 || 1);

    return (
      <View style={styles.chartContainer}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: '0%' }]} />
        <View style={[styles.gridLine, { top: '25%' }]} />
        <View style={[styles.gridLine, { top: '50%' }]} />
        <View style={[styles.gridLine, { top: '75%' }]} />
        <View style={[styles.gridLine, { top: '100%' }]} />

        {/* Data points */}
        {weeklyRates.map((rate, index) => {
          const normalizedRate = normalizeRate(rate);
          const leftPosition = index * pointSpacing;
          const topPosition = 100 - normalizedRate; // Invert for top-down coordinate system

          return (
            <React.Fragment key={index}>
              {/* Line segment to next point */}
              {index < weeklyRates.length - 1 && (
                <View
                  style={[
                    styles.lineSegment,
                    {
                      left: `${leftPosition}%`,
                      top: `${topPosition}%`,
                      width: `${pointSpacing}%`,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            normalizeRate(weeklyRates[index + 1]) - normalizedRate,
                            pointSpacing
                          )}rad`,
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Data point */}
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: `${leftPosition}%`,
                    top: `${topPosition}%`,
                    backgroundColor:
                      index === weeklyRates.length - 1 ? COLORS.primary : COLORS.gray400,
                  },
                ]}
                accessibilityLabel={`${index + 1}주차, 복약률 ${rate}%`}
              >
                {/* Rate label */}
                <Text
                  style={[
                    styles.rateLabel,
                    index === weeklyRates.length - 1 && styles.rateLabelLatest,
                  ]}
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
      <View style={styles.card}>
        <Text style={styles.title}>4주 복약률 추이</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (weeklyRates.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>4주 복약률 추이</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>데이터가 충분하지 않습니다</Text>
        </View>
      </View>
    );
  }

  const trendDirection = getTrendDirection();
  const percentageChange = getPercentageChange();
  const trendStyle = getTrendStyle(trendDirection);
  const latestRate = weeklyRates[weeklyRates.length - 1];

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`4주 복약률 추이, 현재 ${latestRate}%, ${trendStyle.label}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>4주 복약률 추이</Text>
        <View style={[styles.trendBadge, { backgroundColor: trendStyle.color + '20' }]}>
          <Ionicons name={trendStyle.icon as any} size={14} color={trendStyle.color} />
          <Text style={[styles.trendText, { color: trendStyle.color }]}>{trendStyle.label}</Text>
        </View>
      </View>

      {/* Current Rate & Change */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>현재 복약률</Text>
          <Text style={styles.statValue}>{latestRate}%</Text>
        </View>
        {weeklyRates.length >= 2 && (
          <View style={styles.changeItem}>
            <Text style={styles.changeLabel}>지난주 대비</Text>
            <View style={styles.changeValue}>
              <Ionicons
                name={
                  percentageChange > 0 ? 'arrow-up' : percentageChange < 0 ? 'arrow-down' : 'remove'
                }
                size={16}
                color={
                  percentageChange > 0
                    ? COLORS.success
                    : percentageChange < 0
                      ? COLORS.error
                      : COLORS.gray500
                }
              />
              <Text
                style={[
                  styles.changeText,
                  {
                    color:
                      percentageChange > 0
                        ? COLORS.success
                        : percentageChange < 0
                          ? COLORS.error
                          : COLORS.gray500,
                  },
                ]}
              >
                {Math.abs(percentageChange).toFixed(1)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Line Chart */}
      <View style={styles.chartWrapper}>{renderLineChart()}</View>

      {/* Week Labels */}
      <View style={styles.weekLabels}>
        {weeklyRates.map((_, index) => (
          <Text key={index} style={styles.weekLabel}>
            {index + 1}주
          </Text>
        ))}
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
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray400,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  changeItem: {
    flex: 1,
    alignItems: 'flex-end',
  },
  changeLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  changeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartWrapper: {
    height: 120,
    marginBottom: 8,
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.primary,
    transformOrigin: '0% 50%',
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
    marginLeft: -5,
    marginTop: -5,
  },
  rateLabel: {
    position: 'absolute',
    top: -22,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray500,
    minWidth: 30,
    textAlign: 'center',
    left: -10,
  },
  rateLabelLatest: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  weekLabel: {
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});

export default TrendIndicator;
