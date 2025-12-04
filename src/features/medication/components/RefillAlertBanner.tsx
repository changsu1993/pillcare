/**
 * RefillAlertBanner - Alert banner for low/critical medication stock
 *
 * Displays a prominent alert when medications need refilling.
 * Supports both parent (large, accessible) and child (compact) variants.
 *
 * Features:
 * - Critical (red) and warning (yellow) states
 * - Shows medication name(s) and days remaining
 * - Optional action button for navigation
 * - WCAG AAA compliant for parent variant
 */

import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Medication } from '../../../shared/types/database.types';
import {
  getLowInventoryMedications,
  getCriticalInventoryMedications,
  formatDaysRemaining,
  getInventoryStatus,
} from '../services/inventoryService';

interface RefillAlertBannerProps {
  /** List of medications to check */
  medications: Medication[];
  /** Display variant */
  variant?: 'parent' | 'child';
  /** Callback when banner is pressed */
  onPress?: () => void;
  /** Maximum number of medications to show */
  maxDisplay?: number;
}

/**
 * RefillAlertBanner component
 *
 * @example
 * // Parent variant
 * <RefillAlertBanner
 *   medications={medications}
 *   variant="parent"
 *   onPress={() => navigation.navigate('Medications')}
 * />
 *
 * // Child variant
 * <RefillAlertBanner
 *   medications={medications}
 *   variant="child"
 * />
 */
const RefillAlertBanner = memo(
  ({ medications, variant = 'child', onPress, maxDisplay = 3 }: RefillAlertBannerProps) => {
    const isParent = variant === 'parent';

    // Get medications that need attention
    const { criticalMeds, lowMeds, hasCritical, hasLow } = useMemo(() => {
      const critical = getCriticalInventoryMedications(medications);
      const low = getLowInventoryMedications(medications).filter(
        (med) => !critical.some((c) => c.id === med.id)
      );

      return {
        criticalMeds: critical,
        lowMeds: low,
        hasCritical: critical.length > 0,
        hasLow: low.length > 0,
      };
    }, [medications]);

    // Don't render if no low stock medications
    if (!hasCritical && !hasLow) {
      return null;
    }

    // Determine severity and styling
    const isCritical = hasCritical;
    const bgColor = isCritical ? 'bg-red-100' : 'bg-yellow-100';
    const borderColor = isCritical ? 'border-error' : 'border-warning';
    const textColor = isCritical ? 'text-red-800' : 'text-yellow-800';
    const iconColor = isCritical ? '#DC2626' : '#D97706';

    // Combine medications for display
    const allLowMeds = [...criticalMeds, ...lowMeds].slice(0, maxDisplay);
    const totalLowCount = criticalMeds.length + lowMeds.length;
    const hasMore = totalLowCount > maxDisplay;

    // Sizing based on variant
    const containerPadding = isParent ? 'p-5' : 'p-4';
    const iconSize = isParent ? 32 : 24;
    const titleSize = isParent ? 'text-2xl' : 'text-base';
    const bodySize = isParent ? 'text-xl' : 'text-sm';
    const buttonPadding = isParent ? 'px-5 py-3' : 'px-4 py-2';
    const buttonTextSize = isParent ? 'text-lg' : 'text-sm';

    const Container = onPress ? TouchableOpacity : View;

    return (
      <Container
        className={`rounded-xl ${bgColor} border-2 ${borderColor} ${containerPadding}`}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`${isCritical ? '긴급' : '주의'}: ${totalLowCount}개 약이 재고가 부족합니다`}
        accessibilityRole={onPress ? 'button' : 'alert'}
      >
        <View className="flex-row items-start">
          {/* Alert Icon */}
          <View className="mr-3 mt-0.5">
            <Ionicons
              name={isCritical ? 'warning' : 'alert-circle'}
              size={iconSize}
              color={iconColor}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            {/* Title */}
            <Text className={`${titleSize} font-bold ${textColor} mb-2`}>
              {isCritical ? '약 재고 긴급' : '약 재고 부족'}
            </Text>

            {/* Medication List */}
            <View className="gap-1.5">
              {allLowMeds.map((med) => {
                const status = getInventoryStatus(med);
                const daysText = formatDaysRemaining(status.daysRemaining);
                const isMedCritical = status.isCritical;

                return (
                  <View key={med.id} className="flex-row items-center justify-between">
                    <Text className={`${bodySize} ${textColor} flex-1`} numberOfLines={1}>
                      {med.name}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        isMedCritical ? 'bg-red-200' : 'bg-yellow-200'
                      }`}
                    >
                      <Text className={`${bodySize} font-semibold ${textColor}`}>
                        {status.remainingQuantity}개 ({daysText})
                      </Text>
                    </View>
                  </View>
                );
              })}

              {hasMore && (
                <Text className={`${bodySize} ${textColor} opacity-80`}>
                  + {totalLowCount - maxDisplay}개 약 더 있음
                </Text>
              )}
            </View>

            {/* Action Button (if onPress provided) */}
            {onPress && (
              <TouchableOpacity
                className={`mt-3 self-start ${buttonPadding} rounded-lg ${
                  isCritical ? 'bg-red-600' : 'bg-yellow-600'
                }`}
                onPress={onPress}
                accessibilityLabel="약 재고 확인하기"
                accessibilityRole="button"
              >
                <Text className={`${buttonTextSize} font-semibold text-white`}>재고 확인하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Chevron for pressable */}
          {onPress && (
            <View className="ml-2 justify-center">
              <Ionicons name="chevron-forward" size={isParent ? 28 : 20} color={iconColor} />
            </View>
          )}
        </View>
      </Container>
    );
  }
);

RefillAlertBanner.displayName = 'RefillAlertBanner';

export default RefillAlertBanner;

/**
 * Compact inline refill alert for medication cards
 */
interface InlineRefillAlertProps {
  medication: Medication;
  variant?: 'parent' | 'child';
}

export const InlineRefillAlert = memo(
  ({ medication, variant = 'child' }: InlineRefillAlertProps) => {
    const status = getInventoryStatus(medication);

    // Don't show if not low or tracking disabled
    if (!status.isLow || status.daysRemaining === null) {
      return null;
    }

    const isParent = variant === 'parent';
    const isCritical = status.isCritical;

    const bgColor = isCritical ? 'bg-red-100' : 'bg-yellow-100';
    const textColor = isCritical ? 'text-red-700' : 'text-yellow-700';
    const iconColor = isCritical ? '#DC2626' : '#D97706';
    const textSize = isParent ? 'text-lg' : 'text-xs';
    const iconSize = isParent ? 20 : 14;

    return (
      <View className={`flex-row items-center ${bgColor} px-2 py-1 rounded-lg gap-1`}>
        <Ionicons
          name={isCritical ? 'warning' : 'alert-circle'}
          size={iconSize}
          color={iconColor}
        />
        <Text className={`${textSize} font-semibold ${textColor}`}>
          {formatDaysRemaining(status.daysRemaining)}
        </Text>
      </View>
    );
  }
);

InlineRefillAlert.displayName = 'InlineRefillAlert';
