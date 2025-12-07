/**
 * Missed Medication Events API
 *
 * Functions for managing missed medication events and notifications.
 */

import { supabase, getCurrentUserId } from '../common';
import type { MissedMedicationEvent } from '../../../types/database.types';

/**
 * Create missed medication event (for child notifications)
 * @param medicationId - Medication ID
 * @param medicationName - Medication name
 * @param scheduledTime - Scheduled time
 * @param skipReason - Skip reason (optional)
 * @returns Created event
 */
export const createMissedMedicationEvent = async (
  medicationId: string,
  medicationName: string,
  scheduledTime: Date,
  skipReason?: string
): Promise<MissedMedicationEvent> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('missed_medication_events')
    .insert({
      parent_id: userId,
      medication_id: medicationId,
      medication_name: medicationName,
      scheduled_time: scheduledTime.toISOString(),
      skip_reason: skipReason || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Send push notification to children about missed medication
 * Calls Supabase Edge Function
 * @param event - Missed medication event
 */
export const sendMissedMedicationPushNotification = async (
  event: MissedMedicationEvent
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        parent_id: event.parent_id,
        medication_name: event.medication_name,
        scheduled_time: event.scheduled_time,
        skip_reason: event.skip_reason,
        event_id: event.id,
      },
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    // Silently fail - push notification is not critical
    // The missed event is already recorded in the database
  }
};

/**
 * Get unread missed medication events for child
 * @param parentId - Parent user ID
 * @returns Array of unread events
 */
export const getUnreadMissedEvents = async (parentId: string): Promise<MissedMedicationEvent[]> => {
  const { data, error } = await supabase
    .from('missed_medication_events')
    .select('*, parent:parent_id(id, name, email)')
    .eq('parent_id', parentId)
    .is('read_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get recent missed medication events for child
 * @param parentId - Parent user ID
 * @param limit - Number of events to return (default: 10)
 * @returns Array of events
 */
export const getRecentMissedEvents = async (
  parentId: string,
  limit: number = 10
): Promise<MissedMedicationEvent[]> => {
  const { data, error } = await supabase
    .from('missed_medication_events')
    .select('*, parent:parent_id(id, name, email)')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Mark missed medication event as read
 * @param eventId - Event ID
 */
export const markMissedEventAsRead = async (eventId: string): Promise<void> => {
  const { error } = await supabase
    .from('missed_medication_events')
    .update({ read_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) throw error;
};

/**
 * Mark all missed events as read for a parent
 * @param parentId - Parent user ID
 */
export const markAllMissedEventsAsRead = async (parentId: string): Promise<void> => {
  const { error } = await supabase
    .from('missed_medication_events')
    .update({ read_at: new Date().toISOString() })
    .eq('parent_id', parentId)
    .is('read_at', null);

  if (error) throw error;
};
