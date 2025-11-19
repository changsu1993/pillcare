-- PillCare Database Schema
-- Migration 002: Enable Row Level Security (RLS)
-- Created: 2025-01-19

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- MEDICATIONS TABLE POLICIES
-- =====================================================

-- Parents can view their own medications
CREATE POLICY "Parents can view own medications"
  ON medications FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Children can view their parent's medications
    EXISTS (
      SELECT 1 FROM family_connections
      WHERE parent_id = medications.user_id
        AND child_id = auth.uid()
        AND status = 'active'
    )
  );

-- Parents can create medications
CREATE POLICY "Parents can create medications"
  ON medications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Parents can update their own medications
CREATE POLICY "Parents can update own medications"
  ON medications FOR UPDATE
  USING (user_id = auth.uid());

-- Parents can delete their own medications
CREATE POLICY "Parents can delete own medications"
  ON medications FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- MEDICATION LOGS TABLE POLICIES
-- =====================================================

-- View logs for own medications or connected parent's medications
CREATE POLICY "View medication logs"
  ON medication_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_logs.medication_id
        AND (
          medications.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM family_connections
            WHERE parent_id = medications.user_id
              AND child_id = auth.uid()
              AND status = 'active'
          )
        )
    )
  );

-- Create logs for own medications
CREATE POLICY "Create medication logs"
  ON medication_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_logs.medication_id
        AND medications.user_id = auth.uid()
    )
  );

-- Update own medication logs
CREATE POLICY "Update medication logs"
  ON medication_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_logs.medication_id
        AND medications.user_id = auth.uid()
    )
  );

-- =====================================================
-- FAMILY CONNECTIONS TABLE POLICIES
-- =====================================================

-- View connections where user is parent or child
CREATE POLICY "View family connections"
  ON family_connections FOR SELECT
  USING (
    parent_id = auth.uid() OR child_id = auth.uid()
  );

-- Children can create pending connections
CREATE POLICY "Create family connections"
  ON family_connections FOR INSERT
  WITH CHECK (child_id = auth.uid());

-- Parents and children can update their connections
CREATE POLICY "Update family connections"
  ON family_connections FOR UPDATE
  USING (parent_id = auth.uid() OR child_id = auth.uid());

-- Users can delete their own connections
CREATE POLICY "Delete family connections"
  ON family_connections FOR DELETE
  USING (parent_id = auth.uid() OR child_id = auth.uid());

-- =====================================================
-- APPOINTMENTS TABLE POLICIES
-- =====================================================

-- View own appointments or connected parent's appointments
CREATE POLICY "View appointments"
  ON appointments FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM family_connections
      WHERE parent_id = appointments.user_id
        AND child_id = auth.uid()
        AND status = 'active'
    )
  );

-- Create own appointments
CREATE POLICY "Create appointments"
  ON appointments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update own appointments
CREATE POLICY "Update appointments"
  ON appointments FOR UPDATE
  USING (user_id = auth.uid());

-- Delete own appointments
CREATE POLICY "Delete appointments"
  ON appointments FOR DELETE
  USING (user_id = auth.uid());
