/**
 * AppointmentCard - Appointment Card Component
 *
 * Displays appointment information in a card format
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Appointment } from '../../../shared/types/database.types';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

/**
 * Format date to Korean format
 */
const formatDateKorean = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${year}년 ${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Calculate D-day or days passed
 */
const calculateDDay = (dateStr: string): { text: string; isPast: boolean; isToday: boolean } => {
  const appointmentDate = new Date(dateStr);
  const today = new Date();

  // Reset time to midnight for accurate day calculation
  appointmentDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = appointmentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: '오늘', isPast: false, isToday: true };
  } else if (diffDays > 0) {
    return { text: `D-${diffDays}`, isPast: false, isToday: false };
  } else {
    return { text: `${Math.abs(diffDays)}일 전`, isPast: true, isToday: false };
  }
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => {
  const dday = calculateDDay(appointment.appointment_date);

  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 shadow-sm mb-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with icon and D-day */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-2xl">🏥</Text>
          <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
            {appointment.hospital_name}
          </Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded ${
            dday.isToday ? 'bg-error/20' : dday.isPast ? 'bg-gray-200' : 'bg-primary/20'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              dday.isToday ? 'text-error' : dday.isPast ? 'text-gray-500' : 'text-primary'
            }`}
          >
            {dday.text}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-base font-semibold text-gray-900 mb-2">{appointment.title}</Text>

      {/* Date and Time */}
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-sm text-gray-600">📅</Text>
        <Text className="text-sm text-gray-600">
          {formatDateKorean(appointment.appointment_date)}
        </Text>
      </View>

      {/* Notes (if exists) */}
      {appointment.notes && (
        <View className="bg-gray-100 rounded-lg p-2.5 mt-2">
          <Text className="text-sm text-gray-700" numberOfLines={2}>
            {appointment.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default AppointmentCard;
