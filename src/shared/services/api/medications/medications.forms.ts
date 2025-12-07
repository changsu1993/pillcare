/**
 * Medication Form Utilities
 *
 * Form-to-API transformation functions for medication creation.
 */

import { supabase } from '../../supabase';
import { Medication } from '../../../types/database.types';
import { MedicationFormData } from './medications.types';
import { createMedicationWithNotifications } from './medications.api';

/**
 * Create medication from form data
 *
 * @param formData - Form data from AddMedicationScreen
 * @returns Created medication and notification IDs
 *
 * @description
 * - Converts form data to Medication type
 * - Saves to database
 * - Schedules notifications automatically
 *
 * @example
 * const result = await createMedicationFromForm({
 *   name: 'Blood Pressure Medicine',
 *   dosage: '1 tablet',
 *   frequency: 'daily_2',
 *   reminder_times: ['09:00', '21:00'],
 *   start_date: '2024-01-01',
 *   notes: '30 minutes after meal'
 * });
 */
export const createMedicationFromForm = async (
  formData: MedicationFormData
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // Get current user ID
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Login required.');

  // Convert form data to Medication type
  const medicationData: Omit<Medication, 'id' | 'created_at'> = {
    user_id: user.id,
    name: formData.name.trim(),
    dosage: formData.dosage.trim(),
    frequency: formData.frequency,
    reminder_times: formData.reminder_times,
    start_date: formData.start_date,
    end_date: formData.end_date || undefined,
    notes: formData.notes?.trim() || undefined,
    active: true,
    // Inventory tracking fields with defaults
    remaining_quantity: formData.remaining_quantity ?? null,
    refill_threshold: formData.refill_threshold ?? 7,
    quantity_per_dose: formData.quantity_per_dose ?? 1,
    auto_decrement: formData.auto_decrement ?? true,
  };

  // Create medication and schedule notifications
  return createMedicationWithNotifications(medicationData);
};

/**
 * Create medication for parent (by child user)
 *
 * @param parentId - Parent user ID
 * @param formData - Form data
 * @returns Created medication and notification IDs
 *
 * @example
 * const result = await createMedicationForParent('parent-uuid', {
 *   name: 'Blood Pressure Medicine',
 *   dosage: '1 tablet',
 *   frequency: 'daily_2',
 *   reminder_times: ['09:00', '21:00'],
 *   start_date: '2024-01-01',
 * });
 */
export const createMedicationForParent = async (
  parentId: string,
  formData: MedicationFormData
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // Convert form data to Medication type
  const medicationData: Omit<Medication, 'id' | 'created_at'> = {
    user_id: parentId,
    name: formData.name.trim(),
    dosage: formData.dosage.trim(),
    frequency: formData.frequency,
    reminder_times: formData.reminder_times,
    start_date: formData.start_date,
    end_date: formData.end_date || undefined,
    notes: formData.notes?.trim() || undefined,
    active: true,
    // Inventory tracking fields with defaults
    remaining_quantity: formData.remaining_quantity ?? null,
    refill_threshold: formData.refill_threshold ?? 7,
    quantity_per_dose: formData.quantity_per_dose ?? 1,
    auto_decrement: formData.auto_decrement ?? true,
  };

  // Create medication and schedule notifications
  return createMedicationWithNotifications(medicationData);
};
