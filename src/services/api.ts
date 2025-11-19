/**
 * API Service
 *
 * Helper functions for interacting with Supabase database.
 * All functions handle errors and return structured responses.
 */

import { supabase } from './supabase';
import {
  User,
  Medication,
  MedicationLog,
  FamilyConnection,
} from '../types/database.types';

/**
 * =====================================
 * MEDICATIONS API
 * =====================================
 */

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
  const { data, error } = await supabase
    .from('medications')
    .insert([medication])
    .select()
    .single();

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
 * =====================================
 * MEDICATION LOGS API
 * =====================================
 */

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
 * Log a medication as taken
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
  return data;
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

/**
 * =====================================
 * FAMILY CONNECTIONS API
 * =====================================
 */

/**
 * Get all family connections for current user
 */
export const getFamilyConnections = async (): Promise<FamilyConnection[]> => {
  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      *,
      parent:parent_id(id, name, email, phone_number),
      child:child_id(id, name, email, phone_number)
    `
    )
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
};

/**
 * Create a family connection invitation (child creates code)
 */
export const createFamilyInvitation = async (): Promise<FamilyConnection> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Call database function to generate unique code
  const { data: code, error: codeError } = await supabase.rpc(
    'generate_invitation_code'
  );

  if (codeError) throw codeError;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

  const { data, error } = await supabase
    .from('family_connections')
    .insert({
      child_id: user.id,
      parent_id: null, // Will be filled when parent accepts
      invitation_code: code,
      invitation_expires_at: expiresAt.toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Accept a family invitation (parent enters code)
 */
export const acceptFamilyInvitation = async (
  invitationCode: string
): Promise<FamilyConnection> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Find invitation by code
  const { data: invitation, error: findError } = await supabase
    .from('family_connections')
    .select('*')
    .eq('invitation_code', invitationCode)
    .eq('status', 'pending')
    .gt('invitation_expires_at', new Date().toISOString())
    .single();

  if (findError) throw new Error('Invalid or expired invitation code');

  // Update invitation with parent user ID and activate
  const { data, error } = await supabase
    .from('family_connections')
    .update({
      parent_id: user.id,
      status: 'active',
    })
    .eq('id', invitation.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Remove a family connection
 */
export const removeFamilyConnection = async (
  connectionId: string
): Promise<void> => {
  const { error } = await supabase
    .from('family_connections')
    .update({ status: 'inactive' })
    .eq('id', connectionId);

  if (error) throw error;
};

/**
 * =====================================
 * USER API
 * =====================================
 */

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  updates: Partial<User>
): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
