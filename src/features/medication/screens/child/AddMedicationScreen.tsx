/**
 * AddMedicationScreen - Child's Add Medication Screen
 *
 * Allows child users to add medications for their parent.
 * Uses standard UI (not elderly-friendly large UI).
 */

import React, { useState, useCallback } from 'react';
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
import { ChildStackScreenProps } from '../../../../shared/types/navigation.types';
import { createMedicationForParent, MedicationFormData } from '../../../../shared/services/api';
import TimePickerButton from '../../components/TimePickerButton';

type Props = ChildStackScreenProps<'AddMedication'>;

interface FrequencyOption {
  value: string;
  label: string;
  timesPerDay: number;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily_1', label: '하루 1번', timesPerDay: 1 },
  { value: 'daily_2', label: '하루 2번', timesPerDay: 2 },
  { value: 'daily_3', label: '하루 3번', timesPerDay: 3 },
  { value: 'as_needed', label: '필요시', timesPerDay: 0 },
];

const DEFAULT_TIMES: Record<string, string[]> = {
  daily_1: ['09:00'],
  daily_2: ['09:00', '21:00'],
  daily_3: ['09:00', '14:00', '21:00'],
  as_needed: [],
};

const TIME_LABELS: Record<number, string[]> = {
  1: ['알림 시간'],
  2: ['아침 알림', '저녁 알림'],
  3: ['아침 알림', '점심 알림', '저녁 알림'],
};

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateKorean = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

