/**
 * Medication Logs API
 *
 * CRUD operations for medication logs (taken/missed tracking).
 */

import { supabase } from '../common';
import type { MedicationLog } from '../../../types/database.types';
import { getMedication, updateMedication } from '../medications';

/**
 * Get medication logs for a specific date range
 */
export const getMedicationLogs = async (
  medicationId: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<MedicationLog[]> => {
  let query = supabase
    .from('medication_logs')
    .select('*, medications(name, dosage)')
    .order('scheduled_at', { ascending: false });

  if (medicationId) {
    query = query.eq('medication_id', medicationId);
  }

  if (startDate) {
    query = query.gte('scheduled_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('scheduled_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Get today's medication logs
 */
export const getTodayLogs = async (): Promise<MedicationLog[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getMedicationLogs(null, today, tomorrow);
};

/**
 * Log a medication as taken and decrement inventory
 */
export const logMedicationTaken = async (
  medicationId: string,
  scheduledAt: Date,
  takenAt: Date = new Date()
): Promise<MedicationLog> => {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      {
        medication_id: medicationId,
        scheduled_at: scheduledAt.toISOString(),
        taken: true,
        taken_at: takenAt.toISOString(),
      },
      {
        onConflict: 'medication_id,scheduled_at',
      }
    )
    .select()
    .single();

  if (error) throw error;

  // Auto-decrement inventory if enabled
  try {
    await decrementMedicationQuantity(medicationId);
  } catch (decrementError) {
    // Log error but don't fail the medication log
    console.error('Failed to decrement medication quantity:', decrementError);
  }

  return data;
};

/**
 * Decrement medication quantity after taking a dose
 * Only decrements if auto_decrement is true and remaining_quantity is not null
 */
export const decrementMedicationQuantity = async (medicationId: string): Promise<void> => {
  // First get the medication to check auto_decrement and current quantity
  const medication = await getMedication(medicationId);

  // Skip if tracking is disabled or auto_decrement is off
  if (
    medication.remaining_quantity === null ||
    medication.remaining_quantity === undefined ||
    !medication.auto_decrement
  ) {
    return;
  }

  const quantityPerDose = medication.quantity_per_dose ?? 1;
  const newQuantity = Math.max(0, medication.remaining_quantity - quantityPerDose);

  // Update the quantity
  await updateMedication(medicationId, { remaining_quantity: newQuantity });

  if (__DEV__) {
    console.log(
      `Decremented ${medication.name} quantity: ${medication.remaining_quantity} -> ${newQuantity}`
    );
  }
};

/**
 * Log a medication as missed/skipped
 */
export const logMedicationMissed = async (
  medicationId: string,
  scheduledAt: Date,
  reason: string | null = null
): Promise<MedicationLog> => {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      {
        medication_id: medicationId,
        scheduled_at: scheduledAt.toISOString(),
        taken: false,
        skipped_reason: reason,
      },
      {
        onConflict: 'medication_id,scheduled_at',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};
