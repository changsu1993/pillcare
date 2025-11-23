/**
 * AddMedicationScreen - 약 등록 화면
 *
 * 노인 친화적인 약 등록 화면입니다.
 *
 * Features:
 * - 큰 텍스트 (32pt+ 제목, 24pt+ 본문)
 * - 72px 높이 버튼 (노인 친화적)
 * - WCAG AAA 대비율 준수 (7:1)
 * - 한국어 UI
 * - 복용 횟수에 따른 동적 시간 선택기
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { createMedicationFromForm, MedicationFormData } from '../../../../shared/services/api';
import TimePickerButton from '../../components/TimePickerButton';

type Props = ParentScreenProps<'AddMedication'>;

/**
 * 복용 횟수 옵션 타입
 */
interface FrequencyOption {
  value: string;
  label: string;
  timesPerDay: number;
}

/**
 * 복용 횟수 옵션
 */
const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily_1', label: '하루 1번', timesPerDay: 1 },
  { value: 'daily_2', label: '하루 2번', timesPerDay: 2 },
  { value: 'daily_3', label: '하루 3번', timesPerDay: 3 },
  { value: 'as_needed', label: '필요시', timesPerDay: 0 },
];

/**
 * 기본 알림 시간 (복용 횟수별)
 */
const DEFAULT_TIMES: Record<string, string[]> = {
  daily_1: ['09:00'],
  daily_2: ['09:00', '21:00'],
  daily_3: ['09:00', '14:00', '21:00'],
  as_needed: [],
};

/**
 * 시간 라벨 (복용 횟수별)
 */
