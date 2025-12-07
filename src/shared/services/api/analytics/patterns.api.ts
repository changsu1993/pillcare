/**
 * Patterns API
 *
 * Functions for analyzing missed medication patterns by time slot.
 */

import type { TimeSlotPattern, TimeSlot } from '../../../types/database.types';
import { getParentMedicationLogs } from './parent-data.api';
import { TIME_SLOT_CONFIG, getTimeSlotFromHour } from './constants';

/**
 * Analyze missed medication patterns by time slot
 *
 * Identifies which time periods (morning, afternoon, evening, night)
 * have the highest miss rates to help optimize reminder strategies.
 *
 * @param parentId - Parent user ID
 * @param days - Number of days to analyze (default: 30)
 * @returns Array of time slot patterns sorted by miss rate (descending)
 */
export const getMissedMedicationPattern = async (
  parentId: string,
  days: number = 30
): Promise<TimeSlotPattern[]> => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all logs for the period
    const logs = await getParentMedicationLogs(parentId, startDateStr, endDateStr);

    if (logs.length === 0) {
      // Return empty pattern for all time slots
      return (['morning', 'afternoon', 'evening', 'night'] as TimeSlot[]).map((slot) => ({
        time_slot: slot,
        time_range: TIME_SLOT_CONFIG[slot].range,
        missed_count: 0,
        total_count: 0,
        miss_rate: 0,
      }));
    }

    // Initialize counters for each time slot
    const slotCounts: Record<TimeSlot, { missed: number; total: number }> = {
      morning: { missed: 0, total: 0 },
      afternoon: { missed: 0, total: 0 },
      evening: { missed: 0, total: 0 },
      night: { missed: 0, total: 0 },
    };

    // Categorize each log by time slot
    logs.forEach((log) => {
      const scheduledDate = new Date(log.scheduled_at);
      const hour = scheduledDate.getHours();
      const timeSlot = getTimeSlotFromHour(hour);

      slotCounts[timeSlot].total += 1;
      if (!log.taken) {
        slotCounts[timeSlot].missed += 1;
      }
    });

    // Build result array
    const patterns: TimeSlotPattern[] = (
      ['morning', 'afternoon', 'evening', 'night'] as TimeSlot[]
    ).map((slot) => {
      const { missed, total } = slotCounts[slot];
      const missRate = total > 0 ? Math.round((missed / total) * 100 * 100) / 100 : 0;

      return {
        time_slot: slot,
        time_range: TIME_SLOT_CONFIG[slot].range,
        missed_count: missed,
        total_count: total,
        miss_rate: missRate,
      };
    });

    // Sort by miss rate (descending) - highest miss rate first
    patterns.sort((a, b) => b.miss_rate - a.miss_rate);

    return patterns;
  } catch (error) {
    console.error('시간대별 미복약 패턴 분석 실패:', error);
    throw error;
  }
};
