/**
 * Parent Data API
 *
 * Functions for accessing parent's medication data (used by child app).
 */

import { supabase } from '../common';
import type { Medication, MedicationLog } from '../../../types/database.types';

/**
 * Get parent's medications (for child view)
 * @param parentId - Parent user ID
 * @returns List of parent's active medications
 */
export const getParentMedications = async (parentId: string): Promise<Medication[]> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', parentId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get parent's medication logs for a date range
 * @param parentId - Parent user ID
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns List of medication logs with medication info
 */
export const getParentMedicationLogs = async (
  parentId: string,
  startDate: string,
  endDate: string
): Promise<MedicationLog[]> => {
  // First get all medication IDs for the parent
  const { data: medications, error: medError } = await supabase
    .from('medications')
    .select('id')
    .eq('user_id', parentId);

  if (medError) throw medError;
  if (!medications || medications.length === 0) return [];

  const medicationIds = medications.map((m) => m.id);

  // Then get logs for those medications
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*, medications(name, dosage, frequency)')
    .in('medication_id', medicationIds)
    .gte('scheduled_at', `${startDate}T00:00:00`)
    .lte('scheduled_at', `${endDate}T23:59:59`)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get parent's today's medication logs
 * @param parentId - Parent user ID
 * @returns List of today's medication logs
 */
export const getParentTodayLogs = async (parentId: string): Promise<MedicationLog[]> => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return getParentMedicationLogs(parentId, dateStr, dateStr);
};
