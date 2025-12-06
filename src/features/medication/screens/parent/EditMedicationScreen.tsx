/**
 * EditMedicationScreen - 약 수정 화면
 *
 * 노인 친화적인 약 수정 화면입니다.
 *
 * Features:
 * - 큰 텍스트 (32pt+ 제목, 24pt+ 본문)
 * - 72px 높이 버튼 (노인 친화적)
 * - WCAG AAA 대비율 준수 (7:1)
 * - 한국어 UI
 * - 복용 횟수에 따른 동적 시간 선택기
 * - 기존 약 정보 불러오기
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import {
  getMedication,
  updateMedicationWithNotifications,
  MedicationFormData,
} from '../../../../shared/services/api';
import TimePickerButton from '../../components/TimePickerButton';
import QuantityInput from '../../components/QuantityInput';
import type { FrequencyLabelKey, TimeLabelKey } from '../../../../i18n/types';

type Props = ParentScreenProps<'EditMedication'>;

/**
 * 복용 횟수 옵션 타입
 */
interface FrequencyOption {
  value: string;
  labelKey: FrequencyLabelKey;
  timesPerDay: number;
}

/**
 * 복용 횟수 옵션
 */
const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily_1', labelKey: 'frequency.daily1', timesPerDay: 1 },
  { value: 'daily_2', labelKey: 'frequency.daily2', timesPerDay: 2 },
  { value: 'daily_3', labelKey: 'frequency.daily3', timesPerDay: 3 },
  { value: 'as_needed', labelKey: 'frequency.asNeeded', timesPerDay: 0 },
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
 * 시간 라벨 키 (복용 횟수별)
 */
