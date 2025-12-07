/**
 * Medications API
 *
 * CRUD operations for medications with notification scheduling.
 */

import { supabase } from '../../supabase';
import { Medication } from '../../../types/database.types';
import {
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  rescheduleMedicationNotifications,
} from '../../../../features/notifications/services/notifications';

// Local storage for notification schedules (in-memory)
// TODO: Store in Supabase for cross-device sync
const notificationSchedules: Map<string, string[]> = new Map();

/**
 * Get all active medications for current user
 */
export const getMedications = async (): Promise<Medication[]> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single medication by ID
 */
export const getMedication = async (medicationId: string): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', medicationId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new medication
 */
export const createMedication = async (
  medication: Omit<Medication, 'id' | 'created_at'>
): Promise<Medication> => {
  const { data, error } = await supabase.from('medications').insert([medication]).select().single();

  if (error) throw error;
  return data;
};

/**
 * Update a medication
 */
export const updateMedication = async (
  medicationId: string,
  updates: Partial<Medication>
): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', medicationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a medication (soft delete - sets active = false)
 */
export const deleteMedication = async (medicationId: string): Promise<void> => {
  const { error } = await supabase
    .from('medications')
    .update({ active: false })
    .eq('id', medicationId);

  if (error) throw error;
};

/**
 * Create medication with automatic notification scheduling
 */
export const createMedicationWithNotifications = async (
  medication: Omit<Medication, 'id' | 'created_at'>
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // 1. Save medication to database
  const savedMedication = await createMedication(medication);

  // 2. Schedule notifications
  try {
    const notificationIds = await scheduleMedicationNotifications(savedMedication);
    notificationSchedules.set(savedMedication.id, notificationIds);

    // SECURITY: Only log in development mode to prevent data leakage
    // Reference: OWASP - Security Logging and Monitoring Failures (A09:2021)
    if (__DEV__) {
      console.log(
        `Medication created with notifications: ${savedMedication.name} (${notificationIds.length} notifications)`
      );
    }

    return { medication: savedMedication, notificationIds };
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
    // Medication is saved even if notification scheduling fails
    return { medication: savedMedication, notificationIds: [] };
  }
};

/**
 * Update medication with notification rescheduling
 */
export const updateMedicationWithNotifications = async (
  medicationId: string,
  updates: Partial<Medication>
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // 1. Update medication in database
  const updatedMedication = await updateMedication(medicationId, updates);

  // 2. Cancel existing notifications and reschedule
  try {
    const oldNotificationIds = notificationSchedules.get(medicationId) || [];
    const newNotificationIds = await rescheduleMedicationNotifications(
      updatedMedication,
      oldNotificationIds
    );
    notificationSchedules.set(medicationId, newNotificationIds);

    if (__DEV__) {
      console.log(
        `Medication updated with rescheduled notifications: ${updatedMedication.name} (${newNotificationIds.length} notifications)`
      );
    }

    return { medication: updatedMedication, notificationIds: newNotificationIds };
  } catch (error) {
    console.error('Failed to reschedule notifications:', error);
    return { medication: updatedMedication, notificationIds: [] };
  }
};

/**
 * Delete medication with automatic notification cancellation
 */
export const deleteMedicationWithNotifications = async (medicationId: string): Promise<void> => {
  // 1. Cancel notifications
  try {
    const notificationIds = notificationSchedules.get(medicationId) || [];
    if (notificationIds.length > 0) {
      await cancelMedicationNotifications(notificationIds);
      notificationSchedules.delete(medicationId);
      if (__DEV__) {
        console.log(`Medication deleted with notifications cancelled: ${medicationId}`);
      }
    }
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }

  // 2. Soft delete medication
  await deleteMedication(medicationId);
};

/**
 * Schedule notifications for all active medications
 * (Used on app restart or after permission grant)
 */
export const scheduleAllMedicationNotifications = async (): Promise<void> => {
  try {
    const medications = await getMedications();

    for (const medication of medications) {
      if (medication.active && medication.reminder_times.length > 0) {
        const notificationIds = await scheduleMedicationNotifications(medication);
        notificationSchedules.set(medication.id, notificationIds);
      }
    }

    if (__DEV__) {
      console.log(`Scheduled notifications for ${medications.length} medications.`);
    }
  } catch (error) {
    console.error('Failed to schedule all medication notifications:', error);
    throw error;
  }
};

/**
 * Toggle medication active status
 * @param medicationId - Medication ID
 * @param active - Active status
 * @returns Updated medication
 */
export const toggleMedicationActive = async (
  medicationId: string,
  active: boolean
): Promise<Medication> => {
  return updateMedication(medicationId, { active });
};
