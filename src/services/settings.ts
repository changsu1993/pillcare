/**
 * Settings Service - App settings persistence
 *
 * Uses AsyncStorage to persist user preferences.
 * Includes voice guidance and vibration settings.
 *
 * Default settings are optimized for elderly users:
 * - Voice guidance: enabled
 * - Vibration: enabled
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: '@PillCare:settings',
} as const;

/**
 * App settings interface
 */
export interface AppSettings {
  /** Enable voice guidance (TTS) */
  voiceGuidanceEnabled: boolean;
  /** Enable vibration for reminders */
  vibrationEnabled: boolean;
}

/**
 * Default settings - optimized for elderly users
 */
export const DEFAULT_SETTINGS: AppSettings = {
  voiceGuidanceEnabled: true,
  vibrationEnabled: true,
};

/**
 * Get all settings from storage
 * @returns App settings with defaults for missing values
 */
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    }

    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[SettingsService] Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to storage
 * @param settings - Partial settings to update
 * @returns Updated settings
 */
export const saveSettings = async (
  settings: Partial<AppSettings>
): Promise<AppSettings> => {
  try {
    // Get current settings
    const current = await getSettings();

    // Merge with new settings
    const updated: AppSettings = {
      ...current,
      ...settings,
    };

    // Save to storage
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    console.log('[SettingsService] Settings saved:', updated);
    return updated;
  } catch (error) {
    console.error('[SettingsService] Error saving settings:', error);
    throw error;
  }
};

/**
 * Check if voice guidance is enabled
 * @returns True if voice guidance is enabled
 */
export const isVoiceGuidanceEnabled = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    return settings.voiceGuidanceEnabled;
  } catch (error) {
    console.error('[SettingsService] Error checking voice guidance:', error);
    // Default to true for elderly users
    return true;
  }
};

/**
 * Check if vibration is enabled
 * @returns True if vibration is enabled
 */
export const isVibrationEnabled = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    return settings.vibrationEnabled;
  } catch (error) {
    console.error('[SettingsService] Error checking vibration:', error);
    // Default to true
    return true;
  }
};

/**
 * Enable voice guidance
 */
export const enableVoiceGuidance = async (): Promise<void> => {
  await saveSettings({ voiceGuidanceEnabled: true });
};

/**
 * Disable voice guidance
 */
export const disableVoiceGuidance = async (): Promise<void> => {
  await saveSettings({ voiceGuidanceEnabled: false });
};

/**
 * Toggle voice guidance
 * @returns New voice guidance state
 */
export const toggleVoiceGuidance = async (): Promise<boolean> => {
  const settings = await getSettings();
  const newValue = !settings.voiceGuidanceEnabled;
  await saveSettings({ voiceGuidanceEnabled: newValue });
  return newValue;
};

/**
 * Enable vibration
 */
export const enableVibration = async (): Promise<void> => {
  await saveSettings({ vibrationEnabled: true });
};

/**
 * Disable vibration
 */
export const disableVibration = async (): Promise<void> => {
  await saveSettings({ vibrationEnabled: false });
};

/**
 * Toggle vibration
 * @returns New vibration state
 */
export const toggleVibration = async (): Promise<boolean> => {
  const settings = await getSettings();
  const newValue = !settings.vibrationEnabled;
  await saveSettings({ vibrationEnabled: newValue });
  return newValue;
};

/**
 * Reset settings to defaults
 */
export const resetSettings = async (): Promise<AppSettings> => {
  await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
  return DEFAULT_SETTINGS;
};

export default {
  getSettings,
  saveSettings,
  isVoiceGuidanceEnabled,
  isVibrationEnabled,
  enableVoiceGuidance,
  disableVoiceGuidance,
  toggleVoiceGuidance,
  enableVibration,
  disableVibration,
  toggleVibration,
  resetSettings,
  DEFAULT_SETTINGS,
};
