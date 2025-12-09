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
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { createMedicationFromForm, MedicationFormData } from '../../../../shared/services/api';
import TimePickerButton from '../../components/TimePickerButton';
import FrequencyPickerModal from '../../components/FrequencyPickerModal';
import DatePickerModal from '../../components/DatePickerModal';
import InventoryTrackingSection from '../../components/InventoryTrackingSection';
import { FREQUENCY_OPTIONS, DEFAULT_TIMES, TIME_LABEL_KEYS } from '../../constants';
import { formatDateToString, formatDateKorean } from '../../utils';

type Props = ParentScreenProps<'AddMedication'>;

const AddMedicationScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['medication', 'common']);

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
        // Inventory tracking fields
        remaining_quantity: trackQuantity ? remainingQuantity : null,
        quantity_per_dose: trackQuantity ? quantityPerDose : 1,
        refill_threshold: 7, // Default threshold
        auto_decrement: true, // Auto-decrement by default
      };

      const { medication, notificationIds } = await createMedicationFromForm(formData);

      // 성공 알림
      const notificationMessage =
        notificationIds.length > 0
          ? t('alert.notificationScheduled', { count: notificationIds.length })
          : t('alert.notificationFailed');

      Alert.alert(
        t('alert.saveComplete'),
        t('alert.saveSuccess', { name: medication.name, notification: notificationMessage }),
        [
          {
            text: t('common:button.confirm'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('약 등록 실패:', error);
      Alert.alert(t('alert.saveFailed'), t('alert.saveError'), [
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
    if (name || dosage || notes) {
      Alert.alert(t('alert.cancelTitle'), t('alert.cancelMessage'), [
        { text: t('alert.continueWriting'), style: 'cancel' },
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
          <InventoryTrackingSection
            trackQuantity={trackQuantity}
            onTrackQuantityChange={setTrackQuantity}
            remainingQuantity={remainingQuantity}
            onRemainingQuantityChange={setRemainingQuantity}
            quantityPerDose={quantityPerDose}
            onQuantityPerDoseChange={setQuantityPerDose}
          />
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="flex-row p-5 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-5 items-center justify-center min-h-[72px]"
            onPress={handleCancel}
            disabled={isLoading}
            accessibilityLabel={t('accessibility.cancelButton')}
            accessibilityHint={t('accessibility.cancelHint')}
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
            accessibilityLabel={t('accessibility.saveButton')}
            accessibilityHint={t('accessibility.saveHint')}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-2xl font-bold text-white">{t('common:button.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 복용 횟수 선택 모달 */}
      <FrequencyPickerModal
        visible={showFrequencyPicker}
        frequency={frequency}
        onSelect={handleFrequencyChange}
        onClose={() => setShowFrequencyPicker(false)}
      />

      {/* 시작일 DatePicker */}
      <DatePickerModal
        visible={showStartDatePicker}
        value={startDate}
        onChange={(date) => {
          setStartDate(date);
          if (endDate && date > endDate) {
            setEndDate(null);
            setHasEndDate(false);
          }
        }}
        onClose={() => setShowStartDatePicker(false)}
        title={t('title.startDateSelect')}
        minimumDate={new Date()}
      />

      {/* 종료일 DatePicker */}
      <DatePickerModal
        visible={showEndDatePicker}
        value={endDate || new Date()}
        onChange={(date) => {
          if (date < startDate) {
            Alert.alert(t('alert.loadError'), t('alert.endDateError'), [
              { text: t('common:button.confirm') },
            ]);
            return;
          }
          setEndDate(date);
          setHasEndDate(true);
        }}
        onClose={() => setShowEndDatePicker(false)}
        title={t('title.endDateSelect')}
        minimumDate={startDate}
      />
    </SafeAreaView>
  );
};

export default AddMedicationScreen;
