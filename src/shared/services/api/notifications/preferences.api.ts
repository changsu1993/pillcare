/**
 * Notification Preferences API
 *
 * Functions for managing user notification preferences.
 */

import { supabase, getCurrentUserId } from '../common';
import type { NotificationPreferences } from '../../../types/database.types';

/**
 * Get notification preferences for current user
 * @returns Notification preferences or null
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences | null> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found - return null
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Update notification preferences for current user
 * @param updates - Partial preferences to update
 * @returns Updated preferences
 */
export const updateNotificationPreferences = async (
  updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<NotificationPreferences> => {
  const userId = await getCurrentUserId();

  // Try to update existing preferences
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new with defaults
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        push_enabled: updates.push_enabled ?? true,
        missed_medication_alert: updates.missed_medication_alert ?? true,
        daily_summary: updates.daily_summary ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
