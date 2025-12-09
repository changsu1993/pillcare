/**
 * VoiceSettingsSection - Voice guidance controls with toggle, test, and speed
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - 72px min-height for large touch targets
 * - Clear labels and emoji indicators
 * - State announcements for screen readers
 */

import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Voice speed options: slow (0.7), normal (0.85), fast (1.0) */
export type VoiceSpeed = 0.7 | 0.85 | 1.0;

export interface VoiceSettingsSectionProps {
  /** Whether voice guidance is enabled */
  voiceEnabled: boolean;
  /** Callback when voice toggle is changed */
  onVoiceToggle: (value: boolean) => void;
  /** Current voice speed setting */
  voiceSpeed: VoiceSpeed;
  /** Callback when voice speed is changed */
  onVoiceSpeedChange: (speed: VoiceSpeed) => void;
  /** Callback to test voice with current settings */
  onTestVoice: () => void;
  /** Whether controls are disabled (e.g., during save) */
  isDisabled?: boolean;
}

/**
 * Get translation key for voice speed
 */
const getSpeedLabelKey = (
  speed: VoiceSpeed
): 'settings:voiceSpeed.slow' | 'settings:voiceSpeed.normal' | 'settings:voiceSpeed.fast' => {
  switch (speed) {
    case 0.7:
      return 'settings:voiceSpeed.slow';
    case 0.85:
      return 'settings:voiceSpeed.normal';
    case 1.0:
      return 'settings:voiceSpeed.fast';
    default:
      return 'settings:voiceSpeed.normal';
  }
};

/**
 * Get emoji indicator for voice speed
 */
const getSpeedEmoji = (speed: VoiceSpeed): string => {
  switch (speed) {
    case 0.7:
      return '\u{1F422}'; // Turtle
    case 0.85:
      return '\u{1F6B6}'; // Walking person
    case 1.0:
      return '\u{1F407}'; // Rabbit
    default:
      return '\u{1F6B6}';
  }
};

const VoiceSettingsSection: React.FC<VoiceSettingsSectionProps> = ({
  voiceEnabled,
  onVoiceToggle,
  voiceSpeed,
  onVoiceSpeedChange,
  onTestVoice,
  isDisabled = false,
}) => {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <View className="gap-4">
      {/* Voice Guidance Toggle */}
      <View
        className="bg-white min-h-[72px] flex-row items-center justify-between px-6 rounded-2xl border-2 border-gray-200 shadow-sm"
        accessibilityLabel={t('settings:label.voiceGuidance')}
        accessibilityRole="adjustable"
        accessibilityState={{ checked: voiceEnabled }}
      >
        <View className="flex-row items-center flex-1">
          <Text className="text-4xl mr-4" accessibilityElementsHidden>
            &#128266;
          </Text>
          <Text className="text-2xl font-semibold text-gray-900">
            {t('settings:label.voiceGuidance')}
          </Text>
        </View>
        <View className="justify-center items-center w-[60px] h-9">
          <Switch
            value={voiceEnabled}
            onValueChange={onVoiceToggle}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={voiceEnabled ? '#22C55E' : '#F3F4F6'}
            ios_backgroundColor="#D1D5DB"
            accessibilityLabel={
              voiceEnabled
                ? t('settings:accessibility.voiceOn')
                : t('settings:accessibility.voiceOff')
            }
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Voice Test Button - Only visible when voice is enabled */}
      {voiceEnabled && (
        <TouchableOpacity
          className="bg-primary min-h-[56px] flex-row items-center justify-center px-6 rounded-xl border-2 border-primary gap-2"
          onPress={onTestVoice}
          activeOpacity={0.7}
          accessibilityLabel={t('settings:voice.test')}
          accessibilityHint={t('settings:accessibility.voiceTestHint')}
          accessibilityRole="button"
          disabled={isDisabled}
        >
          <Text className="text-2xl" accessibilityElementsHidden>
            &#127911;
          </Text>
          <Text className="text-lg font-semibold text-white">{t('settings:voice.test')}</Text>
        </TouchableOpacity>
      )}

      {/* Voice Speed Selector - Only visible when voice is enabled */}
      {voiceEnabled && (
        <View className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
          <Text className="text-2xl font-semibold text-gray-900 mb-4">
            {t('settings:label.voiceSpeed')}
          </Text>
          <View className="flex-row gap-3">
            {([0.7, 0.85, 1.0] as VoiceSpeed[]).map((speed) => (
              <TouchableOpacity
                key={speed}
                className={`flex-1 min-h-[72px] items-center justify-center rounded-xl border-2 ${
                  voiceSpeed === speed ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => onVoiceSpeedChange(speed)}
                activeOpacity={0.7}
                disabled={isDisabled}
                accessibilityLabel={t(getSpeedLabelKey(speed))}
                accessibilityRole="button"
                accessibilityState={{ selected: voiceSpeed === speed }}
              >
                <Text className="text-4xl mb-1" accessibilityElementsHidden>
                  {getSpeedEmoji(speed)}
                </Text>
                <Text
                  className={`text-xl font-semibold ${
                    voiceSpeed === speed ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {t(getSpeedLabelKey(speed))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default VoiceSettingsSection;
