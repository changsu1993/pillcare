/**
 * AppointmentListScreen - Appointment List for Child
 *
 * Displays parent's hospital appointments
 *
 * Features:
 * - List of upcoming and past appointments
 * - Pull-to-refresh
 * - Add appointment FAB button
 * - Navigate to detail/edit screens
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getConnectedParent, getParentAppointments } from '../../../../shared/services/api';
import { User, Appointment } from '../../../../shared/types/database.types';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';
import AppointmentCard from '../../components/AppointmentCard';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;

const AppointmentListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [parentInfo, setParentInfo] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load data
   */
  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const parent = await getConnectedParent();
      setParentInfo(parent);

      if (parent) {
        const appts = await getParentAppointments(parent.id);
        setAppointments(appts);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  /**
   * Pull to refresh
   */
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Handle add appointment
   */
  const handleAddAppointment = (): void => {
    if (!parentInfo) {
      Alert.alert('오류', '부모님 연결이 필요합니다.');
      return;
    }
    navigation.navigate('AddAppointment', { parentId: parentInfo.id });
  };

  /**
   * Handle appointment card press
   */
  const handleAppointmentPress = (appointment: Appointment): void => {
    navigation.navigate('AppointmentDetail', { appointmentId: appointment.id });
  };

  /**
   * Separate upcoming and past appointments
   */
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.appointment_date) >= now
  );
  const pastAppointments = appointments.filter((appt) => new Date(appt.appointment_date) < now);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-base text-gray-500 mt-3">불러오는 중...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-base text-error text-center mt-3 mb-4">{error}</Text>
        <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg" onPress={loadData}>
          <Text className="text-base font-semibold text-white">다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No parent connected
  if (!parentInfo) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">부모님을 연결해주세요</Text>
          <Text className="text-sm text-gray-500 text-center leading-5">
            부모님의 병원 예약을 관리하려면{'\n'}먼저 가족 연결을 해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-20"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Header Info */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {parentInfo.name}님의 병원 예약
          </Text>
          <Text className="text-sm text-gray-500">
            총 {appointments.length}개의 예약이 등록되어 있습니다
          </Text>
        </View>

        {/* Empty State */}
        {appointments.length === 0 ? (
          <View className="bg-white rounded-xl p-10 items-center">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-semibold text-gray-900 mt-4 mb-2">
              등록된 예약이 없습니다
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              부모님의 병원 예약을 등록해주세요
            </Text>
          </View>
        ) : (
          <>
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="time-outline" size={20} color="#3B82F6" />
                  <Text className="text-base font-bold text-gray-900 ml-2">
                    다가오는 예약 ({upcomingAppointments.length})
                  </Text>
                </View>
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => handleAppointmentPress(appointment)}
                  />
                ))}
              </View>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="checkmark-circle-outline" size={20} color="#9CA3AF" />
                  <Text className="text-base font-bold text-gray-900 ml-2">
                    지난 예약 ({pastAppointments.length})
                  </Text>
                </View>
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => handleAppointmentPress(appointment)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Appointment FAB */}
      <TouchableOpacity
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-lg"
        onPress={handleAddAppointment}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AppointmentListScreen;
