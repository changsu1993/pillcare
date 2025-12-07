/**
 * Analytics Constants
 *
 * Shared constants and helpers for analytics functions.
 */

import type { TimeSlot } from '../../../types/database.types';

/**
 * Time slot definitions for pattern analysis
 */
export const TIME_SLOT_CONFIG: Record<TimeSlot, { start: number; end: number; range: string }> = {
  morning: { start: 6, end: 12, range: '06:00-12:00' },
  afternoon: { start: 12, end: 18, range: '12:00-18:00' },
  evening: { start: 18, end: 22, range: '18:00-22:00' },
  night: { start: 22, end: 6, range: '22:00-06:00' },
};

/**
 * Determine time slot from hour
 * @param hour - Hour of day (0-23)
 * @returns TimeSlot
 */
export const getTimeSlotFromHour = (hour: number): TimeSlot => {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night'; // 22-6
};
