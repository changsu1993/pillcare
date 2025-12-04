/**
 * QuantityBadge - Displays remaining medication quantity
 *
 * Shows remaining count with color coding based on inventory status.
 * Supports both parent (large) and child (standard) variants.
 *
 * Color coding:
 * - Green: Sufficient stock (days remaining > refill_threshold)
 * - Yellow: Low stock (days remaining <= refill_threshold)
 * - Red: Critical (days remaining <= 3)
 * - Gray: Tracking disabled (remaining_quantity is null)
 */

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Medication, InventoryStatus } from '../../../shared/types/database.types';
import {
  getInventoryStatus,
  formatDaysRemaining,
  getInventoryColorClass,
} from '../services/inventoryService';

interface QuantityBadgeProps {
  medication: Medication;
  /** Display variant - parent uses larger text */
  variant?: 'parent' | 'child';
  /** Show days remaining text */
  showDaysRemaining?: boolean;
  /** Custom className for container */
  className?: string;
}

/**
 * QuantityBadge component
 *
 * @example
 * // Parent variant (large text)
 * <QuantityBadge medication={medication} variant="parent" />
 *
 * // Child variant (standard text)
 * <QuantityBadge medication={medication} variant="child" showDaysRemaining />
 */
const QuantityBadge = memo(
  ({
    medication,
    variant = 'child',
    showDaysRemaining = false,
    className = '',
  }: QuantityBadgeProps) => {
    const status: InventoryStatus = getInventoryStatus(medication);
    const colors = getInventoryColorClass(status);

    // Don't render if tracking is disabled
    if (status.remainingQuantity === null) {
      return null;
    }

    const isParent = variant === 'parent';

    // Parent: WCAG AAA (24pt+ text, high contrast)
    // Child: WCAG AA (16pt text)
    const containerSizeClass = isParent ? 'px-4 py-2 min-h-[48px]' : 'px-3 py-1.5';
    const quantityTextClass = isParent ? 'text-2xl font-bold' : 'text-base font-semibold';
    const labelTextClass = isParent ? 'text-lg' : 'text-xs';
    const daysTextClass = isParent ? 'text-xl' : 'text-sm';

    return (
      <View
        className={`rounded-xl ${colors.bg} ${containerSizeClass} ${className}`}
        accessibilityLabel={`${status.remainingQuantity}${status.remainingQuantity === 1 ? '' : ''}개 남음${status.daysRemaining !== null ? `, ${formatDaysRemaining(status.daysRemaining)}` : ''}`}
        accessibilityRole="text"
      >
        <View className="flex-row items-center gap-1">
          <Text className={`${quantityTextClass} ${colors.text}`}>{status.remainingQuantity}</Text>
          <Text className={`${labelTextClass} ${colors.text}`}>개</Text>
        </View>

        {showDaysRemaining && status.daysRemaining !== null && (
          <Text className={`${daysTextClass} ${colors.text} mt-0.5`}>
            {formatDaysRemaining(status.daysRemaining)}
          </Text>
        )}
      </View>
    );
  }
);

QuantityBadge.displayName = 'QuantityBadge';

export default QuantityBadge;

/**
 * Compact variant of QuantityBadge for inline display
 */
interface CompactQuantityBadgeProps {
  medication: Medication;
  variant?: 'parent' | 'child';
}

export const CompactQuantityBadge = memo(
  ({ medication, variant = 'child' }: CompactQuantityBadgeProps) => {
    const status = getInventoryStatus(medication);
    const colors = getInventoryColorClass(status);

    if (status.remainingQuantity === null) {
      return null;
    }

    const isParent = variant === 'parent';
    const textClass = isParent ? 'text-xl font-bold' : 'text-sm font-semibold';

    return (
      <View
        className={`flex-row items-center px-2 py-1 rounded-lg ${colors.bg}`}
        accessibilityLabel={`${status.remainingQuantity}개 남음`}
      >
        <Text className={`${textClass} ${colors.text}`}>{status.remainingQuantity}개</Text>
      </View>
    );
  }
);

CompactQuantityBadge.displayName = 'CompactQuantityBadge';
