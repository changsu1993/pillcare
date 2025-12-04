/**
 * QuantityInput - Adjustable quantity input with +/- buttons
 *
 * Provides an accessible way to adjust numeric values.
 * Supports both parent (72px buttons, WCAG AAA) and child (48px buttons, WCAG AA) variants.
 *
 * Features:
 * - Large touch targets for elderly users (parent variant)
 * - Increment/decrement buttons with visual feedback
 * - Optional min/max bounds
 * - Haptic feedback support
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

interface QuantityInputProps {
  /** Current value */
  value: number | null;
  /** Callback when value changes */
  onValueChange: (value: number | null) => void;
  /** Display variant */
  variant?: 'parent' | 'child';
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step size for increment/decrement */
  step?: number;
  /** Label to display above input */
  label?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to allow null values (disable tracking) */
  allowNull?: boolean;
  /** Placeholder text when value is null */
  placeholder?: string;
}

/**
 * QuantityInput component
 *
 * @example
 * // Parent variant with large buttons
 * <QuantityInput
 *   value={30}
 *   onValueChange={setQuantity}
 *   variant="parent"
 *   label="remaining quantity"
 *   min={0}
 * />
 *
 * // Child variant
 * <QuantityInput
 *   value={30}
 *   onValueChange={setQuantity}
 *   variant="child"
 *   min={0}
 *   max={999}
 * />
 */
const QuantityInput = memo(
  ({
    value,
    onValueChange,
    variant = 'child',
    min = 0,
    max = 9999,
    step = 1,
    label,
    disabled = false,
    allowNull = true,
    placeholder = '-',
  }: QuantityInputProps) => {
    const isParent = variant === 'parent';

    const handleIncrement = useCallback(() => {
      if (value === null) {
        onValueChange(step);
      } else if (value < max) {
        onValueChange(Math.min(value + step, max));
      }
    }, [value, onValueChange, step, max]);

    const handleDecrement = useCallback(() => {
      if (value === null) {
        return;
      }
      if (value - step < min && allowNull) {
        onValueChange(null);
      } else {
        onValueChange(Math.max(value - step, min));
      }
    }, [value, onValueChange, step, min, allowNull]);

    const handleTextChange = useCallback(
      (text: string) => {
        if (text === '' && allowNull) {
          onValueChange(null);
          return;
        }

        const numValue = parseInt(text, 10);
        if (!isNaN(numValue)) {
          const clampedValue = Math.max(min, Math.min(max, numValue));
          onValueChange(clampedValue);
        }
      },
      [onValueChange, min, max, allowNull]
    );

    // Parent: WCAG AAA - 72px buttons (60px minimum), 24pt+ text
    // Child: WCAG AA - 48px buttons, 16pt text
    const buttonSize = isParent ? 'w-[72px] h-[72px]' : 'w-12 h-12';
    const buttonTextSize = isParent ? 'text-4xl' : 'text-2xl';
    const inputTextSize = isParent ? 'text-3xl' : 'text-xl';
    const inputHeight = isParent ? 'h-[72px]' : 'h-12';
    const labelTextSize = isParent ? 'text-2xl' : 'text-sm';

    const decrementDisabled =
      disabled || (value === null && !allowNull) || (value !== null && value <= min && !allowNull);
    const incrementDisabled = disabled || (value !== null && value >= max);

    return (
      <View className="w-full">
        {label && (
          <Text
            className={`${labelTextSize} font-semibold text-gray-700 mb-2`}
            accessibilityRole="text"
          >
            {label}
          </Text>
        )}

        <View className="flex-row items-center justify-center gap-3">
          {/* Decrement Button */}
          <TouchableOpacity
            className={`${buttonSize} rounded-xl items-center justify-center ${
              decrementDisabled ? 'bg-gray-200' : 'bg-gray-100 active:bg-gray-200'
            }`}
            onPress={handleDecrement}
            disabled={decrementDisabled}
            accessibilityLabel="decrease quantity"
            accessibilityHint={`Decrease by ${step}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: decrementDisabled }}
          >
            <Text
              className={`${buttonTextSize} font-bold ${
                decrementDisabled ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              -
            </Text>
          </TouchableOpacity>

          {/* Value Display / Input */}
          <View
            className={`flex-1 max-w-[120px] ${inputHeight} bg-white border-2 border-gray-300 rounded-xl items-center justify-center`}
          >
            <TextInput
              className={`${inputTextSize} font-bold text-gray-900 text-center w-full`}
              value={value !== null ? value.toString() : ''}
              onChangeText={handleTextChange}
              keyboardType="number-pad"
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              editable={!disabled}
              selectTextOnFocus
              accessibilityLabel={`quantity: ${value !== null ? value : 'not set'}`}
            />
          </View>

          {/* Increment Button */}
          <TouchableOpacity
            className={`${buttonSize} rounded-xl items-center justify-center ${
              incrementDisabled ? 'bg-gray-200' : 'bg-primary active:bg-blue-600'
            }`}
            onPress={handleIncrement}
            disabled={incrementDisabled}
            accessibilityLabel="increase quantity"
            accessibilityHint={`Increase by ${step}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: incrementDisabled }}
          >
            <Text
              className={`${buttonTextSize} font-bold ${
                incrementDisabled ? 'text-gray-400' : 'text-white'
              }`}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

QuantityInput.displayName = 'QuantityInput';

export default QuantityInput;

/**
 * Simplified quantity input for threshold settings
 */
interface ThresholdInputProps {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  unit?: string;
  variant?: 'parent' | 'child';
}

export const ThresholdInput = memo(
  ({
    value,
    onValueChange,
    label,
    min = 1,
    max = 30,
    unit = '일',
    variant = 'child',
  }: ThresholdInputProps) => {
    const isParent = variant === 'parent';
    const buttonSize = isParent ? 'w-14 h-14' : 'w-10 h-10';
    const buttonTextSize = isParent ? 'text-2xl' : 'text-xl';
    const valueTextSize = isParent ? 'text-2xl' : 'text-lg';
    const labelTextSize = isParent ? 'text-xl' : 'text-sm';

    const handleDecrement = useCallback(() => {
      if (value > min) {
        onValueChange(value - 1);
      }
    }, [value, onValueChange, min]);

    const handleIncrement = useCallback(() => {
      if (value < max) {
        onValueChange(value + 1);
      }
    }, [value, onValueChange, max]);

    return (
      <View className="flex-row items-center justify-between">
        <Text className={`${labelTextSize} text-gray-700 flex-1`}>{label}</Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className={`${buttonSize} rounded-lg bg-gray-100 items-center justify-center`}
            onPress={handleDecrement}
            disabled={value <= min}
            accessibilityLabel="decrease threshold"
          >
            <Text className={`${buttonTextSize} font-bold text-gray-700`}>-</Text>
          </TouchableOpacity>

          <View className="min-w-[60px] items-center">
            <Text className={`${valueTextSize} font-bold text-gray-900`}>
              {value}
              {unit}
            </Text>
          </View>

          <TouchableOpacity
            className={`${buttonSize} rounded-lg bg-gray-100 items-center justify-center`}
            onPress={handleIncrement}
            disabled={value >= max}
            accessibilityLabel="increase threshold"
          >
            <Text className={`${buttonTextSize} font-bold text-gray-700`}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

ThresholdInput.displayName = 'ThresholdInput';
