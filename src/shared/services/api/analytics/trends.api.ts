/**
 * Trends API
 *
 * Functions for analyzing adherence trends over time.
 */

import type { WeeklyTrend, TrendDirection } from '../../../types/database.types';
import { getParentMedicationLogs } from './parent-data.api';

/**
 * Get weekly adherence trend over 4 weeks
 *
 * Tracks adherence rate changes over time to identify improvement
 * or decline patterns in medication compliance.
 *
 * @param parentId - Parent user ID
 * @returns Array of 4 weekly trend data points, oldest first
 */
export const getAdherenceTrend = async (parentId: string): Promise<WeeklyTrend[]> => {
  try {
    const trends: WeeklyTrend[] = [];
    const today = new Date();

    // Calculate 4 weeks of data (going backwards from today)
    for (let weekIndex = 3; weekIndex >= 0; weekIndex--) {
      // Calculate week boundaries
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - weekIndex * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Get logs for this week
      const logs = await getParentMedicationLogs(parentId, weekStartStr, weekEndStr);

      // Calculate adherence rate
      const totalScheduled = logs.length;
      const totalTaken = logs.filter((log) => log.taken).length;
      const adherenceRate =
        totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

      // Determine week label (1주차 = oldest, 4주차 = most recent)
      const weekLabel = `${4 - weekIndex}주차`;

      trends.push({
        week_start: weekStartStr,
        week_end: weekEndStr,
        week_label: weekLabel,
        adherence_rate: adherenceRate,
        trend: 'stable' as TrendDirection, // Will be calculated after all weeks are processed
      });
    }

    // Calculate trend direction by comparing with previous week
    for (let i = 0; i < trends.length; i++) {
      if (i === 0) {
        // First week has no previous week to compare
        trends[i].trend = 'stable';
      } else {
        const currentRate = trends[i].adherence_rate;
        const previousRate = trends[i - 1].adherence_rate;
        const difference = currentRate - previousRate;

        // Use 5% threshold for determining trend
        if (difference > 5) {
          trends[i].trend = 'up';
        } else if (difference < -5) {
          trends[i].trend = 'down';
        } else {
          trends[i].trend = 'stable';
        }
      }
    }

    return trends;
  } catch (error) {
    console.error('복약률 트렌드 분석 실패:', error);
    throw error;
  }
};
