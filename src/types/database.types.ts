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
