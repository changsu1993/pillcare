/**
 * Settings Context - Global settings provider
 *
 * Provides app settings throughout the application.
 * Auto-loads settings on mount.
 * Provides convenient hooks for reading and updating settings.
 *
 * Usage:
 * ```tsx
 * // Wrap app with provider
 * <SettingsProvider>
 *   <App />
 * </SettingsProvider>
 *
 * // Use in components
 * const { settings, updateSettings, isLoading } = useSettings();
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
} from '../services/settings';

/**
 * Settings context value type
 */
interface SettingsContextValue {
  /** Current settings */
  settings: AppSettings;
  /** Loading state */
  isLoading: boolean;
  /** Update settings (partial update supported) */
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  /** Reload settings from storage */
  reloadSettings: () => Promise<void>;
  /** Check if voice guidance is enabled */
  isVoiceEnabled: boolean;
  /** Check if vibration is enabled */
  isVibrationEnabled: boolean;
}

// Create context with undefined initial value
const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

/**
 * Settings provider component
 */
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const loaded = await getSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('[SettingsContext] Error loading settings:', error);
      // Keep defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      try {
        const updated = await saveSettings(updates);
        setSettings(updated);
      } catch (error) {
        console.error('[SettingsContext] Error updating settings:', error);
        throw error;
      }
    },
    []
  );

  const reloadSettings = useCallback(async () => {
    await loadSettings();
  }, []);

  const value: SettingsContextValue = {
    settings,
    isLoading,
    updateSettings,
    reloadSettings,
    isVoiceEnabled: settings.voiceGuidanceEnabled,
    isVibrationEnabled: settings.vibrationEnabled,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access settings context
 * @throws Error if used outside SettingsProvider
 */
export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};

/**
 * Hook to check if voice guidance is enabled
 * Convenience hook for common use case
 */
export const useVoiceEnabled = (): boolean => {
  const { isVoiceEnabled } = useSettings();
  return isVoiceEnabled;
};

/**
 * Hook to check if vibration is enabled
 * Convenience hook for common use case
 */
export const useVibrationEnabled = (): boolean => {
  const { isVibrationEnabled } = useSettings();
  return isVibrationEnabled;
};

export default {
  SettingsProvider,
  useSettings,
  useVoiceEnabled,
  useVibrationEnabled,
};