const TIME_LABEL_KEYS: Record<number, TimeLabelKey[]> = {
  1: ['timeLabel.single'],
  2: ['timeLabel.morning', 'timeLabel.evening'],
  3: ['timeLabel.morning', 'timeLabel.lunch', 'timeLabel.evening'],
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

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 */
const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EditMedicationScreen = ({ navigation, route }: Props) => {
  const { medicationId } = route.params;
  const { t } = useTranslation(['medication', 'common']);

  // 로딩 상태
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 폼 상태
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily_1');
  const [reminderTimes, setReminderTimes] = useState<string[]>(DEFAULT_TIMES['daily_1']);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');

  // 재고 관리 상태
  const [trackQuantity, setTrackQuantity] = useState<boolean>(false);
  const [remainingQuantity, setRemainingQuantity] = useState<number | null>(null);
  const [quantityPerDose, setQuantityPerDose] = useState<number>(1);

  // UI 상태
  const [showFrequencyPicker, setShowFrequencyPicker] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);

  // 원본 데이터 (변경 감지용)
  const [originalData, setOriginalData] = useState<MedicationFormData | null>(null);

  /**
   * 기존 약 정보 불러오기
   */
  useEffect(() => {
    const loadMedication = async () => {
      try {
        setIsInitialLoading(true);
        const medication = await getMedication(medicationId);

        // 폼에 데이터 채우기
        setName(medication.name);
        setDosage(medication.dosage);
        setFrequency(medication.frequency);
        setReminderTimes(medication.reminder_times);
        setStartDate(parseDate(medication.start_date));
        if (medication.end_date) {
          setEndDate(parseDate(medication.end_date));
          setHasEndDate(true);
        }
        setNotes(medication.notes || '');

        // 재고 관리 데이터
        const hasInventory =
          medication.remaining_quantity !== null && medication.remaining_quantity !== undefined;
        setTrackQuantity(hasInventory);
        setRemainingQuantity(medication.remaining_quantity ?? null);
        setQuantityPerDose(medication.quantity_per_dose ?? 1);

        // 원본 데이터 저장
        setOriginalData({
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          reminder_times: medication.reminder_times,
          start_date: medication.start_date,
          end_date: medication.end_date,
          notes: medication.notes,
          remaining_quantity: medication.remaining_quantity,
          quantity_per_dose: medication.quantity_per_dose,
          refill_threshold: medication.refill_threshold,
          auto_decrement: medication.auto_decrement,
        });
      } catch (error) {
        console.error('약 정보 불러오기 실패:', error);
        Alert.alert(t('alert.loadError'), t('alert.loadMedicationError'), [
          { text: t('common:button.confirm'), onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadMedication();
  }, [medicationId, navigation, t]);

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
        Alert.alert(t('alert.loadError'), t('alert.endDateError'), [
          { text: t('common:button.confirm') },
        ]);
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
      Alert.alert(t('alert.loadError'), t('alert.endDateError'), [
        { text: t('common:button.confirm') },
      ]);
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
      Alert.alert(t('alert.inputError'), t('alert.nameRequired'), [
        { text: t('common:button.confirm') },
      ]);
      return false;
    }

    if (!dosage.trim()) {
      Alert.alert(t('alert.inputError'), t('alert.dosageRequired'), [
        { text: t('common:button.confirm') },
      ]);
      return false;
    }

    if (frequency !== 'as_needed' && reminderTimes.length === 0) {
      Alert.alert(t('alert.inputError'), t('alert.reminderTimeRequired'), [
        { text: t('common:button.confirm') },
      ]);
      return false;
    }

    return true;
  };

  /**
   * 변경사항 확인
   */
  const hasChanges = (): boolean => {
    if (!originalData) return false;

    return (
      name.trim() !== originalData.name ||
      dosage.trim() !== originalData.dosage ||
      frequency !== originalData.frequency ||
      JSON.stringify(reminderTimes) !== JSON.stringify(originalData.reminder_times) ||
      formatDateToString(startDate) !== originalData.start_date ||
      (hasEndDate && endDate ? formatDateToString(endDate) : undefined) !== originalData.end_date ||
      (notes.trim() || undefined) !== originalData.notes
    );
  };

  /**
   * 저장 처리
   */
  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const formData: Partial<MedicationFormData> = {
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        reminder_times: reminderTimes,
        start_date: formatDateToString(startDate),
        end_date: hasEndDate && endDate ? formatDateToString(endDate) : undefined,
        notes: notes.trim() || undefined,
        // Inventory tracking fields
        remaining_quantity: trackQuantity ? remainingQuantity : null,
        quantity_per_dose: trackQuantity ? quantityPerDose : 1,
        refill_threshold: originalData?.refill_threshold ?? 7,
        auto_decrement: originalData?.auto_decrement ?? true,
      };

      const { notificationIds } = await updateMedicationWithNotifications(medicationId, formData);

      // 성공 알림
      const notificationMessage =
        notificationIds.length > 0
          ? t('alert.notificationRescheduled', { count: notificationIds.length })
          : t('alert.notificationFailed');

      Alert.alert(
        t('alert.editComplete'),
        t('alert.editSuccess', { notification: notificationMessage }),
        [
          {
            text: t('common:button.confirm'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('약 수정 실패:', error);
      Alert.alert(t('alert.editFailed'), t('alert.editError'), [
        { text: t('common:button.confirm') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 취소 처리
   */
  const handleCancel = (): void => {
    if (hasChanges()) {
      Alert.alert(t('alert.editCancelTitle'), t('alert.editCancelMessage'), [
        { text: t('alert.continueEditing'), style: 'cancel' },
        {
          text: t('common:button.cancel'),
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
  const selectedFrequencyOption = FREQUENCY_OPTIONS.find((opt) => opt.value === frequency);
  const selectedFrequencyLabel = selectedFrequencyOption
    ? t(selectedFrequencyOption.labelKey)
    : t('frequency.daily1');

  /**
   * 현재 선택된 복용 횟수의 시간 개수
   */
  const timesPerDay = selectedFrequencyOption?.timesPerDay || 0;

  /**
   * 시간 라벨 가져오기
   */
  const getTimeLabel = (index: number): string => {
    const labelKeys = TIME_LABEL_KEYS[timesPerDay];
    if (labelKeys && labelKeys[index]) {
      return t(labelKeys[index]);
    }
    return t('timeLabel.reminder', { index: index + 1 });
  };

  // 초기 로딩 중
  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">{t('message.loadingMedication')}</Text>
      </View>
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
          {/* 약 이름 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {t('label.name')} <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-2xl text-gray-900 min-h-[64px]"
              value={name}
              onChangeText={setName}
              placeholder={t('placeholder.nameExample')}
              placeholderTextColor="#9CA3AF"
              maxLength={50}
              accessibilityLabel={t('accessibility.nameInput')}
              accessibilityHint={t('accessibility.nameHint')}
            />
          </View>

          {/* 복용량 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {t('label.dosage')} <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-2xl text-gray-900 min-h-[64px]"
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('placeholder.dosageExample')}
              placeholderTextColor="#9CA3AF"
              maxLength={20}
              accessibilityLabel={t('accessibility.dosageInput')}
              accessibilityHint={t('accessibility.dosageHint')}
            />
          </View>

          {/* 복용 횟수 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {t('label.frequency')} <Text className="text-error">*</Text>
            </Text>
            <TouchableOpacity
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 min-h-[64px] justify-center"
              onPress={() => setShowFrequencyPicker(true)}
              accessibilityLabel={t('accessibility.frequencyLabel', {
                label: selectedFrequencyLabel,
              })}
              accessibilityHint={t('accessibility.frequencyHint')}
              accessibilityRole="button"
            >
              <Text className="text-2xl text-gray-900">{selectedFrequencyLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* 알림 시간 (필요시 제외) */}
          {frequency !== 'as_needed' && timesPerDay > 0 && (
            <View className="mb-6">
              <Text className="text-2xl font-bold text-gray-900 mb-3">
                {t('label.reminderTime')} <Text className="text-error">*</Text>
              </Text>
              <View className="gap-3">
                {Array.from({ length: timesPerDay }).map((_, index) => (
                  <TimePickerButton
                    key={`time-${index}`}
                    value={reminderTimes[index] || '09:00'}
                    onTimeChange={(time) => handleTimeChange(index, time)}
                    label={getTimeLabel(index)}
                    testID={`time-picker-${index}`}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 시작일 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">{t('label.startDate')}</Text>
            <TouchableOpacity
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 min-h-[64px] justify-center"
              onPress={() => setShowStartDatePicker(true)}
              accessibilityLabel={t('accessibility.startDateLabel', {
                date: formatDateKorean(startDate),
              })}
              accessibilityHint={t('accessibility.startDateHint')}
              accessibilityRole="button"
            >
              <Text className="text-2xl text-gray-900">{formatDateKorean(startDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* 종료일 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {t('label.endDateOptional')}
            </Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className={`border-2 rounded-xl px-5 py-4 min-h-[64px] justify-center ${
                  hasEndDate ? 'bg-green-100 border-success' : 'bg-gray-100 border-gray-300'
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
                accessibilityLabel={
                  hasEndDate ? t('accessibility.endDateSet') : t('accessibility.endDateNotSet')
                }
                accessibilityHint={t('accessibility.endDateToggleHint')}
                accessibilityRole="switch"
              >
                <Text
                  className={`text-xl ${
                    hasEndDate ? 'text-green-700 font-semibold' : 'text-gray-600'
                  }`}
                >
                  {hasEndDate ? t('status.set') : t('status.notSet')}
                </Text>
              </TouchableOpacity>

              {hasEndDate && (
                <TouchableOpacity
                  className="flex-1 bg-white border-2 border-gray-300 rounded-xl px-5 py-4 min-h-[64px] justify-center"
                  onPress={() => setShowEndDatePicker(true)}
                  accessibilityLabel={t('accessibility.endDateLabel', {
                    date: endDate ? formatDateKorean(endDate) : t('placeholder.selectDate'),
                  })}
                  accessibilityHint={t('accessibility.endDateHint')}
                  accessibilityRole="button"
                >
                  <Text className="text-2xl text-gray-900">
                    {endDate ? formatDateKorean(endDate) : t('placeholder.selectDate')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 메모 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {t('label.notesOptional')}
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-2xl text-gray-900 min-h-[120px]"
              value={notes}
              onChangeText={setNotes}
              placeholder={t('placeholder.notesExample')}
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel={t('accessibility.notesInput')}
              accessibilityHint={t('accessibility.notesHint')}
            />
          </View>

          {/* 재고 관리 (선택) */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold text-gray-900">
                {t('label.inventoryTracking')}
              </Text>
              <Switch
                value={trackQuantity}
                onValueChange={(value) => {
                  setTrackQuantity(value);
                  if (value && remainingQuantity === null) {
                    setRemainingQuantity(30); // Default starting quantity
                  }
                }}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={trackQuantity ? '#22C55E' : '#9CA3AF'}
                accessibilityLabel={t('accessibility.inventoryToggle')}
                accessibilityRole="switch"
              />
            </View>

            {trackQuantity && (
              <View className="bg-white border-2 border-gray-300 rounded-xl p-5 gap-5">
                {/* 남은 약 수량 */}
                <QuantityInput
                  value={remainingQuantity}
                  onValueChange={setRemainingQuantity}
                  variant="parent"
                  label={t('label.remainingQuantity')}
                  min={0}
                  max={9999}
                  step={10}
                  allowNull={false}
                />

                {/* 1회 복용량 */}
                <View className="mt-4">
                  <Text className="text-xl font-semibold text-gray-700 mb-2">
                    {t('label.quantityPerDose')}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    {[1, 2, 3].map((qty) => (
                      <TouchableOpacity
                        key={qty}
                        className={`flex-1 py-4 rounded-xl items-center justify-center min-h-[64px] ${
                          quantityPerDose === qty
                            ? 'bg-success border-2 border-success'
                            : 'bg-gray-100 border-2 border-gray-300'
                        }`}
                        onPress={() => setQuantityPerDose(qty)}
                        accessibilityLabel={t('accessibility.quantityLabel', { count: qty })}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: quantityPerDose === qty }}
                      >
                        <Text
                          className={`text-2xl font-bold ${
                            quantityPerDose === qty ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {qty}
                          {t('unit.count')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="flex-row p-5 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-5 items-center justify-center min-h-[72px]"
            onPress={handleCancel}
            disabled={isLoading}
            accessibilityLabel={t('accessibility.cancelButton')}
            accessibilityHint={t('accessibility.cancelEditHint')}
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-gray-600">{t('common:button.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-[2] rounded-xl py-5 items-center justify-center min-h-[72px] ${
              isLoading ? 'bg-gray-400' : 'bg-success'
            }`}
            onPress={handleSave}
            disabled={isLoading}
            accessibilityLabel={t('accessibility.editButton')}
            accessibilityHint={t('accessibility.editHint')}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-2xl font-bold text-white">{t('button.saveComplete')}</Text>
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
          <View className="bg-white rounded-t-3xl pb-8">
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
              <Text className="text-2xl font-bold text-gray-900">{t('title.frequencySelect')}</Text>
              <TouchableOpacity
                className="px-4 py-2"
                onPress={() => setShowFrequencyPicker(false)}
                accessibilityLabel={t('accessibility.closeButton')}
                accessibilityRole="button"
              >
                <Text className="text-xl text-gray-600">{t('common:button.close')}</Text>
              </TouchableOpacity>
            </View>

            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row justify-between items-center px-5 py-5 border-b border-gray-200 min-h-[72px] ${
                  frequency === option.value ? 'bg-green-100' : ''
                }`}
                onPress={() => handleFrequencyChange(option.value)}
                accessibilityLabel={t(option.labelKey)}
                accessibilityRole="radio"
                accessibilityState={{ selected: frequency === option.value }}
              >
                <Text
                  className={`text-2xl ${
                    frequency === option.value ? 'font-bold text-green-700' : 'text-gray-900'
                  }`}
                >
                  {t(option.labelKey)}
                </Text>
                {frequency === option.value && (
                  <Text className="text-2xl font-bold text-success">OK</Text>
                )}
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
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl pb-8">
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={() => setShowStartDatePicker(false)}
                  accessibilityLabel={t('common:button.cancel')}
                  accessibilityRole="button"
                >
                  <Text className="text-xl text-gray-600">{t('common:button.cancel')}</Text>
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-gray-900">
                  {t('title.startDateSelect')}
                </Text>

                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={handleStartDateConfirm}
                  accessibilityLabel={t('common:button.confirm')}
                  accessibilityRole="button"
                >
                  <Text className="text-xl font-semibold text-success">
                    {t('common:button.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                style={{ height: 200 }}
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
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl pb-8">
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={() => setShowEndDatePicker(false)}
                  accessibilityLabel={t('common:button.cancel')}
                  accessibilityRole="button"
                >
                  <Text className="text-xl text-gray-600">{t('common:button.cancel')}</Text>
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-gray-900">{t('title.endDateSelect')}</Text>

                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={handleEndDateConfirm}
                  accessibilityLabel={t('common:button.confirm')}
                  accessibilityRole="button"
                >
                  <Text className="text-xl font-semibold text-success">
                    {t('common:button.confirm')}
                  </Text>
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

export default EditMedicationScreen;
