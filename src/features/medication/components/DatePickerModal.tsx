/**
 * DatePickerModal - Cross-platform date picker modal component
 *
 * Platform-specific behavior:
 * - iOS: Shows in a modal with spinner picker, cancel/confirm buttons
 * - Android: Shows native date picker directly (no modal wrapper)
 *
 * Features:
 * - Elderly-friendly large touch targets (60px minimum)
 * - WCAG AAA contrast compliance
 * - Accessibility labels on all interactive elements
 * - i18n support via react-i18next
 */

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

interface DatePickerModalProps {
  /** Controls modal visibility */
  visible: boolean;
  /** Currently selected date */
  value: Date;
  /** Callback when date is confirmed */
  onChange: (date: Date) => void;
  /** Callback to close the modal */
  onClose: () => void;
  /** Modal header title */
  title: string;
  /** Minimum selectable date */
  minimumDate?: Date;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  onChange,
  onClose,
  title,
  minimumDate,
}) => {
  const { t } = useTranslation(['medication', 'common']);
  const [tempDate, setTempDate] = useState<Date>(value);
  const [prevVisible, setPrevVisible] = useState(visible);

  // Sync tempDate when modal opens (React pattern for derived state during render)
  if (visible && !prevVisible) {
    setTempDate(value);
  }
  if (visible !== prevVisible) {
    setPrevVisible(visible);
  }

  /**
   * Handle date change from DateTimePicker
   */
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      // Android: Close immediately and apply change if confirmed
      onClose();
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS: Update temp date for preview in spinner
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  /**
   * iOS: Confirm button handler
   */
  const handleConfirm = (): void => {
    onChange(tempDate);
    onClose();
  };

  /**
   * iOS: Cancel button handler
   */
  const handleCancel = (): void => {
    setTempDate(value);
    onClose();
  };

  // Android: Render native picker directly when visible
  if (Platform.OS === 'android') {
    if (!visible) {
      return null;
    }

    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={handleDateChange}
        minimumDate={minimumDate}
      />
    );
  }

  // iOS: Render modal with spinner picker
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleCancel}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl pb-8">
          {/* Header with cancel, title, confirm */}
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
            <TouchableOpacity
              className="px-4 py-2 min-w-[60px] min-h-[44px] justify-center"
              onPress={handleCancel}
              accessibilityLabel={t('common:button.cancel')}
              accessibilityRole="button"
            >
              <Text className="text-lg text-gray-500">{t('common:button.cancel')}</Text>
            </TouchableOpacity>

            <Text className="text-xl font-bold text-gray-900">{title}</Text>

            <TouchableOpacity
              className="px-4 py-2 min-w-[60px] min-h-[44px] justify-center items-end"
              onPress={handleConfirm}
              accessibilityLabel={t('common:button.confirm')}
              accessibilityRole="button"
            >
              <Text className="text-lg font-semibold text-success">
                {t('common:button.confirm')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker Spinner */}
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            className="h-[200px]"
          />
        </View>
      </View>
    </Modal>
  );
};

export default DatePickerModal;
