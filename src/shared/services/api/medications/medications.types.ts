/**
 * Medication Form Data Types
 *
 * Type definitions for medication form data used in AddMedicationScreen
 * and medication creation/update operations.
 */

/**
 * Medication form data type
 * - Used in AddMedicationScreen for creating/updating medications
 */
export interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
  reminder_times: string[]; // ["09:00", "14:00", "21:00"]
  start_date: string; // "YYYY-MM-DD"
  end_date?: string; // "YYYY-MM-DD"
  notes?: string;
  // Inventory tracking fields (optional)
  remaining_quantity?: number | null;
  refill_threshold?: number;
  quantity_per_dose?: number;
  auto_decrement?: boolean;
}
