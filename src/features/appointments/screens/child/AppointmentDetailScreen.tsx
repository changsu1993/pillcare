/**
 * AppointmentDetailScreen - Appointment Detail View
 *
 * Displays detailed appointment information
 *
 * Features:
 * - View appointment details
 * - Edit button
 * - Delete button with confirmation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { getAppointment, deleteAppointment } from '../../../../shared/services/api';
import { Appointment } from '../../../../shared/types/database.types';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;
type RouteProps = RouteProp<ChildStackParamList, 'AppointmentDetail'>;

const AppointmentDetailScreen = () => {
  const { t } = useTranslation(['appointments', 'common']);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { appointmentId } = route.params;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Format date to localized format with time
   */
  const formatDateTimeLocalized = (dateStr: string): string => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const weekday = t(`appointments:dateFormat.weekdays.${weekdayKeys[date.getDay()]}`);

    return t('appointments:dateFormat.full', {
      year,
      month,
      day,
      weekday,
      time: `${hours}:${minutes}`,
    });
  };

  /**
   * Calculate D-day
   */
  const calculateDDay = (dateStr: string): { text: string; isPast: boolean; isToday: boolean } => {
    const appointmentDate = new Date(dateStr);
    const today = new Date();

    appointmentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: t('appointments:dday.today'), isPast: false, isToday: true };
    } else if (diffDays > 0) {
      return {
        text: t('appointments:dday.dMinus', { days: diffDays }),
        isPast: false,
        isToday: false,
      };
    } else {
      return {
        text: t('appointments:dday.daysAgo', { days: Math.abs(diffDays) }),
        isPast: true,
        isToday: false,
      };
    }
  };

  /**
   * Load appointment data
   */
  useEffect(() => {
    const loadAppointment = async () => {
      try {
        setError(null);
        const data = await getAppointment(appointmentId);
        setAppointment(data);
      } catch (err) {
        console.error('Error loading appointment:', err);
        setError(t('appointments:error.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, t]);

  /**
   * Handle edit
   */
  const handleEdit = (): void => {
    if (!appointment) return;
    navigation.navigate('EditAppointment', { appointmentId: appointment.id });
  };

  /**
   * Handle delete
   */
  const handleDelete = (): void => {
    if (!appointment) return;

    Alert.alert(
      t('appointments:delete.title'),
      t('appointments:delete.confirm', { title: appointment.title }),
      [
        { text: t('common:button.cancel'), style: 'cancel' },
        {
          text: t('appointments:action.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(appointment.id);
              Alert.alert(t('appointments:delete.successTitle'), t('appointments:delete.success'), [
                {
                  text: t('common:button.confirm'),
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err) {
              console.error('Error deleting appointment:', err);
              Alert.alert(t('appointments:delete.errorTitle'), t('appointments:delete.error'));
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-base text-gray-500 mt-3">{t('common:loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error || !appointment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-base text-error text-center mt-3 mb-4">
            {error || t('appointments:error.notFound')}
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-lg"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-base font-semibold text-white">
              {t('appointments:action.goBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dday = calculateDDay(appointment.appointment_date);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* D-Day Badge */}
        <View className="items-center mb-6">
          <View
            className={`px-6 py-3 rounded-full ${
              dday.isToday ? 'bg-error/20' : dday.isPast ? 'bg-gray-200' : 'bg-primary/20'
            }`}
          >
            <Text
              className={`text-2xl font-bold ${
                dday.isToday ? 'text-error' : dday.isPast ? 'text-gray-500' : 'text-primary'
              }`}
            >
              {dday.text}
            </Text>
          </View>
        </View>

        {/* Hospital Name */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-3xl mr-3">🏥</Text>
            <Text className="text-sm text-gray-500">{t('appointments:detail.hospital')}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">{appointment.hospital_name}</Text>
        </View>

        {/* Title */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="document-text-outline" size={24} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-2">{t('appointments:detail.content')}</Text>
          </View>
          <Text className="text-xl font-semibold text-gray-900">{appointment.title}</Text>
        </View>

        {/* Date and Time */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={24} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-2">{t('appointments:detail.dateTime')}</Text>
          </View>
          <Text className="text-xl font-semibold text-gray-900">
            {formatDateTimeLocalized(appointment.appointment_date)}
          </Text>
        </View>

        {/* Notes */}
        {appointment.notes && (
          <View className="bg-white rounded-xl p-6 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">{t('appointments:detail.notes')}</Text>
            </View>
            <Text className="text-base text-gray-700 leading-6">{appointment.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-xl py-4 items-center justify-center"
            onPress={handleEdit}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white">
                {t('appointments:action.edit')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-error rounded-xl py-4 items-center justify-center"
            onPress={handleDelete}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white">
                {t('appointments:action.delete')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AppointmentDetailScreen;
