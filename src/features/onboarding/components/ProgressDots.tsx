/**
 * ProgressDots Component
 *
 * Visual progress indicator for onboarding screens.
 * Shows current screen position with filled/empty dots.
 *
 * Parent: 16px diameter dots, success color
 * Child: 10px diameter dots, primary color
 */

import React from 'react';
import { View, Text } from 'react-native';

interface ProgressDotsProps {
  /** Total number of screens */
  total: number;
  /** Current screen index (0-based) */
  current: number;
  /** User role for styling */
  variant: 'parent' | 'child';
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ total, current, variant }) => {
  const isParent = variant === 'parent';

  // Accessibility label
  const accessibilityLabel =
    variant === 'parent'
      ? `진행 상황, ${total}개 중 ${current + 1}번째`
      : `튜토리얼 진행 상황, ${total}개 중 ${current + 1}번째`;

  return (
    <View
      className="flex-row items-center justify-center"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      {isParent ? (
        // Parent: Show text progress "1 / 3"
        <Text className="text-2xl font-semibold text-gray-700">
          {current + 1} / {total}
        </Text>
      ) : (
        // Child: Show dot indicators
        <View className="flex-row gap-2">
          {Array.from({ length: total }, (_, index) => (
            <View
              key={index}
              className={`rounded-full ${
                index <= current ? 'bg-primary w-2.5 h-2.5' : 'bg-gray-300 w-2.5 h-2.5'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ProgressDots;
