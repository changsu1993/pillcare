/**
 * Voice Service - Text-to-Speech for elderly users
 *
 * Uses expo-speech for Korean voice guidance.
 * Optimized for elderly users with slower speech rate.
 *
 * Features:
 * - Korean TTS (ko-KR)
 * - Slower speech rate (0.85) for clarity
 * - Medication reminder announcements
 * - Confirmation feedback
 * - Graceful error handling
 */

import * as Speech from 'expo-speech';
import { getVoiceSpeed } from '../../settings/services/settings';

// Voice configuration optimized for elderly users
const VOICE_CONFIG: Speech.SpeechOptions = {
  language: 'ko-KR',
  rate: 0.85, // Default slower for elderly users (will be overridden by settings)
  pitch: 1.0,
};

/**
 * Speak text with Korean voice
 * @param text - Text to speak
 * @param options - Optional speech options override
 * @returns Promise that resolves when speech starts (not when it ends)
 */
export const speak = async (
  text: string,
  options?: Partial<Speech.SpeechOptions>
): Promise<void> => {
  try {
    // Stop any ongoing speech first
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
    }

    // Get current voice speed from settings
    const speed = await getVoiceSpeed();

    // Speak with merged options
    Speech.speak(text, {
      ...VOICE_CONFIG,
      rate: speed, // Use speed from settings
      ...options,
    });
  } catch (error) {
    console.error('[VoiceService] Error speaking:', error);
    // Fail silently - voice is supplementary, not critical
  }
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = async (): Promise<void> => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('[VoiceService] Error stopping speech:', error);
  }
};

/**
 * Check if currently speaking
 * @returns True if speech is in progress
 */
export const isSpeaking = async (): Promise<boolean> => {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('[VoiceService] Error checking speech status:', error);
    return false;
  }
};

/**
 * Speak medication reminder announcement
 * Example: "혈압약 드실 시간입니다"
 * @param medicationName - Name of the medication
 * @param dosage - Optional dosage information
 */
export const speakMedicationReminder = async (
  medicationName: string,
  dosage?: string
): Promise<void> => {
  let message = `${medicationName} 드실 시간입니다.`;

  if (dosage) {
    message += ` ${dosage}을 복용해주세요.`;
  }

  await speak(message);
};

/**
 * Speak confirmation after taking medication
 * Example: "혈압약 복용이 기록되었습니다"
 * @param medicationName - Name of the medication
 */
export const speakConfirmation = async (medicationName: string): Promise<void> => {
  const message = `${medicationName} 복용이 기록되었습니다. 잘하셨어요!`;
  await speak(message);
};

/**
 * Speak success message
 * Example: "잘하셨어요! 다음 복약 시간에 알려드리겠습니다."
 */
export const speakSuccess = async (): Promise<void> => {
  const message = '잘하셨어요! 다음 복약 시간에 알려드리겠습니다.';
  await speak(message);
};

/**
 * Speak skip reason prompt
 * Example: "못 드신 이유를 선택해주세요"
 */
export const speakSkipPrompt = async (): Promise<void> => {
  const message = '못 드신 이유를 선택해주세요.';
  await speak(message);
};

/**
 * Speak generic message
 * Useful for custom announcements
 * @param message - Message to speak
 */
export const speakMessage = async (message: string): Promise<void> => {
  await speak(message);
};

/**
 * Get available voices for debugging
 * @returns List of available voices
 */
export const getAvailableVoices = async (): Promise<Speech.Voice[]> => {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.error('[VoiceService] Error getting voices:', error);
    return [];
  }
};

/**
 * Test voice with a sample message
 * Useful for settings screen preview
 */
export const testVoice = async (): Promise<void> => {
  const message = '음성 안내 테스트입니다. 이 목소리가 들리시나요?';
  await speak(message);
};

export default {
  speak,
  stopSpeaking,
  isSpeaking,
  speakMedicationReminder,
  speakConfirmation,
  speakSuccess,
  speakSkipPrompt,
  speakMessage,
  getAvailableVoices,
  testVoice,
};
