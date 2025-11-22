/**
 * MedicationManageScreen - Child's Medication Management
 *
 * Allows child users to manage parent's medications.
 *
 * Features:
 * - List all parent's medications
 * - Add new medication
 * - Edit existing medication
 * - Delete medication (with confirmation)
 * - Toggle medication active/inactive
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getConnectedParent,
  getParentMedications,
  deleteMedication,
  toggleMedicationActive,
} from '../../services/api';
import { User, Medication } from '../../types/database.types';
import { ChildStackParamList } from '../../types/navigation.types';

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
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#1A1A1A',
};

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;

const MedicationManageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (parent) {
        const meds = await getParentMedications(parent.id);
        setMedications(meds);
      } else {
        setMedications([]);
      }
    } catch (err) {
      console.error('Error loading medications:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Handle add medication
   */
  const handleAddMedication = (): void => {
    if (!parentInfo) {
      Alert.alert('오류', '부모님 연결이 필요합니다.');
      return;
    }
    navigation.navigate('AddMedication', { parentId: parentInfo.id });
  };

  /**
   * Handle edit medication
   */
  const handleEditMedication = (medicationId: string): void => {
    navigation.navigate('EditMedication', { medicationId });
  };

  /**
   * Handle delete medication
   */
  const handleDeleteMedication = (medication: Medication): void => {
    Alert.alert(
      '약 삭제',
      `'${medication.name}'을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medication.id);
              setMedications((prev) =>
                prev.filter((m) => m.id !== medication.id)
              );
              Alert.alert('완료', '약이 삭제되었습니다.');
            } catch (err) {
              console.error('Error deleting medication:', err);
              Alert.alert('오류', '약 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle toggle active status
   */
  const handleToggleActive = async (
    medication: Medication,
    active: boolean
  ): Promise<void> => {
    try {
      await toggleMedicationActive(medication.id, active);
      setMedications((prev) =>
        prev.map((m) => (m.id === medication.id ? { ...m, active } : m))
      );
    } catch (err) {
      console.error('Error toggling medication active:', err);
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  };

  /**
   * Format frequency text
   */
  const formatFrequency = (frequency: string): string => {
    const frequencyMap: Record<string, string> = {
      once_daily: '하루 1회',
      twice_daily: '하루 2회',
      three_times_daily: '하루 3회',
      as_needed: '필요시',
      weekly: '주 1회',
    };
    return frequencyMap[frequency] || frequency;
  };

  /**
   * Format reminder times
   */
  const formatReminderTimes = (times: string[]): string => {
    return times.join(', ');
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
            부모님의 약을 관리하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{parentInfo.name}님의 약</Text>
          <Text style={styles.headerSubtitle}>
            총 {medications.length}개의 약이 등록되어 있습니다
          </Text>
        </View>

        {/* Medication List */}
        {medications.length === 0 ? (
          <View style={styles.emptyMedicationsCard}>
            <Ionicons name="medical-outline" size={48} color={COLORS.gray400} />
            <Text style={styles.emptyMedicationsTitle}>등록된 약이 없습니다</Text>
            <Text style={styles.emptyMedicationsText}>
              부모님이 드시는 약을 등록해주세요
            </Text>
          </View>
        ) : (
          <View style={styles.medicationList}>
            {medications.map((medication) => (
              <View key={medication.id} style={styles.medicationCard}>
                {/* Header with name and toggle */}
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                  </View>
                  <Switch
                    value={medication.active}
                    onValueChange={(value) =>
                      handleToggleActive(medication, value)
                    }
                    trackColor={{ false: COLORS.gray300, true: COLORS.success + '60' }}
                    thumbColor={medication.active ? COLORS.success : COLORS.gray400}
                  />
                </View>

                {/* Details */}
                <View style={styles.medicationDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="repeat-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.detailText}>
                      {formatFrequency(medication.frequency)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.detailText}>
                      {formatReminderTimes(medication.reminder_times)}
                    </Text>
                  </View>
                  {medication.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={COLORS.gray500} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {medication.notes}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Status badge */}
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      medication.active ? styles.statusActive : styles.statusInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        medication.active
                          ? styles.statusTextActive
                          : styles.statusTextInactive,
                      ]}
                    >
                      {medication.active ? '알림 활성화' : '알림 비활성화'}
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditMedication(medication.id)}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.actionButtonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleDeleteMedication(medication)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                      삭제
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Medication FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddMedication}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
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
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  emptyMedicationsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyMedicationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMedicationsText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  medicationList: {
    gap: 12,
  },
  medicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medicationHeader: {
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  medicationDetails: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray700,
    flex: 1,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: COLORS.success + '20',
  },
  statusInactive: {
    backgroundColor: COLORS.gray200,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: COLORS.success,
  },
  statusTextInactive: {
    color: COLORS.gray500,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
  },
  actionButtonDanger: {
    backgroundColor: COLORS.error + '10',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtonTextDanger: {
    color: COLORS.error,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default MedicationManageScreen;
