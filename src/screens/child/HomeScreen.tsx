/**
 * ChildHomeScreen - Child Home Screen
 *
 * Main dashboard for child users to monitor parent's medication status.
 *
 * Features:
 * - Parent's today medication timeline
 * - Visual status indicators (taken/pending/missed)
 * - Quick call parent button
 * - Pull-to-refresh functionality
 * - Real-time adherence rate display
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getConnectedParent, getParentTodayLogs, getParentMedications } from '../../services/api';
import { User, MedicationLog, Medication } from '../../types/database.types';

// Color constants
const COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F9FAFB',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#1A1A1A',
};

interface TodayMedicationItem {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: 'taken' | 'pending' | 'missed';
  log?: MedicationLog;
}

const ChildHomeScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [todayItems, setTodayItems] = useState<TodayMedicationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // Get connected parent
      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (!parent) {
        setTodayItems([]);
        return;
      }

      // Get today's logs and medications
      const [logs, medications] = await Promise.all([
        getParentTodayLogs(parent.id),
        getParentMedications(parent.id),
      ]);

      // Build today's medication items from medications and logs
      const items = buildTodayItems(medications, logs);
      setTodayItems(items);
    } catch (err) {
      console.error('Error loading child home data:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Build today's medication items from medications and logs
   */
  const buildTodayItems = (
    medications: Medication[],
    logs: MedicationLog[]
  ): TodayMedicationItem[] => {
    const items: TodayMedicationItem[] = [];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    medications.forEach((med) => {
      med.reminder_times.forEach((time) => {
        // Find matching log
        const matchingLog = logs.find((log) => {
          const logTime = new Date(log.scheduled_at);
          const logTimeStr = `${logTime.getHours().toString().padStart(2, '0')}:${logTime.getMinutes().toString().padStart(2, '0')}`;
          return log.medication_id === med.id && logTimeStr === time;
        });

        // Determine status
        let status: 'taken' | 'pending' | 'missed' = 'pending';
        if (matchingLog) {
          status = matchingLog.taken ? 'taken' : 'missed';
        } else if (time < currentTime) {
          // Past time without log - could be missed
          status = 'pending'; // Keep as pending until explicitly marked
        }

        items.push({
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: time,
          status,
          log: matchingLog,
        });
      });
    });

    // Sort by time
    items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    return items;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Calculate today's adherence rate
   */
  const calculateTodayAdherence = (): number => {
    if (todayItems.length === 0) return 0;
    const takenCount = todayItems.filter((item) => item.status === 'taken').length;
    return Math.round((takenCount / todayItems.length) * 100);
  };

  /**
   * Get status icon and color
   */
  const getStatusDisplay = (
    status: 'taken' | 'pending' | 'missed'
  ): { icon: string; color: string; text: string } => {
    switch (status) {
      case 'taken':
        return { icon: 'checkmark-circle', color: COLORS.success, text: '복용 완료' };
      case 'pending':
        return { icon: 'time', color: COLORS.warning, text: '대기 중' };
      case 'missed':
        return { icon: 'close-circle', color: COLORS.error, text: '미복용' };
    }
  };

  /**
   * Handle call parent
   */
  const handleCallParent = (): void => {
    if (!parentInfo?.phone_number) {
      Alert.alert('전화번호 없음', '부모님의 전화번호가 등록되어 있지 않습니다.');
      return;
    }

    const phoneUrl = `tel:${parentInfo.phone_number}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('오류', '전화를 걸 수 없습니다.');
        }
      })
      .catch((err) => {
        console.error('Error opening phone:', err);
        Alert.alert('오류', '전화를 걸 수 없습니다.');
      });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No parent connected
  if (!parentInfo) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.gray400} />
          <Text style={styles.emptyTitle}>부모님을 연결해주세요</Text>
          <Text style={styles.emptySubtitle}>
            부모님의 복약 현황을 확인하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
          <TouchableOpacity style={styles.connectButton}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.connectButtonText}>가족 연결하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const adherenceRate = calculateTodayAdherence();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Parent Info Card */}
        <View style={styles.parentCard}>
          <View style={styles.parentHeader}>
            <View style={styles.parentAvatar}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.parentInfo}>
              <Text style={styles.parentName}>{parentInfo.name}님</Text>
              <Text style={styles.parentSubtitle}>부모님 복약 현황</Text>
            </View>
          </View>

          <View style={styles.adherenceContainer}>
            <Text style={styles.adherenceLabel}>오늘 복약률</Text>
            <Text
              style={[
                styles.adherenceValue,
                adherenceRate >= 80 && styles.adherenceGood,
                adherenceRate >= 50 && adherenceRate < 80 && styles.adherenceWarning,
                adherenceRate < 50 && styles.adherenceBad,
              ]}
            >
              {adherenceRate}%
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayItems.filter((i) => i.status === 'taken').length}
              </Text>
              <Text style={styles.statLabel}>복용</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayItems.filter((i) => i.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>대기</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayItems.filter((i) => i.status === 'missed').length}
              </Text>
              <Text style={styles.statLabel}>미복용</Text>
            </View>
          </View>
        </View>

        {/* Today's Medications Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘의 복약</Text>
          <Text style={styles.sectionSubtitle}>
            {new Date().toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </Text>
        </View>

        {/* Medication Timeline */}
        {todayItems.length === 0 ? (
          <View style={styles.emptyMedicationsCard}>
            <Ionicons name="medical-outline" size={32} color={COLORS.gray400} />
            <Text style={styles.emptyMedicationsText}>오늘 예정된 복약이 없습니다</Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {todayItems.map((item, index) => {
              const statusDisplay = getStatusDisplay(item.status);
              return (
                <View
                  key={`${item.medicationId}-${item.scheduledTime}`}
                  style={styles.timelineItem}
                >
                  {/* Timeline line */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: statusDisplay.color }]}>
                      <Ionicons name={statusDisplay.icon as any} size={12} color={COLORS.white} />
                    </View>
                    {index < todayItems.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Content */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTime}>{item.scheduledTime}</Text>
                    <View style={[styles.medicationCard, { borderLeftColor: statusDisplay.color }]}>
                      <View style={styles.medicationHeader}>
                        <Text style={styles.medicationName}>{item.medicationName}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusDisplay.color + '20' },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: statusDisplay.color }]}>
                            {statusDisplay.text}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.medicationDosage}>{item.dosage}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Quick Call Button */}
      <TouchableOpacity style={styles.callButton} onPress={handleCallParent} activeOpacity={0.8}>
        <Ionicons name="call" size={20} color={COLORS.white} />
        <Text style={styles.callButtonText}>부모님께 전화</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray500,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  parentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  parentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  parentSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  adherenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  adherenceLabel: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  adherenceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  adherenceGood: {
    color: COLORS.success,
  },
  adherenceWarning: {
    color: COLORS.warning,
  },
  adherenceBad: {
    color: COLORS.error,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.gray200,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  emptyMedicationsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyMedicationsText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 12,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.gray200,
    marginTop: 4,
    marginBottom: -8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 6,
  },
  medicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  medicationDosage: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  callButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ChildHomeScreen;
