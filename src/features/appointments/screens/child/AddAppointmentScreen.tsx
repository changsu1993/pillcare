/**
 * AddAppointmentScreen - Add Appointment for Parent
 *
 * Allows child to add hospital appointments for parent
 *
 * Features:
 * - Hospital name input
 * - Appointment title input
 * - Date and time picker
 * - Notes input
 * - Elderly-friendly large UI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createAppointmentForParent } from '../../../../shared/services/api';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;
type RouteProps = RouteProp<ChildStackParamList, 'AddAppointment'>;

/**
 * Format date to Korean format
 */
const formatDateKorean = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * Format time to HH:mm
 */
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const AddAppointmentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { parentId } = route.params;

  // Form state
  const [hospitalName, setHospitalName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  /**
   * Handle date change
   */
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  /**
   * Handle time change
   */
  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date): void => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      const newDate = new Date(appointmentDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setAppointmentDate(newDate);
    }
  };

  /**
   * iOS date confirm
   */
  const handleDateConfirm = (): void => {
    setShowDatePicker(false);
  };

  /**
   * iOS time confirm
   */
  const handleTimeConfirm = (): void => {
    setShowTimePicker(false);
  };

  /**
   * Form validation
   */
  const validateForm = (): boolean => {
    if (!hospitalName.trim()) {
      Alert.alert('입력 오류', '병원 이름을 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    if (!title.trim()) {
      Alert.alert('입력 오류', '예약 제목을 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    return true;
  };

  /**
   * Handle save
   */
  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      await createAppointmentForParent(parentId, {
        hospital_name: hospitalName.trim(),
        title: title.trim(),
        appointment_date: appointmentDate.toISOString(),
        notes: notes.trim() || undefined,
      });

      Alert.alert('저장 완료', '병원 예약이 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('저장 실패', '예약 정보를 저장하는 중 오류가 발생했습니다.\n다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = (): void => {
    if (hospitalName || title || notes) {
      Alert.alert('작성 취소', '입력한 내용이 저장되지 않습니다.\n정말 취소하시겠습니까?', [
        { text: '계속 작성', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Hospital Name */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              병원 이름 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-2xl text-gray-900 min-h-[64px]"
              value={hospitalName}
              onChangeText={setHospitalName}
              placeholder="예: 서울대학교병원"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
            />
          </View>

          {/* Appointment Title */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              예약 제목 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-2xl text-gray-900 min-h-[64px]"
              value={title}
              onChangeText={setTitle}
              placeholder="예: 정형외과 진료"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
            />
          </View>

          {/* Date */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">예약 날짜</Text>
            <TouchableOpacity
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 min-h-[64px] justify-center"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-2xl text-gray-900">{formatDateKorean(appointmentDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">예약 시간</Text>
            <TouchableOpacity
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 min-h-[64px] justify-center"
              onPress={() => setShowTimePicker(true)}
            >
              <Text className="text-2xl text-gray-900">{formatTime(appointmentDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">메모 (선택)</Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-2xl text-gray-900 min-h-[120px]"
              value={notes}
              onChangeText={setNotes}
              placeholder="예: 진료과, 준비물 등"
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View className="flex-row p-5 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-5 items-center justify-center min-h-[72px]"
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text className="text-2xl font-bold text-gray-600">취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-[2] rounded-xl py-5 items-center justify-center min-h-[72px] ${
              isLoading ? 'bg-gray-400' : 'bg-success'
            }`}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-2xl font-bold text-white">저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker - Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={appointmentDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker - Android */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={appointmentDate}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      {/* Date Picker - iOS Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl pb-8">
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="text-xl text-gray-600">취소</Text>
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-gray-900">날짜 선택</Text>

                <TouchableOpacity className="px-4 py-2 min-w-[60px]" onPress={handleDateConfirm}>
                  <Text className="text-xl font-semibold text-success">확인</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={appointmentDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                className="h-[200px]"
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker - iOS Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl pb-8">
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text className="text-xl text-gray-600">취소</Text>
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-gray-900">시간 선택</Text>

                <TouchableOpacity className="px-4 py-2 min-w-[60px]" onPress={handleTimeConfirm}>
                  <Text className="text-xl font-semibold text-success">확인</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={appointmentDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                className="h-[200px]"
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default AddAppointmentScreen;
