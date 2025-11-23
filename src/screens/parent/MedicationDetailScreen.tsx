/**
 * MedicationDetailScreen - Detailed medication information
 *
 * Shows medication details and 7-day history.
 * Large text, clear visual indicators.
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - Clear status indicators
 * - Large touch targets
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentScreenProps } from '../../types/navigation.types';
import {
  getMedication,
  getMedicationLogs,
  deleteMedicationWithNotifications,
} from '../../services/api';
import { Medication, MedicationLog } from '../../types/database.types';

type Props = ParentScreenProps<'MedicationDetail'>;

const MedicationDetailScreen = ({ route, navigation }: Props) => {
  const { medicationId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMedicationDetails();
  }, [medicationId]);

  const loadMedicationDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load medication info
      const medData = await getMedication(medicationId);
      setMedication(medData);

      // Load last 7 days of logs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const logsData = await getMedicationLogs(medicationId, sevenDaysAgo);
      setLogs(logsData);
    } catch (err) {
      console.error('Error loading medication details:', err);
      setError('약 정보를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!medication) return;

    Alert.alert(
      '약 삭제',
      `"${medication.name}"을(를) 삭제하시겠습니까?\n\n삭제하면 복약 알림도 함께 취소됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicationWithNotifications(medicationId);
              Alert.alert('완료', '약이 삭제되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('Error deleting medication:', err);
              Alert.alert('오류', '약을 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error || !medication) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || '약을 찾을 수 없습니다'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Medication icon */}
        <Text style={styles.icon}>💊</Text>

        {/* Medication name */}
        <Text
          style={styles.medicationName}
          accessibilityLabel={`약 이름: ${medication.name}`}
          accessibilityRole="header"
        >
          {medication.name}
        </Text>

        {/* Dosage */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>복용량</Text>
          <Text style={styles.infoValue}>{medication.dosage}</Text>
        </View>

        {/* Reminder times */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>복용 시간</Text>
          <View style={styles.timeBadgesContainer}>
            {medication.reminder_times.map((time, index) => (
              <View key={index} style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>복용 기간</Text>
          <Text style={styles.infoValue}>
            {new Date(medication.start_date).toLocaleDateString('ko-KR')}
            {medication.end_date && (
              <Text> ~ {new Date(medication.end_date).toLocaleDateString('ko-KR')}</Text>
            )}
          </Text>
        </View>

        {/* Notes */}
        {medication.notes && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>메모</Text>
            <Text style={styles.infoValue}>{medication.notes}</Text>
          </View>
        )}

        {/* 7-day history */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>최근 7일 복약 이력</Text>
          <View style={styles.historyGrid}>
            {Array.from({ length: 7 }).map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - index));
              const dateStr = date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              });

              // Check if there's a log for this date
              const dayLogs = logs.filter((log) => {
                const logDate = new Date(log.scheduled_at);
                return logDate.toDateString() === date.toDateString();
              });

              const allTaken = dayLogs.length > 0 && dayLogs.every((log) => log.taken);
              const someMissed = dayLogs.some((log) => !log.taken);
              const isPending = dayLogs.length === 0 && date <= new Date();

              return (
                <View key={index} style={styles.historyDay}>
                  <Text style={styles.historyDate}>{dateStr}</Text>
                  <View style={styles.historyStatus}>
                    {allTaken && <Text style={styles.statusTaken}>✓</Text>}
                    {someMissed && <Text style={styles.statusMissed}>✗</Text>}
                    {isPending && <Text style={styles.statusPending}>○</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.bottomButtonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButtonLarge}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonLargeText}>뒤로</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
            accessibilityLabel="약 삭제"
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Space for bottom button
  },
  loadingText: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  errorText: {
    fontSize: 24,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  medicationName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timeBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1E40AF',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  historyDay: {
    alignItems: 'center',
    width: '14%',
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  historyStatus: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTaken: {
    fontSize: 28,
    color: '#22C55E',
  },
  statusMissed: {
    fontSize: 28,
    color: '#EF4444',
  },
  statusPending: {
    fontSize: 28,
    color: '#9CA3AF',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonLarge: {
    flex: 1,
    backgroundColor: '#3B82F6',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonLargeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MedicationDetailScreen;
