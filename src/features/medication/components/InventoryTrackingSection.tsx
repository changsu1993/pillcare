/**
 * InventoryTrackingSection - Optional inventory tracking for medications
 *
 * Allows users to track remaining medication quantity and set quantity per dose.
 * Designed with accessibility in mind for elderly users.
 *
 * Features:
 * - Toggle to enable/disable inventory tracking
 * - Quantity input for remaining pills
 * - Quantity per dose selector (1, 2, 3)
 * - Full accessibility support with ARIA labels and roles
 */

import React, { memo, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import QuantityInput from './QuantityInput';

interface InventoryTrackingSectionProps {
  /** Whether inventory tracking is enabled */
  trackQuantity: boolean;
  /** Callback when tracking toggle changes */
  onTrackQuantityChange: (value: boolean) => void;
  /** Current remaining quantity (null when not tracking) */
  remainingQuantity: number | null;
  /** Callback when remaining quantity changes */
  onRemainingQuantityChange: (value: number | null) => void;
  /** Number of pills taken per dose */
  quantityPerDose: number;
  /** Callback when quantity per dose changes */
  onQuantityPerDoseChange: (value: number) => void;
}

const QUANTITY_PER_DOSE_OPTIONS = [1, 2, 3] as const;

/**
 * InventoryTrackingSection component
 *
 * Provides inventory management controls for medication tracking.
 * Includes a switch to enable tracking, quantity input, and dose selector.
 */
const InventoryTrackingSection = memo(
  ({
    trackQuantity,
    onTrackQuantityChange,
    remainingQuantity,
    onRemainingQuantityChange,
    quantityPerDose,
    onQuantityPerDoseChange,
  }: InventoryTrackingSectionProps) => {
    const { t } = useTranslation(['medication', 'common']);

    const handleToggleChange = useCallback(
      (value: boolean) => {
        onTrackQuantityChange(value);
        if (value && remainingQuantity === null) {
          onRemainingQuantityChange(30); // Default starting quantity
        }
      },
      [onTrackQuantityChange, onRemainingQuantityChange, remainingQuantity]
    );

    const handleQuantityPerDoseSelect = useCallback(
      (value: number) => {
        onQuantityPerDoseChange(value);
      },
      [onQuantityPerDoseChange]
    );

    return (
      <View className="mb-6">
        {/* Header row with label and switch toggle */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">{t('label.inventoryTracking')}</Text>
          <Switch
            value={trackQuantity}
            onValueChange={handleToggleChange}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={trackQuantity ? '#22C55E' : '#9CA3AF'}
            accessibilityLabel={t('accessibility.inventoryToggle')}
            accessibilityRole="switch"
          />
        </View>

        {/* Inventory tracking content - shown when enabled */}
        {trackQuantity && (
          <View className="bg-white border-2 border-gray-300 rounded-xl p-5 gap-5">
            {/* Remaining quantity input */}
            <QuantityInput
              value={remainingQuantity}
              onValueChange={onRemainingQuantityChange}
              variant="parent"
              label={t('label.remainingQuantity')}
              min={0}
              max={9999}
              step={10}
              allowNull={false}
            />

            {/* Quantity per dose selector */}
            <View className="mt-4">
              <Text className="text-xl font-semibold text-gray-700 mb-2">
                {t('label.quantityPerDose')}
              </Text>
              <View className="flex-row items-center gap-3">
                {QUANTITY_PER_DOSE_OPTIONS.map((option) => {
                  const isSelected = quantityPerDose === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      className={`flex-1 py-4 rounded-xl items-center justify-center min-h-[64px] ${
                        isSelected
                          ? 'bg-success border-2 border-success'
                          : 'bg-gray-100 border-2 border-gray-300'
                      }`}
                      onPress={() => handleQuantityPerDoseSelect(option)}
                      accessibilityLabel={t('accessibility.quantityLabel', {
                        count: option,
                      })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        className={`text-2xl font-bold ${
                          isSelected ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {option}
                        {t('unit.count')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
);

InventoryTrackingSection.displayName = 'InventoryTrackingSection';

export default InventoryTrackingSection;
