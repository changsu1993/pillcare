/**
 * API Service Index
 *
 * Re-exports all API modules for backward compatibility.
 * Allows gradual migration from the monolithic api.ts.
 *
 * Usage:
 * import { getMedications, getUserProfile } from '@/shared/services/api';
 */

// Common utilities
export { supabase, getCurrentUserId, getCurrentUser } from './common';

// Users
export { getUserProfile, updateUserProfile } from './users';

// Medications
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
  createMedicationFromForm,
  createMedicationForParent,
} from './medications';
export type { MedicationFormData } from './medications';

// Medication Logs
export {
  getMedicationLogs,
  getTodayLogs,
  logMedicationTaken,
  logMedicationMissed,
  decrementMedicationQuantity,
  getTodayScheduledMedications,
} from './medication-logs';

// Family
export {
  getFamilyConnections,
  hasActiveConnection,
  removeFamilyConnection,
  getConnectedChildren,
  getConnectedParent,
  generateInvitationCode,
  connectWithCode,
} from './family';

// Appointments
export {
  getAppointments,
  getAppointment,
  getParentAppointments,
  getUpcomingAppointments,
  createAppointment,
  createAppointmentForParent,
  updateAppointment,
  deleteAppointment,
} from './appointments';
export type { AppointmentFormData } from './appointments';

// Notifications
export {
  savePushToken,
  getChildrenPushTokens,
  createMissedMedicationEvent,
  sendMissedMedicationPushNotification,
  getUnreadMissedEvents,
  getRecentMissedEvents,
  markMissedEventAsRead,
  markAllMissedEventsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  subscribeMissedMedicationEvents,
} from './notifications';

// Analytics
export {
  TIME_SLOT_CONFIG,
  getTimeSlotFromHour,
  getParentMedications,
  getParentMedicationLogs,
  getParentTodayLogs,
  calculateAdherenceRate,
  getWeeklyAdherenceData,
  getMonthlyAdherenceData,
  getMedicationAdherenceByDrug,
  getMissedMedicationPattern,
  getAdherenceTrend,
} from './analytics';
