/**
 * API Service
 *
 * Helper functions for interacting with Supabase database.
 * All functions handle errors and return structured responses.
 */

import { supabase } from './supabase';

/**
 * =====================================
 * MEDICATIONS API
 * =====================================
 */

/**
 * Get all active medications for current user
 * @returns {Promise<Array>} List of medications
 */
export const getMedications = async () => {
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
 * @param {string} medicationId
 * @returns {Promise<Object>} Medication object
 */
export const getMedication = async (medicationId) => {
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
 * @param {Object} medication - Medication data
 * @returns {Promise<Object>} Created medication
 */
export const createMedication = async (medication) => {
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
 * @param {string} medicationId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated medication
 */
export const updateMedication = async (medicationId, updates) => {
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
 * @param {string} medicationId
 * @returns {Promise<void>}
 */
export const deleteMedication = async (medicationId) => {
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
 * @param {string} medicationId - Optional, filter by medication
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>} List of logs
 */
export const getMedicationLogs = async (medicationId, startDate, endDate) => {
  let query = supabase
    .from('medication_logs')
    .select('*, medications(name, dosage, color)')
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
 * @returns {Promise<Array>} Today's logs
 */
export const getTodayLogs = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getMedicationLogs(null, today, tomorrow);
};

/**
 * Log a medication as taken
 * @param {string} medicationId
 * @param {Date} scheduledAt
 * @param {Date} takenAt - When actually taken (default: now)
 * @returns {Promise<Object>} Created log
 */
export const logMedicationTaken = async (medicationId, scheduledAt, takenAt = new Date()) => {
  const { data, error} = await supabase
    .from('medication_logs')
    .upsert({
      medication_id: medicationId,
      scheduled_at: scheduledAt.toISOString(),
      taken: true,
      taken_at: takenAt.toISOString(),
    }, {
      onConflict: 'medication_id,scheduled_at',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Log a medication as missed/skipped
 * @param {string} medicationId
 * @param {Date} scheduledAt
 * @param {string} reason - Skip reason ('forgot', 'no_medication', 'felt_sick', 'at_hospital', 'other')
 * @returns {Promise<Object>} Created log
 */
export const logMedicationMissed = async (medicationId, scheduledAt, reason = null) => {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert({
      medication_id: medicationId,
      scheduled_at: scheduledAt.toISOString(),
      taken: false,
      skipped_reason: reason,
    }, {
      onConflict: 'medication_id,scheduled_at',
    })
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
 * @returns {Promise<Array>} List of connections
 */
export const getFamilyConnections = async () => {
  const { data, error } = await supabase
    .from('family_connections')
    .select(`
      *,
      parent:parent_user_id(id, name, email, phone),
      child:child_user_id(id, name, email, phone)
    `)
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
};

/**
 * Create a family connection invitation (child creates code)
 * @returns {Promise<Object>} Invitation with code
 */
export const createFamilyInvitation = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Call database function to generate unique code
  const { data: code, error: codeError } = await supabase
    .rpc('generate_invitation_code');

  if (codeError) throw codeError;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

  const { data, error } = await supabase
    .from('family_connections')
    .insert({
      child_user_id: user.id,
      parent_user_id: null, // Will be filled when parent accepts
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
 * @param {string} invitationCode - 6-digit code
 * @returns {Promise<Object>} Accepted connection
 */
export const acceptFamilyInvitation = async (invitationCode) => {
  const { data: { user } } = await supabase.auth.getUser();

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
      parent_user_id: user.id,
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
 * @param {string} connectionId
 * @returns {Promise<void>}
 */
export const removeFamilyConnection = async (connectionId) => {
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
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();

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
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (updates) => {
  const { data: { user } } = await supabase.auth.getUser();

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
