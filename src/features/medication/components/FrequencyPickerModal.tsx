/**
 * FrequencyPickerModal - Reusable frequency selection modal
 *
 * A bottom sheet modal for selecting medication frequency.
 * Designed for elderly users with large touch targets and high contrast.
 *
 * Features:
 * - 72px minimum touch target height (elderly-friendly)
 * - WCAG AAA contrast compliance
 * - Full accessibility support (labels, roles, states)
 * - NativeWind styling only (no inline styles)
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FREQUENCY_OPTIONS } from '../constants';

/**
 * Props for FrequencyPickerModal component
 */
export interface FrequencyPickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Currently selected frequency value */
  frequency: string;
  /** Callback when a frequency option is selected */
  onSelect: (frequency: string) => void;
  /** Callback when the modal is closed */
  onClose: () => void;
}

/**
 * FrequencyPickerModal Component
 *
 * Displays a bottom sheet modal with frequency options for medication scheduling.
 * Each option shows a radio-style selection with an "OK" indicator for the selected item.
 */
const FrequencyPickerModal: React.FC<FrequencyPickerModalProps> = ({
  visible,
  frequency,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation(['medication', 'common']);

  /**
   * Handle frequency option selection
   */
  const handleSelect = (selectedValue: string): void => {
    onSelect(selectedValue);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl pb-8">
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">{t('title.frequencySelect')}</Text>
            <TouchableOpacity
              className="px-4 py-2 min-h-[48px] justify-center"
              onPress={onClose}
              accessibilityLabel={t('accessibility.closeButton')}
              accessibilityRole="button"
              accessibilityState={{ expanded: visible }}
            >
              <Text className="text-xl text-gray-600">{t('common:button.close')}</Text>
            </TouchableOpacity>
          </View>

          {/* Frequency Options */}
          {FREQUENCY_OPTIONS.map((option) => {
            const isSelected = frequency === option.value;
            const optionLabel = t(option.labelKey);

            return (
              <TouchableOpacity
                key={option.value}
                className={`flex-row justify-between items-center px-5 py-5 border-b border-gray-200 min-h-[72px] ${
                  isSelected ? 'bg-green-100' : 'bg-white'
                }`}
                onPress={() => handleSelect(option.value)}
                accessibilityLabel={optionLabel}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: isSelected,
                  checked: isSelected,
                }}
              >
                <Text
                  className={`text-2xl ${
                    isSelected ? 'font-bold text-green-700' : 'text-gray-900'
                  }`}
                >
                  {optionLabel}
                </Text>
                {isSelected && <Text className="text-2xl font-bold text-success">OK</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

export default FrequencyPickerModal;