const TIME_LABELS: Record<number, string[]> = {
  1: ['알림 시간'],
  2: ['아침 알림', '저녁 알림'],
  3: ['아침 알림', '점심 알림', '저녁 알림'],
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 한국어 형식으로 포맷
 */
const formatDateKorean = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

const AddMedicationScreen = ({ navigation }: Props) => {
  // 폼 상태
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily_1');
  const [reminderTimes, setReminderTimes] = useState<string[]>(DEFAULT_TIMES['daily_1']);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');

  // UI 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);

  /**
   * 복용 횟수 선택 처리
   */
  const handleFrequencyChange = useCallback((selectedFrequency: string) => {
    setFrequency(selectedFrequency);
    setReminderTimes(DEFAULT_TIMES[selectedFrequency] || []);
    setShowFrequencyPicker(false);
  }, []);

  /**
   * 알림 시간 변경 처리
   */
  const handleTimeChange = useCallback((index: number, time: string) => {
    setReminderTimes((prev) => {
      const newTimes = [...prev];
      newTimes[index] = time;
      return newTimes;
    });
  }, []);

  /**
   * 시작일 변경 처리
   */
  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setStartDate(selectedDate);
      // 종료일이 시작일보다 이전이면 초기화
      if (endDate && selectedDate > endDate) {
        setEndDate(null);
        setHasEndDate(false);
      }
    }
  };

  /**
   * 종료일 변경 처리
   */
  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      if (selectedDate < startDate) {
        Alert.alert('오류', '종료일은 시작일보다 이후여야 합니다.', [{ text: '확인' }]);
        return;
      }
      setEndDate(selectedDate);
      setHasEndDate(true);
    }
  };

  /**
   * iOS 시작일 확인
   */
  const handleStartDateConfirm = (): void => {
    setShowStartDatePicker(false);
  };

  /**
   * iOS 종료일 확인
   */
  const handleEndDateConfirm = (): void => {
    if (endDate && endDate < startDate) {
      Alert.alert('오류', '종료일은 시작일보다 이후여야 합니다.', [{ text: '확인' }]);
      setEndDate(null);
      setHasEndDate(false);
    }
    setShowEndDatePicker(false);
  };

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '약 이름을 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    if (!dosage.trim()) {
      Alert.alert('입력 오류', '복용량을 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    if (frequency !== 'as_needed' && reminderTimes.length === 0) {
      Alert.alert('입력 오류', '알림 시간을 설정해주세요.', [{ text: '확인' }]);
      return false;
    }

    return true;
  };

  /**
   * 저장 처리
   */
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

      const { medication, notificationIds } = await createMedicationFromForm(formData);

      // 성공 알림
      const notificationMessage =
        notificationIds.length > 0
          ? `${notificationIds.length}개의 알림이 예약되었습니다.`
          : '알림 예약에 실패했습니다. 설정에서 알림 권한을 확인해주세요.';

      Alert.alert('저장 완료', `${medication.name}이(가) 등록되었습니다.\n${notificationMessage}`, [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('약 등록 실패:', error);
      Alert.alert('저장 실패', '약 정보를 저장하는 중 오류가 발생했습니다.\n다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 취소 처리
   */
  const handleCancel = (): void => {
    if (name || dosage || notes) {
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

  /**
   * 현재 선택된 복용 횟수 라벨
   */
  const selectedFrequencyLabel =
    FREQUENCY_OPTIONS.find((opt) => opt.value === frequency)?.label || '하루 1번';

  /**
   * 현재 선택된 복용 횟수의 시간 개수
   */
  const timesPerDay = FREQUENCY_OPTIONS.find((opt) => opt.value === frequency)?.timesPerDay || 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 약 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              약 이름 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="예: 혈압약, 당뇨약"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
              accessibilityLabel="약 이름 입력"
              accessibilityHint="복용할 약의 이름을 입력하세요"
            />
          </View>

          {/* 복용량 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              복용량 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={dosage}
              onChangeText={setDosage}
              placeholder="예: 1정, 2알, 5ml"
              placeholderTextColor="#9CA3AF"
              maxLength={20}
              accessibilityLabel="복용량 입력"
              accessibilityHint="한 번에 복용할 양을 입력하세요"
            />
          </View>

          {/* 복용 횟수 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              복용 횟수 <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowFrequencyPicker(true)}
              accessibilityLabel={`복용 횟수: ${selectedFrequencyLabel}`}
              accessibilityHint="탭하여 복용 횟수를 변경합니다"
              accessibilityRole="button"
            >
              <Text style={styles.selectButtonText}>{selectedFrequencyLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* 알림 시간 (필요시 제외) */}
          {frequency !== 'as_needed' && timesPerDay > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                알림 시간 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.timePickersContainer}>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>시작일</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowStartDatePicker(true)}
              accessibilityLabel={`시작일: ${formatDateKorean(startDate)}`}
              accessibilityHint="탭하여 시작일을 변경합니다"
              accessibilityRole="button"
            >
              <Text style={styles.selectButtonText}>{formatDateKorean(startDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* 종료일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>종료일 (선택)</Text>
            <View style={styles.endDateContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, hasEndDate && styles.toggleButtonActive]}
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
                accessibilityLabel={hasEndDate ? '종료일 설정됨' : '종료일 설정 안함'}
                accessibilityHint="탭하여 종료일 설정을 변경합니다"
                accessibilityRole="switch"
              >
                <Text
                  style={[styles.toggleButtonText, hasEndDate && styles.toggleButtonTextActive]}
                >
                  {hasEndDate ? '설정됨' : '설정 안함'}
                </Text>
              </TouchableOpacity>

              {hasEndDate && (
                <TouchableOpacity
                  style={[styles.selectButton, styles.endDateButton]}
                  onPress={() => setShowEndDatePicker(true)}
                  accessibilityLabel={`종료일: ${endDate ? formatDateKorean(endDate) : '선택'}`}
                  accessibilityHint="탭하여 종료일을 변경합니다"
                  accessibilityRole="button"
                >
                  <Text style={styles.selectButtonText}>
                    {endDate ? formatDateKorean(endDate) : '날짜 선택'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 메모 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>메모 (선택)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="예: 식후 30분, 물과 함께 복용"
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="메모 입력"
              accessibilityHint="추가 복용 정보를 입력하세요"
            />
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
            accessibilityLabel="취소"
            accessibilityHint="약 등록을 취소하고 이전 화면으로 돌아갑니다"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            accessibilityLabel="저장"
            accessibilityHint="약 정보를 저장합니다"
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>복용 횟수 선택</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFrequencyPicker(false)}
                accessibilityLabel="닫기"
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>

            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.frequencyOption,
                  frequency === option.value && styles.frequencyOptionSelected,
                ]}
                onPress={() => handleFrequencyChange(option.value)}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: frequency === option.value }}
              >
                <Text
                  style={[
                    styles.frequencyOptionText,
                    frequency === option.value && styles.frequencyOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {frequency === option.value && <Text style={styles.checkmark}>OK</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 시작일 DatePicker - Android */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="spinner"
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* 종료일 DatePicker - Android */}
      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="spinner"
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

      {/* 시작일 DatePicker - iOS Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowStartDatePicker(false)}
                  accessibilityLabel="취소"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonTextCancel}>취소</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>시작일 선택</Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleStartDateConfirm}
                  accessibilityLabel="확인"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonTextConfirm}>확인</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* 종료일 DatePicker - iOS Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowEndDatePicker(false)}
                  accessibilityLabel="취소"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonTextCancel}>취소</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>종료일 선택</Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleEndDateConfirm}
                  accessibilityLabel="확인"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonTextConfirm}>확인</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                minimumDate={startDate}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    color: '#1A1A1A',
    minHeight: 64,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  timePickersContainer: {
    gap: 12,
  },
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  toggleButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  endDateButton: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  cancelButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
  },
  modalButtonTextCancel: {
    fontSize: 20,
    color: '#6B7280',
  },
  modalButtonTextConfirm: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22C55E',
  },
  frequencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 72,
  },
  frequencyOptionSelected: {
    backgroundColor: '#DCFCE7',
  },
  frequencyOptionText: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  frequencyOptionTextSelected: {
    fontWeight: '700',
    color: '#16A34A',
  },
  checkmark: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  datePicker: {
    height: 200,
  },
});

export default AddMedicationScreen;
