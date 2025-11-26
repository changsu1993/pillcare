/**
 * ChildTimelineScreen - Real-time Parent Medication Status
 *
 * Shows today's medication timeline for connected parent.
 * Real-time updates via Supabase subscriptions.
 *
 * Features:
 * - Chronological timeline view
 * - Live status updates
 * - Quick notifications to parent
 * - Visual adherence indicators
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayLogs, getFamilyConnections } from '../../../../shared/services/api';
import { MedicationLog, User } from '../../../../shared/types/database.types';

// TimelineScreen은 더 이상 사용되지 않음 (HomeScreen으로 대체됨)

const ChildTimelineScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Load parent info and today's logs
      const [connections, logs] = await Promise.all([getFamilyConnections(), getTodayLogs()]);

      if (connections.length > 0 && connections[0].parent) {
        setParentInfo(connections[0].parent);
      }

      setMedications(logs);
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateAdherence = (): number => {
    if (medications.length === 0) return 0;
    const takenCount = medications.filter((m) => m.taken).length;
    return Math.round((takenCount / medications.length) * 100);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (no parent connected)
  if (!parentInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.emptyText}>부모님을 연결해주세요</Text>
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectButtonText}>초대 코드 입력</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const adherenceRate = calculateAdherence();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Parent info card */}
        <View style={styles.parentCard}>
          <Text style={styles.parentName}>{parentInfo?.name || '부모님'}님</Text>
          <View style={styles.adherenceContainer}>
            <Text style={styles.adherenceLabel}>오늘 복약률</Text>
            <Text
              style={[
                styles.adherenceValue,
                adherenceRate >= 80 && styles.adherenceGood,
                adherenceRate < 80 && adherenceRate >= 50 && styles.adherenceWarning,
                adherenceRate < 50 && styles.adherenceBad,
              ]}
            >
              {adherenceRate}%
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {medications.length === 0 ? (
          <View style={styles.emptyMedications}>
            <Text style={styles.emptyMedicationsText}>오늘 예정된 복약이 없습니다</Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {medications.map((med, index) => (
              <View key={`${med.medication_id}-${med.scheduled_at}`} style={styles.timelineItem}>
                {/* Timeline indicator */}
                <View style={styles.timelineIndicator}>
                  <View style={[styles.timelineDot, med.taken && styles.timelineDotTaken]} />
                  {index < medications.length - 1 && <View style={styles.timelineLine} />}
                </View>

                {/* Medication info */}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>
                    {new Date(med.scheduled_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={[styles.medicationCard, med.taken && styles.medicationCardTaken]}>
                    <Text style={styles.medicationName}>
                      {med.medications?.name || '약 이름 없음'}
                    </Text>
                    <Text style={styles.medicationDosage}>
                      {med.medications?.dosage || '복용량 정보 없음'}
                    </Text>
                    <Text
                      style={[styles.medicationStatus, med.taken && styles.medicationStatusTaken]}
                    >
                      {med.taken ? '복용 완료' : '대기 중'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
  },
  loadingText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  parentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  parentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  adherenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  adherenceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  adherenceGood: {
    color: '#22C55E',
  },
  adherenceWarning: {
    color: '#F59E0B',
  },
  adherenceBad: {
    color: '#EF4444',
  },
  emptyMedications: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMedicationsText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIndicator: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#9CA3AF',
  },
  timelineDotTaken: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationCardTaken: {
    borderLeftColor: '#22C55E',
    opacity: 0.7,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  medicationStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  medicationStatusTaken: {
    color: '#22C55E',
  },
});

export default ChildTimelineScreen;
