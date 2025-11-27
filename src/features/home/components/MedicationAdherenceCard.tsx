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
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Color constants
const COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#1A1A1A',
};

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
   * Get color based on adherence rate
   */
  const getRateColor = (rate: number): string => {
    if (rate >= 80) return COLORS.success;
    if (rate >= 50) return COLORS.warning;
    return COLORS.error;
  };

  /**
   * Get icon name based on adherence rate
   */
  const getIconName = (rate: number): string => {
    if (rate >= 80) return 'checkmark-circle';
    if (rate >= 50) return 'warning';
    return 'alert-circle';
  };

  const rateColor = getRateColor(adherenceRate);
  const iconName = getIconName(adherenceRate);

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${medicationName} ${dosage}, 복약률 ${adherenceRate}%, ${total}회 중 ${taken}회 복용`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName} numberOfLines={1}>
            {medicationName}
          </Text>
          <Text style={styles.dosage}>{dosage}</Text>
        </View>
        <Ionicons name={iconName as any} size={24} color={rateColor} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(adherenceRate, 100)}%`,
                backgroundColor: rateColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.rateText, { color: rateColor }]}>{adherenceRate}%</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.gray400} />
        ) : (
          <>
            <Text style={styles.footerText}>
              복용 {taken}회 / 총 {total}회
            </Text>
            <Text style={styles.missedText}>미복용 {total - taken}회</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  dosage: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  rateText: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray700,
  },
  missedText: {
    fontSize: 12,
    color: COLORS.error,
  },
});

export default MedicationAdherenceCard;
