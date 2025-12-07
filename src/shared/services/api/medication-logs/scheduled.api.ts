/**
 * Scheduled Medications API
 *
 * Functions for generating and managing today's medication schedule.
 */

import type { ScheduledMedication, MedicationLog } from '../../../types/database.types';
import { getMedications } from '../medications';
import { getMedicationLogs } from './logs.api';

/**
 * Get today's scheduled medications
 *
 * This function:
 * 1. Gets all active medications for the user
 * 2. Generates today's scheduled times from reminder_times
 * 3. Checks medication_logs for taken/missed status
 * 4. Returns a combined list for display
 */
export const getTodayScheduledMedications = async (): Promise<ScheduledMedication[]> => {
  // Get all active medications
  const medications = await getMedications();

  if (medications.length === 0) {
    return [];
  }

  // Get today's date boundaries
  const today = new Date();

  // Get existing logs for today
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const existingLogs = await getMedicationLogs(null, todayStart, todayEnd);

  // Create a map of existing logs by medication_id and scheduled_at
  const logsMap = new Map<string, MedicationLog>();
  existingLogs.forEach((log) => {
    const key = `${log.medication_id}-${log.scheduled_at}`;
    logsMap.set(key, log);
  });

  // Generate scheduled medications for today
  const scheduledMedications: ScheduledMedication[] = [];

  for (const med of medications) {
    // Check if medication is active for today
    const startDate = new Date(med.start_date);
    const endDate = med.end_date ? new Date(med.end_date) : null;

    // Skip if today is before start date or after end date
    if (today < startDate) continue;
    if (endDate && today > endDate) continue;

    // Generate scheduled times for today
    for (const time of med.reminder_times) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledAt = new Date(today);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const scheduledAtStr = scheduledAt.toISOString();
      const logKey = `${med.id}-${scheduledAtStr}`;
      const existingLog = logsMap.get(logKey);

      scheduledMedications.push({
        id: `${med.id}-${time}`,
        medication_id: med.id,
        medication_name: med.name,
        dosage: med.dosage,
        scheduled_time: time,
        scheduled_at: scheduledAtStr,
        taken: existingLog?.taken ?? false,
        taken_at: existingLog?.taken_at,
        skipped_reason: existingLog?.skipped_reason,
        notes: med.notes,
      });
    }
  }

  // Sort by scheduled time
  scheduledMedications.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

  return scheduledMedications;
};
