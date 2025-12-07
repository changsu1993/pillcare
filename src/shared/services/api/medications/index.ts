/**
 * Medications API Module
 *
 * Exports all medication-related API functions and types.
 */

// Types
export type { MedicationFormData } from './medications.types';

// CRUD operations with notifications
export {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  createMedicationWithNotifications,
  updateMedicationWithNotifications,
  deleteMedicationWithNotifications,
  scheduleAllMedicationNotifications,
  toggleMedicationActive,
} from './medications.api';

// Form utilities
export { createMedicationFromForm, createMedicationForParent } from './medications.forms';
