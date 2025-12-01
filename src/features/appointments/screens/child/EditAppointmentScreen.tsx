/**
 * EditAppointmentScreen - Edit Appointment
 *
 * Allows child to edit hospital appointments for parent
 *
 * Features:
 * - Load existing appointment data
 * - Update hospital name, title, date/time, notes
 * - Delete button
 * - Elderly-friendly large UI
 */

import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from '../../../../shared/services/api';
import { Appointment } from '../../../../shared/types/database.types';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;
type RouteProps = RouteProp<ChildStackParamList, 'EditAppointment'>;

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

const EditAppointmentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { appointmentId } = route.params;

  // Form state
  const [hospitalName, setHospitalName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load appointment data
   */
  useEffect(() => {
    const loadAppointment = async () => {
      try {
        setError(null);
        const data = await getAppointment(appointmentId);

        setHospitalName(data.hospital_name);
        setTitle(data.title);
        setAppointmentDate(new Date(data.appointment_date));
        setNotes(data.notes || '');
      } catch (err) {
        console.error('Error loading appointment:', err);
        setError('예약 정보를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId]);

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
      setIsSaving(true);

      await updateAppointment(appointmentId, {
        hospital_name: hospitalName.trim(),
        title: title.trim(),
        appointment_date: appointmentDate.toISOString(),
        notes: notes.trim() || undefined,
      });

      Alert.alert('저장 완료', '예약 정보가 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('저장 실패', '예약 정보를 수정하는 중 오류가 발생했습니다.\n다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = (): void => {
    Alert.alert('예약 삭제', `'${title}'을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(appointmentId);
            Alert.alert('완료', '예약이 삭제되었습니다.', [
              {
                text: '확인',
                onPress: () => {
                  // Navigate back to list (go back twice)
                  navigation.goBack();
                  navigation.goBack();
                },
              },
            ]);
          } catch (err) {
            console.error('Error deleting appointment:', err);
            Alert.alert('오류', '예약 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  /**
   * Handle cancel
   */
  const handleCancel = (): void => {
    navigation.goBack();
  };

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
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-base text-error text-center mt-3 mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-lg"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-base font-semibold text-white">돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
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

          {/* Delete Button */}
          <TouchableOpacity
            className="bg-error/10 rounded-xl py-4 items-center justify-center mb-4"
            onPress={handleDelete}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="text-base font-semibold text-error">예약 삭제</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Buttons */}
        <View className="flex-row p-5 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-5 items-center justify-center min-h-[72px]"
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text className="text-2xl font-bold text-gray-600">취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-[2] rounded-xl py-5 items-center justify-center min-h-[72px] ${
              isSaving ? 'bg-gray-400' : 'bg-success'
            }`}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
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
                style={{ height: 200 }}
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
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default EditAppointmentScreen;
