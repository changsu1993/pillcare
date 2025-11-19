-- PillCare Database Schema
-- Migration 003: Helper Functions
-- Created: 2025-01-19

-- =====================================================
-- 1. GENERATE INVITATION CODE
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-digit random code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM family_connections
      WHERE invitation_code = code
        AND invitation_expires_at > NOW()
    ) INTO exists_code;

    -- Exit loop if code is unique
    EXIT WHEN NOT exists_code;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CALCULATE ADHERENCE RATE
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_adherence_rate(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS NUMERIC AS $$
DECLARE
  total_logs INTEGER;
  taken_logs INTEGER;
  adherence_rate NUMERIC;
BEGIN
  -- Count total scheduled medications
  SELECT COUNT(*) INTO total_logs
  FROM medication_logs ml
  JOIN medications m ON m.id = ml.medication_id
  WHERE m.user_id = p_user_id
    AND ml.scheduled_at >= p_start_date
    AND ml.scheduled_at <= p_end_date;

  -- Return 0 if no logs
  IF total_logs = 0 THEN
    RETURN 0;
  END IF;

  -- Count taken medications
  SELECT COUNT(*) INTO taken_logs
  FROM medication_logs ml
  JOIN medications m ON m.id = ml.medication_id
  WHERE m.user_id = p_user_id
    AND ml.scheduled_at >= p_start_date
    AND ml.scheduled_at <= p_end_date
    AND ml.taken = true;

  -- Calculate percentage
  adherence_rate := ROUND((taken_logs::NUMERIC / total_logs::NUMERIC) * 100, 2);

  RETURN adherence_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. GET TODAY'S MEDICATION SCHEDULE
-- =====================================================
CREATE OR REPLACE FUNCTION get_todays_medications(p_user_id UUID)
RETURNS TABLE (
  medication_id UUID,
  medication_name TEXT,
  dosage TEXT,
  scheduled_times JSONB,
  logs JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS medication_id,
    m.name AS medication_name,
    m.dosage,
    m.reminder_times AS scheduled_times,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'scheduled_at', ml.scheduled_at,
          'taken', ml.taken,
          'taken_at', ml.taken_at
        ) ORDER BY ml.scheduled_at
      ) FILTER (WHERE ml.id IS NOT NULL),
      '[]'::jsonb
    ) AS logs
  FROM medications m
  LEFT JOIN medication_logs ml ON ml.medication_id = m.id
    AND DATE(ml.scheduled_at) = CURRENT_DATE
  WHERE m.user_id = p_user_id
    AND m.active = true
    AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
  GROUP BY m.id, m.name, m.dosage, m.reminder_times
  ORDER BY m.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
