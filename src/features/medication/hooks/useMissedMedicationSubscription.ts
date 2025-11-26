/**
 * useMissedMedicationSubscription Hook
 *
 * Custom hook for subscribing to missed medication events in the child app.
 * Uses Supabase realtime to receive notifications when parent misses medication.
 *
 * Usage:
 * ```typescript
 * const { events, unreadCount, markAsRead, isLoading } =
 *   useMissedMedicationSubscription(parentId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MissedMedicationEvent,
  NotificationPreferences,
} from '../../../shared/types/database.types';
import {
  getUnreadMissedEvents,
  getRecentMissedEvents,
  markMissedEventAsRead,
  markAllMissedEventsAsRead,
  subscribeMissedMedicationEvents,
  getNotificationPreferences,
} from '../../../shared/services/api';
import { sendMissedMedicationNotificationToChild } from '../../notifications/services/notifications';

interface UseMissedMedicationSubscriptionResult {
  events: MissedMedicationEvent[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (eventId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for subscribing to missed medication events
 *
 * @param parentId - Parent user ID to subscribe to (null if no connection)
 * @returns Missed medication events and management functions
 *
 * @description
 * This hook:
 * 1. Loads initial missed events from database
 * 2. Subscribes to realtime updates
 * 3. Shows local notification when new event arrives
 * 4. Provides functions to mark events as read
 */
export const useMissedMedicationSubscription = (
  parentId: string | null
): UseMissedMedicationSubscriptionResult => {
  const [events, setEvents] = useState<MissedMedicationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!parentId) {
      setEvents([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load events and preferences in parallel
      const [recentEvents, unreadEvents, prefs] = await Promise.all([
        getRecentMissedEvents(parentId, 20),
        getUnreadMissedEvents(parentId),
        getNotificationPreferences(),
      ]);

      setEvents(recentEvents);
      setUnreadCount(unreadEvents.length);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading missed events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!parentId) return;

    // Subscribe to new events
    const unsubscribe = subscribeMissedMedicationEvents(parentId, async (newEvent) => {
      console.log('New missed medication event received:', newEvent);

      // Add to events list
      setEvents((prev) => [newEvent, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show local notification if alerts are enabled
      const shouldNotify =
        preferences?.push_enabled !== false && preferences?.missed_medication_alert !== false;

      if (shouldNotify) {
        // Get parent name from event or use default
        const parentName = (newEvent.parent as any)?.name || '부모님';

        await sendMissedMedicationNotificationToChild({
          parentId: newEvent.parent_id,
          parentName,
          medicationName: newEvent.medication_name,
          scheduledTime: newEvent.scheduled_time,
          eventId: newEvent.id,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [parentId, preferences]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mark single event as read
  const markAsRead = useCallback(async (eventId: string) => {
    try {
      await markMissedEventAsRead(eventId);

      // Update local state
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, read_at: new Date().toISOString() } : e))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking event as read:', err);
      throw err;
    }
  }, []);

  // Mark all events as read
  const markAllAsRead = useCallback(async () => {
    if (!parentId) return;

    try {
      await markAllMissedEventsAsRead(parentId);

      // Update local state
      const now = new Date().toISOString();
      setEvents((prev) => prev.map((e) => (e.read_at ? e : { ...e, read_at: now })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all events as read:', err);
      throw err;
    }
  }, [parentId]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    events,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};

export default useMissedMedicationSubscription;
