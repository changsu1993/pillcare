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

import React from 'react';
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

const MedicationAdherenceCard: React.FC<MedicationAdherenceCardProps> = ({
  medicationName,
  dosage,
  adherenceRate,
  taken,
  total,
  isLoading = false,
}) => {
  /**
   * Get color class based on adherence rate
   */
  const getRateColorClass = (rate: number): string => {
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-error';
  };

  /**
   * Get background color class for progress bar
   */
  const getProgressBarColorClass = (rate: number): string => {
    if (rate >= 80) return 'bg-success';
    if (rate >= 50) return 'bg-warning';
    return 'bg-error';
  };

  /**
   * Get icon name based on adherence rate
   */
  const getIconName = (rate: number): string => {
    if (rate >= 80) return 'checkmark-circle';
    if (rate >= 50) return 'warning';
    return 'alert-circle';
  };

  /**
   * Get icon color based on adherence rate
   */
  const getIconColor = (rate: number): string => {
    if (rate >= 80) return '#22C55E'; // success
    if (rate >= 50) return '#F59E0B'; // warning
    return '#EF4444'; // error
  };

  const rateColorClass = getRateColorClass(adherenceRate);
  const progressBarColorClass = getProgressBarColorClass(adherenceRate);
  const iconName = getIconName(adherenceRate);
  const iconColor = getIconColor(adherenceRate);

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
        <Ionicons name={iconName as any} size={24} color={iconColor} />
      </View>

      {/* Progress Bar */}
      <View className="flex-row items-center mb-3">
        <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
          <View
            className={`h-full rounded-full ${progressBarColorClass}`}
            style={{ width: `${Math.min(adherenceRate, 100)}%`, minWidth: 2 }}
          />
        </View>
        <Text
          className={`text-xl font-bold ${rateColorClass}`}
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
            <Text className="text-xs text-error">미복용 {total - taken}회</Text>
          </>
        )}
      </View>
    </View>
  );
};

export default MedicationAdherenceCard;
