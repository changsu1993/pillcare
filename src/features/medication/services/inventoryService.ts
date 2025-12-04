/**
 * Inventory Service
 *
 * Handles medication inventory tracking calculations and status.
 * Provides utilities for calculating daily usage, days remaining,
 * and inventory status (low/critical).
 */

import { Medication, InventoryStatus } from '../../../shared/types/database.types';

/**
 * Default values for inventory tracking
 */
export const INVENTORY_DEFAULTS = {
  refill_threshold: 7, // days
  quantity_per_dose: 1,
  auto_decrement: true,
};

/**
 * Critical threshold in days
 * When daysRemaining <= this value, status is critical
 */
export const CRITICAL_THRESHOLD = 3;

/**
 * Calculate daily medication usage based on frequency
 *
 * @param medication - Medication with frequency and quantity_per_dose
 * @returns Number of doses per day
 *
 * @example
 * // daily_3 frequency with quantity_per_dose of 2
 * calculateDailyUsage(medication) // returns 6
 */
export const calculateDailyUsage = (medication: Medication): number => {
  const quantityPerDose = medication.quantity_per_dose ?? INVENTORY_DEFAULTS.quantity_per_dose;

  // Count reminder times as doses per day
  const dosesPerDay = medication.reminder_times.length;

  // Handle "as_needed" frequency - assume 1 dose per day
  if (medication.frequency === 'as_needed') {
    return quantityPerDose; // 1 dose per day
  }

  return dosesPerDay * quantityPerDose;
};

/**
 * Calculate days remaining based on remaining quantity and daily usage
 *
 * @param medication - Medication with remaining_quantity and frequency
 * @returns Number of days remaining, or null if tracking is disabled
 *
 * @example
 * // 30 pills remaining, 3 doses per day
 * calculateDaysRemaining(medication) // returns 10
 */
export const calculateDaysRemaining = (medication: Medication): number | null => {
  // If tracking is disabled (null), return null
  if (medication.remaining_quantity === null || medication.remaining_quantity === undefined) {
    return null;
  }

  const dailyUsage = calculateDailyUsage(medication);

  // Avoid division by zero
  if (dailyUsage === 0) {
    return null;
  }

  // Round down to get full days
  return Math.floor(medication.remaining_quantity / dailyUsage);
};

/**
 * Get comprehensive inventory status for a medication
 *
 * @param medication - Medication to check
 * @returns InventoryStatus object with isLow, isCritical, daysRemaining, etc.
 *
 * @example
 * const status = getInventoryStatus(medication);
 * if (status.isCritical) {
 *   showCriticalAlert();
 * } else if (status.isLow) {
 *   showLowStockWarning();
 * }
 */
export const getInventoryStatus = (medication: Medication): InventoryStatus => {
  const dailyUsage = calculateDailyUsage(medication);
  const daysRemaining = calculateDaysRemaining(medication);
  const refillThreshold = medication.refill_threshold ?? INVENTORY_DEFAULTS.refill_threshold;

  // If tracking is disabled, return neutral status
  if (daysRemaining === null) {
    return {
      isLow: false,
      isCritical: false,
      daysRemaining: null,
      remainingQuantity: medication.remaining_quantity,
      dailyUsage,
    };
  }

  return {
    isLow: daysRemaining <= refillThreshold,
    isCritical: daysRemaining <= CRITICAL_THRESHOLD,
    daysRemaining,
    remainingQuantity: medication.remaining_quantity,
    dailyUsage,
  };
};

/**
 * Check if any medications have low inventory
 *
 * @param medications - Array of medications to check
 * @returns Array of medications with low inventory (sorted by days remaining)
 */
export const getLowInventoryMedications = (medications: Medication[]): Medication[] => {
  return medications
    .filter((med) => {
      const status = getInventoryStatus(med);
      return status.isLow;
    })
    .sort((a, b) => {
      const daysA = calculateDaysRemaining(a) ?? Infinity;
      const daysB = calculateDaysRemaining(b) ?? Infinity;
      return daysA - daysB;
    });
};

/**
 * Check if any medications have critical inventory
 *
 * @param medications - Array of medications to check
 * @returns Array of medications with critical inventory
 */
export const getCriticalInventoryMedications = (medications: Medication[]): Medication[] => {
  return medications
    .filter((med) => {
      const status = getInventoryStatus(med);
      return status.isCritical;
    })
    .sort((a, b) => {
      const daysA = calculateDaysRemaining(a) ?? Infinity;
      const daysB = calculateDaysRemaining(b) ?? Infinity;
      return daysA - daysB;
    });
};

/**
 * Calculate new remaining quantity after taking a dose
 *
 * @param medication - Medication to update
 * @returns New remaining quantity, or null if tracking is disabled
 */
export const calculateQuantityAfterDose = (medication: Medication): number | null => {
  if (medication.remaining_quantity === null || medication.remaining_quantity === undefined) {
    return null;
  }

  if (!medication.auto_decrement) {
    return medication.remaining_quantity;
  }

  const quantityPerDose = medication.quantity_per_dose ?? INVENTORY_DEFAULTS.quantity_per_dose;
  const newQuantity = medication.remaining_quantity - quantityPerDose;

  // Don't go below 0
  return Math.max(0, newQuantity);
};

/**
 * Format days remaining for display
 *
 * @param daysRemaining - Number of days remaining, or null
 * @returns Formatted string for display
 */
export const formatDaysRemaining = (daysRemaining: number | null): string => {
  if (daysRemaining === null) {
    return '-';
  }

  if (daysRemaining === 0) {
    return '오늘까지';
  }

  if (daysRemaining === 1) {
    return '내일까지';
  }

  return `${daysRemaining}일분`;
};

/**
 * Get status color class for inventory
 *
 * @param status - InventoryStatus object
 * @returns NativeWind color class
 */
export const getInventoryColorClass = (
  status: InventoryStatus
): { bg: string; text: string; border: string } => {
  if (status.daysRemaining === null) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
    };
  }

  if (status.isCritical) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-error',
    };
  }

  if (status.isLow) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-warning',
    };
  }

  return {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-success',
  };
};
