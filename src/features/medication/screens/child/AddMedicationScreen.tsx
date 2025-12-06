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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { ChildStackScreenProps } from '../../../../shared/types/navigation.types';
import { createMedicationForParent, MedicationFormData } from '../../../../shared/services/api';
import TimePickerButton from '../../components/TimePickerButton';
import QuantityInput, { ThresholdInput } from '../../components/QuantityInput';
import type { FrequencyLabelKey, TimeLabelKey } from '../../../../i18n/types';

type Props = ChildStackScreenProps<'AddMedication'>;

interface FrequencyOption {
  value: string;
  labelKey: FrequencyLabelKey;
  timesPerDay: number;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily_1', labelKey: 'frequency.daily1', timesPerDay: 1 },
  { value: 'daily_2', labelKey: 'frequency.daily2', timesPerDay: 2 },
  { value: 'daily_3', labelKey: 'frequency.daily3', timesPerDay: 3 },
  { value: 'as_needed', labelKey: 'frequency.asNeeded', timesPerDay: 0 },
];

const DEFAULT_TIMES: Record<string, string[]> = {
  daily_1: ['09:00'],
  daily_2: ['09:00', '21:00'],
  daily_3: ['09:00', '14:00', '21:00'],
  as_needed: [],
};

const TIME_LABEL_KEYS: Record<number, TimeLabelKey[]> = {
  1: ['timeLabel.single'],
  2: ['timeLabel.morning', 'timeLabel.evening'],
  3: ['timeLabel.morning', 'timeLabel.lunch', 'timeLabel.evening'],
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
  const { t } = useTranslation(['medication', 'common']);

  // Form state
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily_1');
  const [reminderTimes, setReminderTimes] = useState<string[]>(DEFAULT_TIMES['daily_1']);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Inventory tracking state
  const [trackQuantity, setTrackQuantity] = useState<boolean>(false);
  const [remainingQuantity, setRemainingQuantity] = useState<number | null>(null);
  const [quantityPerDose, setQuantityPerDose] = useState<number>(1);
  const [refillThreshold, setRefillThreshold] = useState<number>(7);

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
        Alert.alert(t('alert.loadError'), t('alert.endDateError'));
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
      Alert.alert(t('alert.loadError'), t('alert.endDateError'));
      setEndDate(null);
      setHasEndDate(false);
    }
    setShowEndDatePicker(false);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert(t('alert.inputError'), t('alert.nameRequired'));
      return false;
    }
    if (!dosage.trim()) {
      Alert.alert(t('alert.inputError'), t('alert.dosageRequired'));
      return false;
    }
    if (frequency !== 'as_needed' && reminderTimes.length === 0) {
      Alert.alert(t('alert.inputError'), t('alert.reminderTimeRequired'));
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
        // Inventory tracking fields
        remaining_quantity: trackQuantity ? remainingQuantity : null,
        quantity_per_dose: trackQuantity ? quantityPerDose : 1,
        refill_threshold: trackQuantity ? refillThreshold : 7,
        auto_decrement: true,
      };

      const { medication, notificationIds } = await createMedicationForParent(parentId, formData);

      const notificationMessage =
        notificationIds.length > 0
          ? t('alert.notificationScheduled', { count: notificationIds.length })
          : t('alert.notificationFailedShort');

      Alert.alert(
        t('alert.saveComplete'),
        t('alert.saveSuccess', { name: medication.name, notification: notificationMessage }),
        [{ text: t('common:button.confirm'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('약 등록 실패:', error);
      Alert.alert(t('alert.saveFailed'), t('alert.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

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

  const selectedFrequencyOption = FREQUENCY_OPTIONS.find((opt) => opt.value === frequency);
  const selectedFrequencyLabel = selectedFrequencyOption
    ? t(selectedFrequencyOption.labelKey)
    : t('frequency.daily1');
  const timesPerDay = selectedFrequencyOption?.timesPerDay || 0;

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
          contentContainerClassName="p-4 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* 약 이름 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              {t('label.name')} <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              value={name}
              onChangeText={setName}
              placeholder={t('placeholder.nameExample')}
              placeholderTextColor="#9CA3AF"
              maxLength={50}
            />
          </View>

          {/* 복용량 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              {t('label.dosage')} <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('placeholder.dosageExample')}
              placeholderTextColor="#9CA3AF"
              maxLength={20}
            />
          </View>

          {/* 복용 횟수 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              {t('label.frequency')} <Text className="text-error">*</Text>
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
                {t('label.reminderTime')} <Text className="text-error">*</Text>
              </Text>
              <View className="gap-2">
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
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">{t('label.startDate')}</Text>
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
              {t('label.endDate')}{' '}
              <Text className="text-gray-400">({t('common:label.optional') || 'Optional'})</Text>
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
                  {hasEndDate ? t('status.set') : t('status.notSet')}
                </Text>
              </TouchableOpacity>

              {hasEndDate && (
                <TouchableOpacity
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className="text-base text-gray-900">
                    {endDate ? formatDateKorean(endDate) : t('placeholder.selectDate')}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 메모 */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              {t('label.notes')}{' '}
              <Text className="text-gray-400">({t('common:label.optional') || 'Optional'})</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 min-h-[100px]"
              value={notes}
              onChangeText={setNotes}
              placeholder={t('placeholder.notesExample')}
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* 재고 관리 (선택) */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-700">
                {t('label.inventoryTracking')}
              </Text>
              <Switch
                value={trackQuantity}
                onValueChange={(value) => {
                  setTrackQuantity(value);
                  if (value && remainingQuantity === null) {
                    setRemainingQuantity(30);
                  }
                }}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={trackQuantity ? '#3B82F6' : '#9CA3AF'}
              />
            </View>

            {trackQuantity && (
              <View className="bg-white border border-gray-300 rounded-xl p-4 gap-4">
                {/* 남은 약 수량 */}
                <QuantityInput
                  value={remainingQuantity}
                  onValueChange={setRemainingQuantity}
                  variant="child"
                  label={t('label.remainingQuantity')}
                  min={0}
                  max={9999}
                  step={10}
                  allowNull={false}
                />

                {/* 1회 복용 수량 */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('label.quantityPerDose')}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {[1, 2, 3].map((qty) => (
                      <TouchableOpacity
                        key={qty}
                        className={`flex-1 py-3 rounded-lg items-center justify-center ${
                          quantityPerDose === qty
                            ? 'bg-primary border border-primary'
                            : 'bg-gray-100 border border-gray-300'
                        }`}
                        onPress={() => setQuantityPerDose(qty)}
                      >
                        <Text
                          className={`text-base font-semibold ${
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

                {/* 재고 알림 임계값 */}
                <ThresholdInput
                  value={refillThreshold}
                  onValueChange={setRefillThreshold}
                  label={t('label.refillThreshold')}
                  min={1}
                  max={30}
                  unit={t('unit.day')}
                  variant="child"
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="flex-row p-4 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-4 items-center justify-center"
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text className="text-base font-semibold text-gray-600">
              {t('common:button.cancel')}
            </Text>
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
                <Text className="text-base font-semibold text-white">
                  {t('common:button.save')}
                </Text>
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
              <Text className="text-lg font-bold text-gray-900">{t('title.frequencySelect')}</Text>
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
                  {t(option.labelKey)}
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
                  <Text className="text-base text-gray-600">{t('common:button.cancel')}</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">
                  {t('title.startDateSelect')}
                </Text>
                <TouchableOpacity className="p-2" onPress={handleStartDateConfirm}>
                  <Text className="text-base font-semibold text-primary">
                    {t('common:button.confirm')}
                  </Text>
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
                  <Text className="text-base text-gray-600">{t('common:button.cancel')}</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">{t('title.endDateSelect')}</Text>
                <TouchableOpacity className="p-2" onPress={handleEndDateConfirm}>
                  <Text className="text-base font-semibold text-primary">
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

export default AddMedicationScreen;
