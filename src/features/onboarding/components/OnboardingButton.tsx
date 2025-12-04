/**
 * OnboardingButton Component
 *
 * Styled button for onboarding screens.
 * Parent: 72px height, success green, rounded-2xl
 * Child: 48px height, primary blue, rounded-xl
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface OnboardingButtonProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** User role for styling */
  variant: 'parent' | 'child';
  /** Button type */
  type?: 'primary' | 'secondary' | 'outline';
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility hint */
  accessibilityHint?: string;
}

const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  label,
  onPress,
  variant,
  type = 'primary',
  isLoading = false,
  disabled = false,
  accessibilityHint,
}) => {
  const isParent = variant === 'parent';

  // Button container styles based on variant and type
  const getButtonStyles = (): string => {
    const baseStyles = isParent
      ? 'h-[72px] rounded-2xl justify-center items-center w-full'
      : 'h-[48px] rounded-xl justify-center items-center w-full';

    if (disabled) {
      return `${baseStyles} bg-gray-300`;
    }

    if (isParent) {
      switch (type) {
        case 'primary':
          return `${baseStyles} bg-success`;
        case 'secondary':
          return `${baseStyles} bg-gray-600`;
        case 'outline':
          return `${baseStyles} bg-transparent border-2 border-success`;
        default:
          return `${baseStyles} bg-success`;
      }
    } else {
      switch (type) {
        case 'primary':
          return `${baseStyles} bg-primary`;
        case 'secondary':
          return `${baseStyles} bg-gray-100`;
        case 'outline':
          return `${baseStyles} bg-transparent border-2 border-primary`;
        default:
          return `${baseStyles} bg-primary`;
      }
    }
  };

  // Text styles based on variant and type
  const getTextStyles = (): string => {
    const baseStyles = isParent ? 'text-2xl font-bold' : 'text-base font-semibold';

    if (disabled) {
      return `${baseStyles} text-gray-500`;
    }

    if (type === 'outline') {
      return isParent ? `${baseStyles} text-success` : `${baseStyles} text-primary`;
    }

    if (type === 'secondary' && !isParent) {
      return `${baseStyles} text-gray-800`;
    }

    return `${baseStyles} text-white`;
  };

  return (
    <TouchableOpacity
      className={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={type === 'outline' ? '#22C55E' : '#FFFFFF'} />
      ) : (
        <Text className={getTextStyles()}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

export default OnboardingButton;
