/**
 * Database Types
 *
 * Type definitions for Supabase database tables
 */

export type UserRole = 'parent' | 'child';
export type ConnectionStatus = 'pending' | 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  reminder_times: string[]; // e.g., ["09:00", "14:00", "21:00"]
  start_date: string;
  end_date?: string;
  notes?: string;
  active: boolean;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  scheduled_at: string;
  taken: boolean;
  taken_at?: string;
  skipped_reason?: string;
  created_at: string;
  // Joined fields (from medications table)
  medications?: Medication;
}

export interface FamilyConnection {
  id: string;
  parent_id: string | null;
  child_id: string;
  invitation_code?: string;
  invitation_expires_at?: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  parent?: User;
  child?: User;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  hospital_name: string;
  appointment_date: string;
  notes?: string;
  created_at: string;
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: Error | null;
}

// Notification types
export interface NotificationData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  type: 'medication_reminder';
}

export interface MissedMedicationNotificationData {
  type: 'missed_medication';
  parentId: string;
  parentName: string;
  medicationName: string;
  scheduledTime: string;
  eventId: string;
}

export interface NotificationSchedule {
  medicationId: string;
  notificationIds: string[];
}

// Missed medication event (for child notifications)
export interface MissedMedicationEvent {
  id: string;
  parent_id: string;
  medication_id: string;
  medication_name: string;
  scheduled_time: string;
  skip_reason?: string;
  notified: boolean;
  read_at?: string;
  created_at: string;
  // Joined fields
  parent?: User;
}

// Notification preferences
export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  missed_medication_alert: boolean;
  daily_summary: boolean;
  created_at: string;
  updated_at: string;
}

// Child push token info
export interface ChildPushTokenInfo {
  child_id: string;
  push_token: string;
  missed_alert_enabled: boolean;
}

// Scheduled medication for today's view
export interface ScheduledMedication {
  id: string; // unique key: medicationId-scheduledTime
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string; // "HH:mm" format
  scheduled_at: string; // Full ISO datetime
  taken: boolean;
  taken_at?: string;
  skipped_reason?: string;
  notes?: string;
}

// =====================================
// REPORT & ANALYTICS TYPES
// =====================================

/**
 * Time slot for medication pattern analysis
 * - morning: 06:00-12:00
 * - afternoon: 12:00-18:00
 * - evening: 18:00-22:00
 * - night: 22:00-06:00
 */
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Trend direction compared to previous period
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Per-medication adherence statistics
 */
export interface MedicationAdherence {
  medication_id: string;
  medication_name: string;
  dosage: string;
  total_scheduled: number;
  total_taken: number;
  adherence_rate: number;
}

/**
 * Time slot pattern for missed medication analysis
 */
export interface TimeSlotPattern {
  time_slot: TimeSlot;
  time_range: string; // e.g., "06:00-12:00"
  missed_count: number;
  total_count: number;
  miss_rate: number;
}

/**
 * Weekly adherence trend data
 */
export interface WeeklyTrend {
  week_start: string; // ISO date string
  week_end: string; // ISO date string
  week_label: string; // e.g., "1주차", "2주차"
  adherence_rate: number;
  trend: TrendDirection;
}
