/**
 * ParentHomeScreen - Elderly Parent Home Screen
 *
 * Shows today's medications with large, high-contrast UI.
 * This is the primary screen parents see.
 *
 * Features:
 * - Large medication cards (elderly-friendly)
 * - Visual status indicators (taken/pending)
 * - One-tap action buttons
 * - Voice guidance support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayLogs } from '../../services/api';
import { ParentScreenProps } from '../../types/navigation.types';
import { MedicationLog } from '../../types/database.types';

type Props = ParentScreenProps<'Home'>;

const ParentHomeScreen: React.FC<Props> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodayMedications();
  }, []);

  const loadTodayMedications = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const logs = await getTodayLogs();
      setMedications(logs);
    } catch (err) {
      console.error('Error loading medications:', err);
      setError('복약 정보를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadTodayMedications}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (no medications scheduled)
  if (medications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✓</Text>
          <Text style={styles.emptyText}>
            오늘 드실 약이{'\n'}
            없습니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Medication list */}
        {medications.map((med) => (
          <View
            key={`${med.medication_id}-${med.scheduled_at}`}
            style={[
              styles.medicationCard,
              med.taken && styles.medicationCardTaken,
            ]}
          >
            {/* Medication name */}
            <Text style={styles.medicationName}>
              {med.medications?.name || '약 이름 없음'}
            </Text>

            {/* Dosage */}
            <Text style={styles.medicationDosage}>
              {med.medications?.dosage || '복용량 정보 없음'}
            </Text>

            {/* Status */}
            <View style={styles.statusContainer}>
              {med.taken ? (
                <Text style={styles.statusTaken}>복용 완료 ✓</Text>
              ) : (
                <Text style={styles.statusPending}>복용 대기 중</Text>
              )}
            </View>

            {/* Scheduled time */}
            <Text style={styles.scheduledTime}>
              {new Date(med.scheduled_at).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingText: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  errorText: {
    fontSize: 20,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 28,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 40,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: '#FCD34D', // Yellow for pending
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationCardTaken: {
    borderColor: '#22C55E', // Green for taken
    opacity: 0.6,
  },
  medicationName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  medicationDosage: {
    fontSize: 22,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusTaken: {
    fontSize: 24,
    fontWeight: '600',
    color: '#22C55E',
  },
  statusPending: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F59E0B',
  },
  scheduledTime: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});

export default ParentHomeScreen;
