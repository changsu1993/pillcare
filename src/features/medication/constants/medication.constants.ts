/**
 * Medication Form Constants
 *
 * Shared constants for medication add/edit screens.
 */

import type { FrequencyLabelKey, TimeLabelKey } from '../../../i18n/types';

/**
 * 복용 횟수 옵션 타입
 */
export interface FrequencyOption {
  value: string;
  labelKey: FrequencyLabelKey;
  timesPerDay: number;
}

/**
 * 복용 횟수 옵션
 */
export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily_1', labelKey: 'frequency.daily1', timesPerDay: 1 },
  { value: 'daily_2', labelKey: 'frequency.daily2', timesPerDay: 2 },
  { value: 'daily_3', labelKey: 'frequency.daily3', timesPerDay: 3 },
  { value: 'as_needed', labelKey: 'frequency.asNeeded', timesPerDay: 0 },
];

/**
 * 기본 알림 시간 (복용 횟수별)
 */
export const DEFAULT_TIMES: Record<string, string[]> = {
  daily_1: ['09:00'],
  daily_2: ['09:00', '21:00'],
  daily_3: ['09:00', '14:00', '21:00'],
  as_needed: [],
};

/**
 * 시간 라벨 키 (복용 횟수별)
 */
export const TIME_LABEL_KEYS: Record<number, TimeLabelKey[]> = {
  1: ['timeLabel.single'],
  2: ['timeLabel.morning', 'timeLabel.evening'],
  3: ['timeLabel.morning', 'timeLabel.lunch', 'timeLabel.evening'],
};
