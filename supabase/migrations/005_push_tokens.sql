-- PillCare Database Schema
-- Migration 005: Push Token Storage for Remote Notifications
-- Created: 2025-11-22
--
-- This migration adds push token storage for enabling push notifications
-- to children when parents miss medications.

-- =====================================================
-- 1. ADD PUSH TOKEN COLUMNS TO USERS TABLE
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

-- Index for faster push token lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- =====================================================
-- 2. MISSED MEDICATION EVENTS TABLE
-- =====================================================
-- Stores missed medication events for child app to poll/subscribe
-- This is MVP approach since we cannot send direct push notifications
-- without a backend server.
CREATE TABLE IF NOT EXISTS missed_medication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  skip_reason TEXT,
  notified BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_missed_events_parent_id ON missed_medication_events(parent_id);
CREATE INDEX IF NOT EXISTS idx_missed_events_notified ON missed_medication_events(notified);
CREATE INDEX IF NOT EXISTS idx_missed_events_created_at ON missed_medication_events(created_at DESC);

-- =====================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- =====================================================
-- Stores user notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  missed_medication_alert BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

-- =====================================================
-- 4. UPDATE TRIGGER FOR NOTIFICATION PREFERENCES
-- =====================================================
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE missed_medication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Missed medication events policies
-- Parents can insert events for themselves
CREATE POLICY "Parents can insert their own missed events"
  ON missed_medication_events
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Parents can view their own events
CREATE POLICY "Parents can view their own missed events"
  ON missed_medication_events
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- Children can view events from connected parents
CREATE POLICY "Children can view connected parent events"
  ON missed_medication_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_connections
      WHERE family_connections.parent_id = missed_medication_events.parent_id
        AND family_connections.child_id = auth.uid()
        AND family_connections.status = 'active'
    )
  );

-- Children can update read_at for events from connected parents
CREATE POLICY "Children can mark events as read"
  ON missed_medication_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_connections
      WHERE family_connections.parent_id = missed_medication_events.parent_id
        AND family_connections.child_id = auth.uid()
        AND family_connections.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_connections
      WHERE family_connections.parent_id = missed_medication_events.parent_id
        AND family_connections.child_id = auth.uid()
        AND family_connections.status = 'active'
    )
  );

-- Notification preferences policies
-- Users can manage their own preferences
CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. FUNCTION TO GET CHILDREN PUSH TOKENS FOR A PARENT
-- =====================================================
CREATE OR REPLACE FUNCTION get_children_push_tokens(parent_user_id UUID)
RETURNS TABLE(child_id UUID, push_token TEXT, missed_alert_enabled BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.child_id,
    u.push_token,
    COALESCE(np.missed_medication_alert, true) as missed_alert_enabled
  FROM family_connections fc
  JOIN users u ON u.id = fc.child_id
  LEFT JOIN notification_preferences np ON np.user_id = fc.child_id
  WHERE fc.parent_id = parent_user_id
    AND fc.status = 'active'
    AND u.push_token IS NOT NULL
    AND COALESCE(np.push_enabled, true) = true
    AND COALESCE(np.missed_medication_alert, true) = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_children_push_tokens(UUID) TO authenticated;
