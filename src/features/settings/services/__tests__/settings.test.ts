/**
 * Settings Service Tests
 *
 * Tests for app settings persistence using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
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
  getVoiceSpeed,
  setVoiceSpeed,
  resetSettings,
  DEFAULT_SETTINGS,
  AppSettings,
} from '../settings';

// AsyncStorage is automatically mocked by jest setup

describe('Settings Service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('getSettings', () => {
    it('should return default settings when no settings stored', async () => {
      const settings = await getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should return stored settings merged with defaults', async () => {
      const storedSettings = {
        voiceGuidanceEnabled: false,
      };

      await AsyncStorage.setItem('@PillCare:settings', JSON.stringify(storedSettings));

      const settings = await getSettings();

      expect(settings).toEqual({
        ...DEFAULT_SETTINGS,
        voiceGuidanceEnabled: false,
      });
    });

    it('should return default settings on parse error', async () => {
      await AsyncStorage.setItem('@PillCare:settings', 'invalid-json');

      const settings = await getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('should save partial settings and merge with existing', async () => {
      await saveSettings({ voiceGuidanceEnabled: false });

      const storedValue = await AsyncStorage.getItem('@PillCare:settings');
      const parsed = JSON.parse(storedValue!);

      expect(parsed.voiceGuidanceEnabled).toBe(false);
      expect(parsed.vibrationEnabled).toBe(true); // Default value
      expect(parsed.voiceSpeed).toBe(0.85); // Default value
    });

    it('should return updated settings after save', async () => {
      const result = await saveSettings({ vibrationEnabled: false });

      expect(result).toEqual({
        ...DEFAULT_SETTINGS,
        vibrationEnabled: false,
      });
    });

    it('should update existing settings', async () => {
      await saveSettings({ voiceGuidanceEnabled: false });
      const result = await saveSettings({ vibrationEnabled: false });

      expect(result).toEqual({
        voiceGuidanceEnabled: false,
        vibrationEnabled: false,
        voiceSpeed: 0.85,
      });
    });
  });

  describe('isVoiceGuidanceEnabled', () => {
    it('should return true by default', async () => {
      const result = await isVoiceGuidanceEnabled();

      expect(result).toBe(true);
    });

    it('should return stored value', async () => {
      await saveSettings({ voiceGuidanceEnabled: false });

      const result = await isVoiceGuidanceEnabled();

      expect(result).toBe(false);
    });

    it('should return true on error (fail-safe for elderly users)', async () => {
      // Mock getItem to throw
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const result = await isVoiceGuidanceEnabled();

      expect(result).toBe(true);
    });
  });

  describe('isVibrationEnabled', () => {
    it('should return true by default', async () => {
      const result = await isVibrationEnabled();

      expect(result).toBe(true);
    });

    it('should return stored value', async () => {
      await saveSettings({ vibrationEnabled: false });

      const result = await isVibrationEnabled();

      expect(result).toBe(false);
    });

    it('should return true on error (fail-safe)', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const result = await isVibrationEnabled();

      expect(result).toBe(true);
    });
  });

  describe('enableVoiceGuidance', () => {
    it('should set voiceGuidanceEnabled to true', async () => {
      await saveSettings({ voiceGuidanceEnabled: false });
      await enableVoiceGuidance();

      const settings = await getSettings();

      expect(settings.voiceGuidanceEnabled).toBe(true);
    });
  });

  describe('disableVoiceGuidance', () => {
    it('should set voiceGuidanceEnabled to false', async () => {
      await disableVoiceGuidance();

      const settings = await getSettings();

      expect(settings.voiceGuidanceEnabled).toBe(false);
    });
  });

  describe('toggleVoiceGuidance', () => {
    it('should toggle from true to false', async () => {
      const result = await toggleVoiceGuidance();

      expect(result).toBe(false);
    });

    it('should toggle from false to true', async () => {
      await saveSettings({ voiceGuidanceEnabled: false });

      const result = await toggleVoiceGuidance();

      expect(result).toBe(true);
    });
  });

  describe('enableVibration', () => {
    it('should set vibrationEnabled to true', async () => {
      await saveSettings({ vibrationEnabled: false });
      await enableVibration();

      const settings = await getSettings();

      expect(settings.vibrationEnabled).toBe(true);
    });
  });

  describe('disableVibration', () => {
    it('should set vibrationEnabled to false', async () => {
      await disableVibration();

      const settings = await getSettings();

      expect(settings.vibrationEnabled).toBe(false);
    });
  });

  describe('toggleVibration', () => {
    it('should toggle from true to false', async () => {
      const result = await toggleVibration();

      expect(result).toBe(false);
    });

    it('should toggle from false to true', async () => {
      await saveSettings({ vibrationEnabled: false });

      const result = await toggleVibration();

      expect(result).toBe(true);
    });
  });

  describe('getVoiceSpeed', () => {
    it('should return default voice speed', async () => {
      const result = await getVoiceSpeed();

      expect(result).toBe(0.85);
    });

    it('should return stored voice speed', async () => {
      await saveSettings({ voiceSpeed: 0.7 });

      const result = await getVoiceSpeed();

      expect(result).toBe(0.7);
    });

    it('should return default on error', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const result = await getVoiceSpeed();

      expect(result).toBe(DEFAULT_SETTINGS.voiceSpeed);
    });
  });

  describe('setVoiceSpeed', () => {
    it('should set voice speed to slow (0.7)', async () => {
      await setVoiceSpeed(0.7);

      const settings = await getSettings();

      expect(settings.voiceSpeed).toBe(0.7);
    });

    it('should set voice speed to normal (0.85)', async () => {
      await setVoiceSpeed(0.85);

      const settings = await getSettings();

      expect(settings.voiceSpeed).toBe(0.85);
    });

    it('should set voice speed to fast (1.0)', async () => {
      await setVoiceSpeed(1.0);

      const settings = await getSettings();

      expect(settings.voiceSpeed).toBe(1.0);
    });
  });

  describe('resetSettings', () => {
    it('should clear storage and return default settings', async () => {
      await saveSettings({
        voiceGuidanceEnabled: false,
        vibrationEnabled: false,
        voiceSpeed: 0.7,
      });

      const result = await resetSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);

      // Verify storage was cleared
      const storedValue = await AsyncStorage.getItem('@PillCare:settings');
      expect(storedValue).toBeNull();
    });
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('should have voice guidance enabled by default (elderly-friendly)', () => {
    expect(DEFAULT_SETTINGS.voiceGuidanceEnabled).toBe(true);
  });

  it('should have vibration enabled by default', () => {
    expect(DEFAULT_SETTINGS.vibrationEnabled).toBe(true);
  });

  it('should have normal voice speed by default', () => {
    expect(DEFAULT_SETTINGS.voiceSpeed).toBe(0.85);
  });
});
