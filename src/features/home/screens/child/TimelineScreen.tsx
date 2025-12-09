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
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getTodayLogs, getFamilyConnections } from '../../../../shared/services/api';
import { MedicationLog, User } from '../../../../shared/types/database.types';

// TimelineScreen은 더 이상 사용되지 않음 (HomeScreen으로 대체됨)

const ChildTimelineScreen = () => {
  const { t } = useTranslation(['home', 'common', 'family', 'medication']);
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
      setError(t('home:error.loadData'));
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
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-base text-gray-900 mt-3">{t('common:loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-base text-error text-center mb-4">{error}</Text>
        <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg" onPress={loadData}>
          <Text className="text-base font-semibold text-white">{t('common:button.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (no parent connected)
  if (!parentInfo) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-6xl mb-4">👨‍👩‍👧</Text>
          <Text className="text-xl text-gray-500 text-center mb-6">
            {t('home:child.noParentTitle')}
          </Text>
          <TouchableOpacity className="bg-primary px-8 py-3.5 rounded-xl">
            <Text className="text-base font-semibold text-white">
              {t('family:button.enterCode')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const adherenceRate = calculateAdherence();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Parent info card */}
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            {t('home:child.greeting', { name: parentInfo?.name || t('family:label.parent') })}
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-base text-gray-500">{t('home:child.adherenceRate')}</Text>
            <Text
              className={`text-3xl font-bold ${
                adherenceRate >= 80
                  ? 'text-success'
                  : adherenceRate >= 50
                    ? 'text-warning'
                    : 'text-error'
              }`}
            >
              {adherenceRate}%
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {medications.length === 0 ? (
          <View className="p-8 items-center">
            <Text className="text-base text-gray-400">{t('home:timeline.noData')}</Text>
          </View>
        ) : (
          <View className="pl-2">
            {medications.map((med, index) => (
              <View key={`${med.medication_id}-${med.scheduled_at}`} className="flex-row mb-6">
                {/* Timeline indicator */}
                <View className="w-6 items-center mr-4">
                  <View
                    className={`w-4 h-4 rounded-full ${
                      med.taken
                        ? 'bg-success border-[3px] border-green-700'
                        : 'bg-gray-200 border-[3px] border-gray-400'
                    }`}
                  />
                  {index < medications.length - 1 && (
                    <View className="flex-1 w-0.5 bg-gray-200 mt-1" />
                  )}
                </View>

                {/* Medication info */}
                <View className="flex-1">
                  <Text className="text-sm text-gray-400 mb-2">
                    {new Date(med.scheduled_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View
                    className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
                      med.taken ? 'border-l-success opacity-70' : 'border-l-warning'
                    }`}
                  >
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {med.medications?.name || t('medication:unknown.name')}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2">
                      {med.medications?.dosage || t('medication:unknown.dosage')}
                    </Text>
                    <Text
                      className={`text-sm font-semibold ${med.taken ? 'text-success' : 'text-warning'}`}
                    >
                      {med.taken ? t('home:stats.takenComplete') : t('home:stats.pendingStatus')}
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

export default ChildTimelineScreen;