const AddMedicationScreen = ({ navigation, route }: Props) => {
  const { parentId } = route.params;

  // Form state
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily_1');
  const [reminderTimes, setReminderTimes] = useState<string[]>(DEFAULT_TIMES['daily_1']);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);

  const handleFrequencyChange = useCallback((selectedFrequency: string) => {
    setFrequency(selectedFrequency);
    setReminderTimes(DEFAULT_TIMES[selectedFrequency] || []);
    setShowFrequencyPicker(false);
  }, []);

  const handleTimeChange = useCallback((index: number, time: string) => {
    setReminderTimes((prev) => {
      const newTimes = [...prev];
      newTimes[index] = time;
      return newTimes;
    });
  }, []);

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setStartDate(selectedDate);
      if (endDate && selectedDate > endDate) {
        setEndDate(null);
        setHasEndDate(false);
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      if (selectedDate < startDate) {
        Alert.alert('오류', '종료일은 시작일보다 이후여야 합니다.');
        return;
      }
      setEndDate(selectedDate);
      setHasEndDate(true);
    }
  };

  const handleStartDateConfirm = (): void => {
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (): void => {
    if (endDate && endDate < startDate) {
      Alert.alert('오류', '종료일은 시작일보다 이후여야 합니다.');
      setEndDate(null);
      setHasEndDate(false);
    }
    setShowEndDatePicker(false);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '약 이름을 입력해주세요.');
      return false;
    }
    if (!dosage.trim()) {
      Alert.alert('입력 오류', '복용량을 입력해주세요.');
      return false;
    }
    if (frequency !== 'as_needed' && reminderTimes.length === 0) {
      Alert.alert('입력 오류', '알림 시간을 설정해주세요.');
      return false;
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const formData: MedicationFormData = {
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        reminder_times: reminderTimes,
        start_date: formatDateToString(startDate),
        end_date: hasEndDate && endDate ? formatDateToString(endDate) : undefined,
        notes: notes.trim() || undefined,
      };

      const { medication, notificationIds } = await createMedicationForParent(parentId, formData);

      const notificationMessage =
        notificationIds.length > 0
          ? `${notificationIds.length}개의 알림이 예약되었습니다.`
          : '알림 예약에 실패했습니다.';

      Alert.alert('저장 완료', `${medication.name}이(가) 등록되었습니다.\n${notificationMessage}`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('약 등록 실패:', error);
      Alert.alert('저장 실패', '약 정보를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (name || dosage || notes) {
      Alert.alert('작성 취소', '입력한 내용이 저장되지 않습니다.\n정말 취소하시겠습니까?', [
        { text: '계속 작성', style: 'cancel' },
        { text: '취소', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const selectedFrequencyLabel =
    FREQUENCY_OPTIONS.find((opt) => opt.value === frequency)?.label || '하루 1번';
  const timesPerDay = FREQUENCY_OPTIONS.find((opt) => opt.value === frequency)?.timesPerDay || 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 약 이름 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              약 이름 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              value={name}
              onChangeText={setName}
              placeholder="예: 혈압약, 당뇨약"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
            />
          </View>

          {/* 복용량 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              복용량 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              value={dosage}
              onChangeText={setDosage}
              placeholder="예: 1정, 2알, 5ml"
              placeholderTextColor="#9CA3AF"
              maxLength={20}
            />
          </View>

          {/* 복용 횟수 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              복용 횟수 <Text className="text-error">*</Text>
            </Text>
            <TouchableOpacity
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowFrequencyPicker(true)}
            >
              <Text className="text-base text-gray-900">{selectedFrequencyLabel}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* 알림 시간 */}
          {frequency !== 'as_needed' && timesPerDay > 0 && (
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                알림 시간 <Text className="text-error">*</Text>
              </Text>
              <View className="gap-2">
                {Array.from({ length: timesPerDay }).map((_, index) => (
                  <TimePickerButton
                    key={`time-${index}`}
                    value={reminderTimes[index] || '09:00'}
                    onTimeChange={(time) => handleTimeChange(index, time)}
                    label={TIME_LABELS[timesPerDay]?.[index] || `알림 ${index + 1}`}
                    testID={`time-picker-${index}`}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 시작일 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">시작일</Text>
            <TouchableOpacity
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text className="text-base text-gray-900">{formatDateKorean(startDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* 종료일 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              종료일 <Text className="text-gray-400">(선택)</Text>
            </Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className={`px-4 py-3 rounded-xl border ${
                  hasEndDate ? 'bg-primary-50 border-primary' : 'bg-gray-100 border-gray-300'
                }`}
                onPress={() => {
                  if (hasEndDate) {
                    setHasEndDate(false);
                    setEndDate(null);
                  } else {
                    const defaultEndDate = new Date(startDate);
                    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
                    setEndDate(defaultEndDate);
                    setHasEndDate(true);
                  }
                }}
              >
                <Text
                  className={`text-sm font-semibold ${hasEndDate ? 'text-primary' : 'text-gray-600'}`}
                >
                  {hasEndDate ? '설정됨' : '설정 안함'}
                </Text>
              </TouchableOpacity>

              {hasEndDate && (
                <TouchableOpacity
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className="text-base text-gray-900">
                    {endDate ? formatDateKorean(endDate) : '날짜 선택'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 메모 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              메모 <Text className="text-gray-400">(선택)</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 min-h-[100px]"
              value={notes}
              onChangeText={setNotes}
              placeholder="예: 식후 30분, 물과 함께 복용"
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="flex-row p-4 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-4 items-center justify-center"
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text className="text-base font-semibold text-gray-600">취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-[2] rounded-xl py-4 items-center justify-center ${
              isLoading ? 'bg-gray-400' : 'bg-primary'
            }`}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-base font-semibold text-white">저장</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 복용 횟수 선택 모달 */}
      <Modal
        visible={showFrequencyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl pb-8">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">복용 횟수 선택</Text>
              <TouchableOpacity className="p-2" onPress={() => setShowFrequencyPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row justify-between items-center px-4 py-4 border-b border-gray-100 ${
                  frequency === option.value ? 'bg-primary-50' : ''
                }`}
                onPress={() => handleFrequencyChange(option.value)}
              >
                <Text
                  className={`text-base ${
                    frequency === option.value ? 'font-semibold text-primary' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
                {frequency === option.value && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* DatePicker - Android */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="spinner"
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="spinner"
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

      {/* DatePicker - iOS Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-2xl pb-8">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <TouchableOpacity className="p-2" onPress={() => setShowStartDatePicker(false)}>
                  <Text className="text-base text-gray-600">취소</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">시작일 선택</Text>
                <TouchableOpacity className="p-2" onPress={handleStartDateConfirm}>
                  <Text className="text-base font-semibold text-primary">확인</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-2xl pb-8">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <TouchableOpacity className="p-2" onPress={() => setShowEndDatePicker(false)}>
                  <Text className="text-base text-gray-600">취소</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">종료일 선택</Text>
                <TouchableOpacity className="p-2" onPress={handleEndDateConfirm}>
                  <Text className="text-base font-semibold text-primary">확인</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                minimumDate={startDate}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default AddMedicationScreen;
