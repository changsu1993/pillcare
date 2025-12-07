import { supabase } from '../common';
import type { Appointment } from '../../../types/database.types';
import type { AppointmentFormData } from './appointments.types';

/**
 * Get all appointments for current user (parent)
 * @returns List of appointments ordered by appointment date
 */
export const getAppointments = async (): Promise<Appointment[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single appointment by ID
 * @param appointmentId - Appointment ID
 * @returns Single appointment
 */
export const getAppointment = async (appointmentId: string): Promise<Appointment> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get parent's appointments (for child view)
 * @param parentId - Parent user ID
 * @returns List of parent's appointments
 */
export const getParentAppointments = async (parentId: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', parentId)
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get upcoming appointments for a user
 * @param userId - User ID
 * @param days - Number of days to look ahead (default: 7)
 * @returns List of upcoming appointments
 */
export const getUpcomingAppointments = async (
  userId: string,
  days: number = 7
): Promise<Appointment[]> => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('appointment_date', now.toISOString())
    .lte('appointment_date', futureDate.toISOString())
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new appointment
 * @param data - Appointment form data
 * @returns Created appointment
 */
export const createAppointment = async (data: AppointmentFormData): Promise<Appointment> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const appointmentData = {
    user_id: user.id,
    title: data.title.trim(),
    hospital_name: data.hospital_name.trim(),
    appointment_date:
      typeof data.appointment_date === 'string'
        ? data.appointment_date
        : data.appointment_date.toISOString(),
    notes: data.notes?.trim() || undefined,
  };

  const { data: created, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return created;
};

/**
 * Create appointment for parent (by child)
 * @param parentId - Parent user ID
 * @param data - Appointment form data
 * @returns Created appointment
 */
export const createAppointmentForParent = async (
  parentId: string,
  data: AppointmentFormData
): Promise<Appointment> => {
  const appointmentData = {
    user_id: parentId,
    title: data.title.trim(),
    hospital_name: data.hospital_name.trim(),
    appointment_date:
      typeof data.appointment_date === 'string'
        ? data.appointment_date
        : data.appointment_date.toISOString(),
    notes: data.notes?.trim() || undefined,
  };

  const { data: created, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return created;
};

/**
 * Update an appointment
 * @param appointmentId - Appointment ID
 * @param updates - Partial appointment data to update
 * @returns Updated appointment
 */
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<AppointmentFormData>
): Promise<Appointment> => {
  const updateData: Record<string, string> = {};

  if (updates.title !== undefined) {
    updateData.title = updates.title.trim();
  }
  if (updates.hospital_name !== undefined) {
    updateData.hospital_name = updates.hospital_name.trim();
  }
  if (updates.appointment_date !== undefined) {
    updateData.appointment_date =
      typeof updates.appointment_date === 'string'
        ? updates.appointment_date
        : updates.appointment_date.toISOString();
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes?.trim() || '';
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete an appointment
 * @param appointmentId - Appointment ID
 */
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);

  if (error) throw error;
};
