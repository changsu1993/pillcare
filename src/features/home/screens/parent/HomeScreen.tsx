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

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  getTodayScheduledMedications,
  scheduleAllMedicationNotifications,
  getMedications,
} from '../../../../shared/services/api';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { ScheduledMedication, Medication } from '../../../../shared/types/database.types';
import {
  requestNotificationPermissions,
  sendTestNotification,
  getAllScheduledNotifications,
} from '../../../notifications/services/notifications';
import RefillAlertBanner from '../../../medication/components/RefillAlertBanner';
import { useTheme } from '../../../../shared/contexts';

type Props = ParentScreenProps<'Home'>;

/**
 * Memoized medication card component to prevent unnecessary re-renders
 */
interface MedicationCardProps {
  medication: ScheduledMedication;
  onPress: (medicationId: string) => void;
  takenText: string;
  pendingText: string;
  accessibilityViewDetails: string;
  accessibilityHintText: string;
}

const MedicationCard = memo(
  ({
    medication,
    onPress,
    takenText,
    pendingText,
    accessibilityViewDetails,
    accessibilityHintText,
  }: MedicationCardProps) => {
    const handlePress = useCallback(() => {
      onPress(medication.medication_id);
    }, [medication.medication_id, onPress]);

    return (
      <TouchableOpacity
        className={`bg-white rounded-2xl p-6 border-[3px] shadow-sm ${
          medication.taken ? 'border-success opacity-60' : 'border-yellow-400'
        }`}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`${medication.medication_name} ${accessibilityViewDetails}`}
        accessibilityHint={accessibilityHintText}
        accessibilityRole="button"
      >
        {/* Medication name */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">{medication.medication_name}</Text>

        {/* Dosage */}
        <Text className="text-2xl text-gray-600 mb-4">{medication.dosage}</Text>

        {/* Status */}
        <View className="mb-3">
          {medication.taken ? (
            <Text className="text-2xl font-semibold text-success">{takenText}</Text>
          ) : (
            <Text className="text-2xl font-semibold text-warning">{pendingText}</Text>
          )}
        </View>

        {/* Scheduled time */}
        <Text className="text-xl text-gray-700">{medication.scheduled_time}</Text>
      </TouchableOpacity>
    );
  }
);

MedicationCard.displayName = 'MedicationCard';

const ParentHomeScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['home', 'common', 'medication']);
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scheduledMedications, setScheduledMedications] = useState<ScheduledMedication[]>([]);
  const [allMedications, setAllMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);

  // Track if initial load is complete (using ref to avoid re-renders)
  const isInitialLoadRef = useRef<boolean>(true);

  // Load medications on initial mount
  useEffect(() => {
    loadTodayMedications().finally(() => {
      isInitialLoadRef.current = false;
    });
    checkNotificationPermissions();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from detail screen)
  // Note: Empty dependency array to prevent infinite loops
  useFocusEffect(
    useCallback(() => {
      // Only reload if initial load is complete (not on first mount)
      if (!isInitialLoadRef.current) {
        loadTodayMedications();
      }
    }, [])
  );

  // Memoized callback for navigating to medication detail
  const handleMedicationPress = useCallback(
    (medicationId: string) => {
      navigation.navigate('MedicationDetail', { medicationId });
    },
    [navigation]
  );

  // Memoized callback for adding medication
  const handleAddMedication = useCallback(() => {
    navigation.navigate('AddMedication');
  }, [navigation]);

  // Memoized callback for viewing medication calendar
  const handleViewCalendar = useCallback(() => {
    navigation.navigate('MedicationCalendar');
  }, [navigation]);

  // Memoized callback for opening settings
  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const checkNotificationPermissions = async (): Promise<void> => {
    try {
      const hasPermission = await requestNotificationPermissions();
      setHasNotificationPermission(hasPermission);

      if (!hasPermission) {
        Alert.alert(
          t('medication:notification.permissionTitle'),
          t('medication:notification.permissionMessage'),
          [
            { text: t('home:notification.later'), style: 'cancel' },
            {
              text: t('medication:notification.goToSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } else {
        try {
          await scheduleAllMedicationNotifications();
          console.log(t('medication:message.allScheduled'));
        } catch (error) {
          console.error('Notification scheduling failed:', error);
        }
      }
    } catch (error) {
      console.error('Notification permission check failed:', error);
    }
  };

  const loadTodayMedications = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [scheduled, medications] = await Promise.all([
        getTodayScheduledMedications(),
        getMedications(),
      ]);
      setScheduledMedications(scheduled);
      setAllMedications(medications);
    } catch (err) {
      console.error('Error loading medications:', err);
      setError(t('home:error.loadMedications'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test notification (dev/debug only)
   */
  const handleTestNotification = async (): Promise<void> => {
    try {
      await sendTestNotification();
      Alert.alert(t('home:dev.testNotification'), t('home:dev.testNotificationMessage'), [
        { text: t('common:button.confirm') },
      ]);
    } catch (error) {
      console.error('Test notification failed:', error);
      Alert.alert(t('common:error.generic'), t('home:dev.testNotificationFailed'), [
        { text: t('common:button.confirm') },
      ]);
    }
  };

  /**
   * Check scheduled notifications (dev/debug only)
   */
  const handleCheckScheduledNotifications = async (): Promise<void> => {
    try {
      const notifications = await getAllScheduledNotifications();
      Alert.alert(
        t('home:dev.scheduledNotifications'),
        t('home:dev.scheduledNotificationsCount', { count: notifications.length }),
        [{ text: t('common:button.confirm') }]
      );
    } catch (error) {
      console.error('Check scheduled notifications failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View
        className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className={`text-xl mt-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {t('common:loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <Text className="text-xl text-error text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-8 py-4 rounded-xl"
          onPress={loadTodayMedications}
        >
          <Text className="text-xl font-semibold text-white">{t('common:button.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state (no medications scheduled)
  if (scheduledMedications.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Notification permission warning */}
          {!hasNotificationPermission && (
            <View
              className={`rounded-xl p-5 mb-4 border-2 border-warning ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}
            >
              <Text
                className={`text-xl font-bold mb-2 text-center ${isDarkMode ? 'text-yellow-200' : 'text-yellow-900'}`}
              >
                {t('home:notification.permissionRequired')}
              </Text>
              <Text
                className={`text-base mb-4 text-center leading-5 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-900'}`}
              >
                {t('home:notification.permissionMessage')}
              </Text>
              <TouchableOpacity
                className="bg-warning px-6 py-3 rounded-lg self-center"
                onPress={handleOpenSettings}
              >
                <Text className="text-base font-semibold text-white">
                  {t('medication:notification.goToSettings')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dev/test buttons - SECURITY: Only show in development mode */}
          {/* Reference: OWASP - Security Misconfiguration (A05:2021) */}
          {__DEV__ && (
            <View
              className={`rounded-xl p-4 mb-4 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}
            >
              <Text
                className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('home:dev.title')}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
                  onPress={handleTestNotification}
                >
                  <Text className="text-xs font-semibold text-white">
                    {t('home:dev.testNotification')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
                  onPress={handleCheckScheduledNotifications}
                >
                  <Text className="text-xs font-semibold text-white">
                    {t('home:dev.checkScheduled')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View className="justify-center items-center py-16">
            <Text className="text-8xl mb-6">&#10003;</Text>
            <Text
              className={`text-3xl text-center leading-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {t('medication:empty.today')}
            </Text>
          </View>

          {/* Add medication button */}
          <TouchableOpacity
            className="bg-success rounded-2xl py-6 px-8 items-center justify-center min-h-[72px] mt-4 shadow-lg"
            onPress={handleAddMedication}
            accessibilityLabel={t('home:parent.addMedication')}
            accessibilityHint={t('home:accessibility.addMedicationHint')}
            accessibilityRole="button"
          >
            <Text className="text-3xl font-bold text-white">{t('medication:button.add')}</Text>
          </TouchableOpacity>

          {/* View medication history button */}
          <TouchableOpacity
            className="bg-blue-500 rounded-2xl py-6 px-8 items-center justify-center min-h-[72px] mt-4 shadow-lg flex-row"
            onPress={handleViewCalendar}
            accessibilityLabel={t('home:parent.viewHistory')}
            accessibilityHint={t('home:accessibility.viewHistoryHint')}
            accessibilityRole="button"
          >
            <Text className="text-4xl mr-3">&#128197;</Text>
            <Text className="text-3xl font-bold text-white">
              {t('medication:button.viewCalendar')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Notification permission warning */}
        {!hasNotificationPermission && (
          <View
            className={`rounded-xl p-5 mb-4 border-2 border-warning ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}
          >
            <Text
              className={`text-xl font-bold mb-2 text-center ${isDarkMode ? 'text-yellow-200' : 'text-yellow-900'}`}
            >
              {t('home:notification.permissionRequired')}
            </Text>
            <Text
              className={`text-base mb-4 text-center leading-5 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-900'}`}
            >
              {t('home:notification.permissionMessage')}
            </Text>
            <TouchableOpacity
              className="bg-warning px-6 py-3 rounded-lg self-center"
              onPress={handleOpenSettings}
            >
              <Text className="text-base font-semibold text-white">
                {t('medication:notification.goToSettings')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dev/test buttons - SECURITY: Only show in development mode */}
        {/* Reference: OWASP - Security Misconfiguration (A05:2021) */}
        {__DEV__ && (
          <View
            className={`rounded-xl p-4 mb-4 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}
          >
            <Text
              className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {t('home:dev.title')}
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
                onPress={handleTestNotification}
              >
                <Text className="text-xs font-semibold text-white">
                  {t('home:dev.testNotification')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-2.5 rounded-lg items-center"
                onPress={handleCheckScheduledNotifications}
              >
                <Text className="text-xs font-semibold text-white">
                  {t('home:dev.checkScheduled')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Refill Alert Banner - show if any medications have low inventory */}
        {allMedications.length > 0 && (
          <RefillAlertBanner
            medications={allMedications}
            variant="parent"
            onPress={handleAddMedication}
          />
        )}

        {/* Medication list - using memoized cards */}
        {scheduledMedications.map((med) => (
          <MedicationCard
            key={med.id}
            medication={med}
            onPress={handleMedicationPress}
            takenText={t('medication:status.taken')}
            pendingText={t('medication:status.pending')}
            accessibilityViewDetails={t('home:accessibility.viewDetails')}
            accessibilityHintText={t('home:accessibility.medicationCardHint')}
          />
        ))}

        {/* Add medication button */}
        <TouchableOpacity
          className="bg-success rounded-2xl py-6 px-8 items-center justify-center min-h-[72px] mt-4 shadow-lg"
          onPress={handleAddMedication}
          accessibilityLabel={t('home:parent.addMedication')}
          accessibilityHint={t('home:accessibility.addMedicationHint')}
          accessibilityRole="button"
        >
          <Text className="text-3xl font-bold text-white">{t('medication:button.add')}</Text>
        </TouchableOpacity>

        {/* View medication history button */}
        <TouchableOpacity
          className="bg-blue-500 rounded-2xl py-6 px-8 items-center justify-center min-h-[72px] mt-4 shadow-lg flex-row"
          onPress={handleViewCalendar}
          accessibilityLabel={t('home:parent.viewHistory')}
          accessibilityHint={t('home:accessibility.viewHistoryHint')}
          accessibilityRole="button"
        >
          <Text className="text-4xl mr-3">&#128197;</Text>
          <Text className="text-3xl font-bold text-white">
            {t('medication:button.viewCalendar')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentHomeScreen;
