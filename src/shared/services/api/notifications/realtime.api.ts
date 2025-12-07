/**
 * Realtime Subscriptions API
 *
 * Functions for subscribing to real-time events via Supabase.
 */

import { supabase } from '../common';
import type { MissedMedicationEvent } from '../../../types/database.types';

/**
 * Subscribe to missed medication events for a parent
 * Used by child app to receive real-time notifications
 *
 * @param parentId - Parent user ID to subscribe to
 * @param callback - Function to call when new event arrives
 * @returns Unsubscribe function
 */
export const subscribeMissedMedicationEvents = (
  parentId: string,
  callback: (event: MissedMedicationEvent) => void
): (() => void) => {
  const channel = supabase
    .channel(`missed_events_${parentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'missed_medication_events',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload) => {
        if (__DEV__) {
          console.log('새 미복용 이벤트 수신:', payload);
        }
        callback(payload.new as MissedMedicationEvent);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};
