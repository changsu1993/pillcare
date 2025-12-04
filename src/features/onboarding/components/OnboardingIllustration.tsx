/**
 * OnboardingIllustration Component
 *
 * Icon-based illustrations for onboarding screens.
 * Uses @expo/vector-icons (MaterialCommunityIcons, Ionicons)
 */

import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export type IllustrationType =
  // Parent screens
  | 'pill'
  | 'speaker'
  | 'checkmark'
  | 'logo'
  // Child screens
  | 'connection'
  | 'medication'
  | 'chart'
  | 'bell';

interface OnboardingIllustrationProps {
  /** Type of illustration */
  type: IllustrationType;
  /** User role for sizing */
  variant: 'parent' | 'child';
  /** Optional custom size */
  size?: number;
  /** Optional custom color */
  color?: string;
}

const OnboardingIllustration: React.FC<OnboardingIllustrationProps> = ({
  type,
  variant,
  size: customSize,
  color: customColor,
}) => {
  const isParent = variant === 'parent';
  const defaultSize = isParent ? 64 : 48;
  const size = customSize || defaultSize;

  // Colors
  const successColor = '#22C55E';
  const primaryColor = '#3B82F6';
  const defaultColor = isParent ? successColor : primaryColor;
  const color = customColor || defaultColor;

  // Container size based on icon
  const containerSize = type === 'checkmark' || type === 'logo' ? (isParent ? 96 : 72) : size;

  const renderIcon = () => {
    switch (type) {
      case 'pill':
        return <MaterialCommunityIcons name="pill" size={size} color={color} />;

      case 'speaker':
        return <Ionicons name="volume-high" size={size} color={color} />;

      case 'checkmark':
        return (
          <View
            className="rounded-full justify-center items-center"
            style={{
              width: containerSize,
              height: containerSize,
              backgroundColor: successColor,
            }}
          >
            <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
          </View>
        );

      case 'logo':
        return (
          <View
            className="rounded-2xl justify-center items-center"
            style={{
              width: containerSize,
              height: containerSize,
              backgroundColor: isParent ? '#F0FDF4' : '#EFF6FF',
            }}
          >
            <MaterialCommunityIcons
              name="pill"
              size={size * 0.6}
              color={isParent ? successColor : primaryColor}
            />
          </View>
        );

      case 'connection':
        return <Ionicons name="people" size={size} color={color} />;

      case 'medication':
        return <MaterialCommunityIcons name="pill" size={size} color={color} />;

      case 'chart':
        return <Ionicons name="bar-chart" size={size} color={color} />;

      case 'bell':
        return (
          <View className="relative">
            <Ionicons name="notifications" size={size} color={color} />
            {/* Red badge dot */}
            <View
              className="absolute bg-error rounded-full"
              style={{
                width: size * 0.25,
                height: size * 0.25,
                top: 0,
                right: 0,
              }}
            />
          </View>
        );

      default:
        return <MaterialCommunityIcons name="pill" size={size} color={color} />;
    }
  };

  return (
    <View className="justify-center items-center" accessibilityLabel={getAccessibilityLabel(type)}>
      {renderIcon()}
    </View>
  );
};

const getAccessibilityLabel = (type: IllustrationType): string => {
  switch (type) {
    case 'pill':
      return '약 아이콘';
    case 'speaker':
      return '스피커 아이콘';
    case 'checkmark':
      return '완료 체크 아이콘';
    case 'logo':
      return '필케어 앱 로고';
    case 'connection':
      return '가족 연결 아이콘';
    case 'medication':
      return '약 관리 아이콘';
    case 'chart':
      return '차트 아이콘';
    case 'bell':
      return '알림 벨 아이콘';
    default:
      return '아이콘';
  }
};

export default OnboardingIllustration;
