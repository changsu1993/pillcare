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

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import {
  getMedication,
  getMedicationLogs,
  deleteMedicationWithNotifications,
} from '../../../../shared/services/api';
import { Medication, MedicationLog } from '../../../../shared/types/database.types';

type Props = ParentScreenProps<'MedicationDetail'>;

const MedicationDetailScreen = ({ route, navigation }: Props) => {
  const { medicationId } = route.params;
  const { t } = useTranslation(['medication', 'common']);
  const [isLoading, setIsLoading] = useState(true);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMedicationDetails = useCallback(async () => {
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
      setError(t('alert.loadMedicationError'));
    } finally {
      setIsLoading(false);
    }
  }, [medicationId, t]);

  useEffect(() => {
    loadMedicationDetails();
  }, [loadMedicationDetails]);

  const handleDelete = () => {
    if (!medication) return;

    Alert.alert(
      t('alert.deleteTitle'),
      t('alert.deleteWithNotification', { name: medication.name }),
      [
        { text: t('common:button.cancel'), style: 'cancel' },
        {
          text: t('common:button.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicationWithNotifications(medicationId);
              Alert.alert(t('alert.deleteComplete'), t('alert.deleteSuccess'), [
                { text: t('common:button.confirm'), onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('Error deleting medication:', err);
              Alert.alert(t('alert.loadError'), t('alert.deleteError'));
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-6">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">{t('message.loadingData')}</Text>
      </View>
    );
  }

  if (error || !medication) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-6">
        <Text className="text-2xl text-error text-center mb-6">
          {error || t('message.medicationNotFound')}
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-8 py-4 rounded-xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-xl font-semibold text-white text-center">{t('button.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-[100px]">
        {/* Medication icon */}
        <Text className="text-6xl text-center mb-4">💊</Text>

        {/* Medication name */}
        <Text
          className="text-4xl font-bold text-gray-900 text-center mb-6"
          accessibilityLabel={t('accessibility.medicationName', { name: medication.name })}
          accessibilityRole="header"
        >
          {medication.name}
        </Text>

        {/* Dosage */}
        <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
          <Text className="text-xl font-semibold text-gray-600 mb-2">{t('label.dosage')}</Text>
          <Text className="text-2xl font-semibold text-gray-900">{medication.dosage}</Text>
        </View>

        {/* Reminder times */}
        <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
          <Text className="text-xl font-semibold text-gray-600 mb-2">
            {t('label.medicationTime')}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {medication.reminder_times.map((time, index) => (
              <View key={index} className="bg-blue-100 px-5 py-3 rounded-xl">
                <Text className="text-2xl font-semibold text-blue-900">{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
          <Text className="text-xl font-semibold text-gray-600 mb-2">
            {t('label.medicationDuration')}
          </Text>
          <Text className="text-2xl font-semibold text-gray-900">
            {new Date(medication.start_date).toLocaleDateString('ko-KR')}
            {medication.end_date && (
              <Text> ~ {new Date(medication.end_date).toLocaleDateString('ko-KR')}</Text>
            )}
          </Text>
        </View>

        {/* Notes */}
        {medication.notes && (
          <View className="bg-white p-6 rounded-2xl mb-4 border-2 border-gray-200">
            <Text className="text-xl font-semibold text-gray-600 mb-2">{t('label.notes')}</Text>
            <Text className="text-2xl font-semibold text-gray-900">{medication.notes}</Text>
          </View>
        )}

        {/* 7-day history */}
        <View className="bg-white p-6 rounded-2xl mt-2 border-2 border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-4">{t('label.recentHistory')}</Text>
          <View className="flex-row justify-between flex-wrap">
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
                <View key={index} className="items-center w-[14%]">
                  <Text className="text-sm text-gray-700 mb-2">{dateStr}</Text>
                  <View className="w-10 h-10 justify-center items-center">
                    {allTaken && <Text className="text-3xl text-success">✓</Text>}
                    {someMissed && <Text className="text-3xl text-error">✗</Text>}
                    {isPending && <Text className="text-3xl text-gray-700">○</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-gray-50 p-6 border-t border-gray-200">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-blue-500 h-[60px] justify-center items-center rounded-2xl shadow-sm"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel={t('accessibility.goBackButton')}
            accessibilityHint={t('accessibility.goBackHint')}
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-white">{t('button.goBack')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-success h-[60px] justify-center items-center rounded-2xl shadow-sm"
            onPress={() => navigation.navigate('EditMedication', { medicationId })}
            activeOpacity={0.7}
            accessibilityLabel={t('common:button.edit')}
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-white">{t('common:button.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-error h-[60px] justify-center items-center rounded-2xl shadow-sm"
            onPress={handleDelete}
            activeOpacity={0.7}
            accessibilityLabel={t('accessibility.deleteButton')}
            accessibilityHint={t('accessibility.deleteHint')}
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-white">{t('common:button.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MedicationDetailScreen;
