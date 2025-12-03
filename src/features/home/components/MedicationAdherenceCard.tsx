/**
 * MedicationAdherenceCard - Individual medication adherence card
 *
 * Shows adherence rate for a specific medication with progress bar.
 * Color coding: 80%+ green, 50-79% yellow, <50% red
 *
 * Usage:
 * <MedicationAdherenceCard
 *   medicationName="혈압약"
 *   dosage="10mg"
 *   adherenceRate={85}
 *   taken={17}
 *   total={20}
 *   isLoading={false}
 * />
 */

import React, { memo, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MedicationAdherenceCardProps {
  medicationName: string;
  dosage: string;
  adherenceRate: number; // 0-100
  taken: number;
  total: number;
  isLoading?: boolean;
}

/**
 * Get color and icon based on adherence rate
 * Pure function for memoization
 */
const getAdherenceStyles = (rate: number) => {
  if (rate >= 80) {
    return {
      textColorClass: 'text-success',
      barColorClass: 'bg-success',
      iconName: 'checkmark-circle' as const,
      iconColor: '#22C55E',
    };
  }
  if (rate >= 50) {
    return {
      textColorClass: 'text-warning',
      barColorClass: 'bg-warning',
      iconName: 'warning' as const,
      iconColor: '#F59E0B',
    };
  }
  return {
    textColorClass: 'text-error',
    barColorClass: 'bg-error',
    iconName: 'alert-circle' as const,
    iconColor: '#EF4444',
  };
};

const MedicationAdherenceCard: React.FC<MedicationAdherenceCardProps> = memo(
  ({ medicationName, dosage, adherenceRate, taken, total, isLoading = false }) => {
    // Memoize style calculations to prevent recalculation on every render
    const styles = useMemo(() => getAdherenceStyles(adherenceRate), [adherenceRate]);
    const progressWidth = useMemo(() => Math.min(adherenceRate, 100), [adherenceRate]);
    const missedCount = useMemo(() => total - taken, [total, taken]);

    return (
      <View
        className="bg-white rounded-xl p-4 mb-3 shadow-sm"
        accessibilityRole="summary"
        accessibilityLabel={`${medicationName} ${dosage}, 복약률 ${adherenceRate}%, ${total}회 중 ${taken}회 복용`}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
              {medicationName}
            </Text>
            <Text className="text-xs text-gray-500">{dosage}</Text>
          </View>
          <Ionicons name={styles.iconName} size={24} color={styles.iconColor} />
        </View>

        {/* Progress Bar */}
        <View className="flex-row items-center mb-3">
          <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
            <View
              className={`h-full rounded-full ${styles.barColorClass}`}
              style={{ width: `${progressWidth}%`, minWidth: 2 }}
            />
          </View>
          <Text
            className={`text-xl font-bold ${styles.textColorClass}`}
            style={{ minWidth: 50, textAlign: 'right' }}
          >
            {adherenceRate}%
          </Text>
        </View>

        {/* Footer */}
        <View className="flex-row justify-between items-center">
          {isLoading ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <>
              <Text className="text-xs text-gray-700">
                복용 {taken}회 / 총 {total}회
              </Text>
              <Text className="text-xs text-error">미복용 {missedCount}회</Text>
            </>
          )}
        </View>
      </View>
    );
  }
);

// Display name for React DevTools
MedicationAdherenceCard.displayName = 'MedicationAdherenceCard';

export default MedicationAdherenceCard;
