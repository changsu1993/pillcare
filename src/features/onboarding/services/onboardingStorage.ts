/**
 * Onboarding Storage Service
 *
 * Handles AsyncStorage operations for onboarding state.
 * Keys:
 * - @pillcare_parent_onboarding_completed
 * - @pillcare_child_onboarding_completed
 * - @pillcare_onboarding_dont_show
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PARENT_COMPLETED: '@pillcare_parent_onboarding_completed',
  CHILD_COMPLETED: '@pillcare_child_onboarding_completed',
  DONT_SHOW_AGAIN: '@pillcare_onboarding_dont_show',
} as const;

export type UserRole = 'parent' | 'child';

/**
 * Check if onboarding has been completed for a specific role
 */
export const isOnboardingCompleted = async (role: UserRole): Promise<boolean> => {
  try {
    const key = role === 'parent' ? STORAGE_KEYS.PARENT_COMPLETED : STORAGE_KEYS.CHILD_COMPLETED;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed for a specific role
 */
export const setOnboardingCompleted = async (role: UserRole): Promise<void> => {
  try {
    const key = role === 'parent' ? STORAGE_KEYS.PARENT_COMPLETED : STORAGE_KEYS.CHILD_COMPLETED;
    await AsyncStorage.setItem(key, 'true');
  } catch (error) {
    console.error('Error setting onboarding completed:', error);
    throw error;
  }
};

/**
 * Check if "Don't show again" preference is set
 */
export const isDontShowAgain = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.DONT_SHOW_AGAIN);
    return value === 'true';
  } catch (error) {
    console.error('Error checking dont show again:', error);
    return false;
  }
};

/**
 * Set "Don't show again" preference
 */
export const setDontShowAgain = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DONT_SHOW_AGAIN, value ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting dont show again:', error);
    throw error;
  }
};

/**
 * Reset onboarding status (for "View Tutorial" from settings)
 */
export const resetOnboardingStatus = async (role: UserRole): Promise<void> => {
  try {
    const key = role === 'parent' ? STORAGE_KEYS.PARENT_COMPLETED : STORAGE_KEYS.CHILD_COMPLETED;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    throw error;
  }
};

/**
 * Get the appropriate storage key for a role
 */
export const getStorageKey = (role: UserRole): string => {
  return role === 'parent' ? STORAGE_KEYS.PARENT_COMPLETED : STORAGE_KEYS.CHILD_COMPLETED;
};

export { STORAGE_KEYS };
