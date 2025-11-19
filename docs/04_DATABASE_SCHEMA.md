# PillCare - Database Schema Design

**Prepared by**: Database Architect Agent
**Date**: 2025-11-19
**Version**: 1.0 (MVP Phase)
**Database**: PostgreSQL 15+ (via Supabase)

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Indexes](#indexes)
5. [Row Level Security Policies](#row-level-security-policies)
6. [Database Functions](#database-functions)
7. [Migration Files](#migration-files)

---

## Overview

### Design Principles

1. **Data Integrity**: Foreign key constraints, check constraints, NOT NULL where appropriate
2. **Scalability**: Indexed for common queries, partitioning-ready
3. **Security**: Row Level Security (RLS) for multi-tenant isolation
4. **Auditability**: Created/updated timestamps, soft deletes
5. **Performance**: Optimized for read-heavy workloads (medication logs)

### Key Relationships

```
users (parent/child)
  │
  ├─── medications (1:N) - parent owns medications
  │      │
  │      └─── medication_logs (1:N) - medication has many logs
  │
  └─── family_connections (N:N) - parents ↔ children
           │
           └─── self-referencing (parent_user_id, child_user_id)
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │───┐
│ email           │   │
│ role            │   │ 1
│ name            │   │
│ phone           │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
                      │ N
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
┌─────────────────┐      ┌─────────────────────┐
│  medications    │      │ family_connections  │
│─────────────────│      │─────────────────────│
│ id (PK)         │───┐  │ id (PK)             │
│ user_id (FK)    │   │  │ parent_user_id (FK) │
│ name            │   │  │ child_user_id (FK)  │
│ dosage          │   │  │ status              │
│ frequency       │   │  │ created_at          │
│ reminder_times  │   │  └─────────────────────┘
│ active          │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │ 1
                      │
                      │ N
                      ▼
          ┌─────────────────────┐
          │  medication_logs    │
          │─────────────────────│
          │ id (PK)             │
          │ medication_id (FK)  │
          │ scheduled_at        │
          │ taken               │
          │ taken_at            │
          │ skipped_reason      │
          │ created_at          │
          └─────────────────────┘
```

---

## Table Definitions

### 1. `users`

**Purpose**: Store user accounts (both parents and children)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication (managed by Supabase Auth)
    email TEXT UNIQUE NOT NULL,

    -- Profile
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    avatar_url TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Comments
COMMENT ON TABLE users IS 'User accounts for both parents (medication takers) and children (caregivers)';
COMMENT ON COLUMN users.role IS 'User role: parent (elderly) or child (caregiver)';
```

**Sample Data**:
```sql
-- Parent user
INSERT INTO users (email, name, phone, role) VALUES
('youngsook@example.com', '김영숙', '+821012345678', 'parent');

-- Child user
INSERT INTO users (email, name, phone, role) VALUES
('jieun@example.com', '이지은', '+821087654321', 'child');
```

---

### 2. `family_connections`

**Purpose**: Link parent users to child users (many-to-many relationship)

```sql
CREATE TABLE family_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Connection state
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
    invitation_code TEXT UNIQUE,
    invitation_expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT no_self_connection CHECK (parent_user_id != child_user_id),
    CONSTRAINT unique_family_connection UNIQUE (parent_user_id, child_user_id)
);

-- Indexes
CREATE INDEX idx_family_connections_parent ON family_connections(parent_user_id) WHERE status = 'active';
CREATE INDEX idx_family_connections_child ON family_connections(child_user_id) WHERE status = 'active';
CREATE INDEX idx_family_connections_invitation ON family_connections(invitation_code) WHERE invitation_code IS NOT NULL;

-- Comments
COMMENT ON TABLE family_connections IS 'Links between parent users (elderly) and child users (caregivers)';
COMMENT ON COLUMN family_connections.status IS 'Connection status: pending (awaiting acceptance), active (connected), inactive (disconnected)';
COMMENT ON COLUMN family_connections.invitation_code IS '6-digit invitation code for family connection';
```

**Sample Data**:
```sql
INSERT INTO family_connections (parent_user_id, child_user_id, status) VALUES
('parent-uuid', 'child-uuid', 'active');
```

---

### 3. `medications`

**Purpose**: Store medication information and schedules

```sql
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Medication details
    name TEXT NOT NULL,
    generic_name TEXT, -- e.g., "Amlodipine" (optional)
    dosage TEXT NOT NULL, -- e.g., "1알", "5mg"

    -- Schedule
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'as_needed', 'custom')),
    reminder_times JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of times: ["08:00", "20:00"]
    days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sun, 6=Sat (for weekly frequency)

    -- Additional info
    notes TEXT,
    color TEXT DEFAULT '#3B82F6', -- For UI color coding
    icon TEXT DEFAULT 'pill', -- Icon identifier

    -- Status
    active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE, -- NULL = ongoing

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_reminder_times CHECK (jsonb_typeof(reminder_times) = 'array'),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_medications_user ON medications(user_id) WHERE active = true;
CREATE INDEX idx_medications_active ON medications(active, user_id);

-- Comments
COMMENT ON TABLE medications IS 'Medication information and schedules for parent users';
COMMENT ON COLUMN medications.reminder_times IS 'Array of 24-hour time strings, e.g., ["08:00", "13:00", "20:00"]';
COMMENT ON COLUMN medications.frequency IS 'How often: daily (every day), weekly (specific days), as_needed (no schedule), custom (advanced)';
COMMENT ON COLUMN medications.days_of_week IS 'Array of day numbers (0=Sunday, 6=Saturday) for weekly frequency';
```

**Sample Data**:
```sql
INSERT INTO medications (user_id, name, generic_name, dosage, frequency, reminder_times) VALUES
(
    'parent-uuid',
    '혈압약',
    'Amlodipine',
    '1알',
    'daily',
    '["08:00", "20:00"]'::jsonb
);
```

---

### 4. `medication_logs`

**Purpose**: Track medication adherence (taken or missed)

```sql
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,

    -- Schedule
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Adherence
    taken BOOLEAN NOT NULL DEFAULT false,
    taken_at TIMESTAMP WITH TIME ZONE,

    -- Skip info
    skipped_reason TEXT CHECK (
        skipped_reason IS NULL OR
        skipped_reason IN ('forgot', 'no_medication', 'felt_sick', 'at_hospital', 'other')
    ),
    notes TEXT,

    -- Metadata
    logged_via TEXT DEFAULT 'app' CHECK (logged_via IN ('app', 'voice', 'auto')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT taken_at_required_when_taken CHECK (
        (taken = false) OR (taken = true AND taken_at IS NOT NULL)
    ),
    CONSTRAINT unique_medication_schedule UNIQUE (medication_id, scheduled_at)
);

-- Indexes (Critical for performance)
CREATE INDEX idx_medication_logs_medication ON medication_logs(medication_id, scheduled_at DESC);
CREATE INDEX idx_medication_logs_scheduled ON medication_logs(scheduled_at) WHERE taken = false;
CREATE INDEX idx_medication_logs_taken_at ON medication_logs(taken_at) WHERE taken = true;

-- Partial index for missed medications (for child notifications)
CREATE INDEX idx_medication_logs_missed ON medication_logs(medication_id, scheduled_at)
    WHERE taken = false AND scheduled_at < NOW();

-- Comments
COMMENT ON TABLE medication_logs IS 'Medication adherence log (taken or missed)';
COMMENT ON COLUMN medication_logs.scheduled_at IS 'When medication was scheduled to be taken';
COMMENT ON COLUMN medication_logs.taken_at IS 'When medication was actually taken (NULL if missed)';
COMMENT ON COLUMN medication_logs.skipped_reason IS 'Reason for missing medication: forgot, no_medication, felt_sick, at_hospital, other';
```

**Sample Data**:
```sql
-- Taken medication
INSERT INTO medication_logs (medication_id, scheduled_at, taken, taken_at) VALUES
('medication-uuid', '2025-11-19 08:00:00+09', true, '2025-11-19 08:05:23+09');

-- Missed medication
INSERT INTO medication_logs (medication_id, scheduled_at, taken, skipped_reason) VALUES
('medication-uuid', '2025-11-19 13:00:00+09', false, 'forgot');
```

---

### 5. `appointments` (Post-MVP)

**Purpose**: Track hospital/doctor appointments

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Appointment details
    title TEXT NOT NULL,
    hospital_name TEXT,
    doctor_name TEXT,
    department TEXT, -- e.g., "내과", "정형외과"

    -- Schedule
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,

    -- Reminders
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_minutes_before INTEGER DEFAULT 1440, -- 24 hours = 1440 minutes

    -- Notes
    notes TEXT,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_user ON appointments(user_id, appointment_date DESC);
CREATE INDEX idx_appointments_upcoming ON appointments(appointment_date)
    WHERE status = 'scheduled' AND appointment_date > NOW();

-- Comments
COMMENT ON TABLE appointments IS 'Hospital and doctor appointments for parent users';
```

---

## Indexes

### Performance Optimization Strategy

**Read-Heavy Workload**: Medication logs are queried frequently (child app timeline, adherence reports)

```sql
-- Critical indexes for common queries

-- 1. Get today's medications for a user (parent home screen)
CREATE INDEX idx_medications_user_active ON medications(user_id, active, created_at);

-- 2. Get medication logs for timeline (child app)
CREATE INDEX idx_logs_for_timeline ON medication_logs(medication_id, scheduled_at DESC, taken);

-- 3. Find missed medications (for child notifications)
CREATE INDEX idx_missed_medications ON medication_logs(scheduled_at, taken)
    WHERE taken = false;

-- 4. Adherence calculation (weekly/monthly reports)
CREATE INDEX idx_logs_adherence_calc ON medication_logs(medication_id, scheduled_at, taken)
    WHERE scheduled_at >= NOW() - INTERVAL '30 days';

-- 5. Family connections lookup (frequent)
CREATE INDEX idx_family_active ON family_connections(parent_user_id, child_user_id, status)
    WHERE status = 'active';
```

### Index Monitoring

```sql
-- Query to check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Row Level Security Policies

**Security Model**: Multi-tenant isolation using Supabase RLS

### 1. Users Table

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);
```

### 2. Medications Table

```sql
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Parents can CRUD their own medications
CREATE POLICY "Parents can manage own medications"
    ON medications
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Children can view parent's medications (if family connection exists)
CREATE POLICY "Children can view connected parent medications"
    ON medications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_connections fc
            WHERE fc.parent_user_id = medications.user_id
              AND fc.child_user_id = auth.uid()
              AND fc.status = 'active'
        )
    );
```

### 3. Medication Logs Table

```sql
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Parents can CRUD their own medication logs
CREATE POLICY "Parents can manage own logs"
    ON medication_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM medications m
            WHERE m.id = medication_logs.medication_id
              AND m.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM medications m
            WHERE m.id = medication_logs.medication_id
              AND m.user_id = auth.uid()
        )
    );

-- Children can view parent's logs (if family connection exists)
CREATE POLICY "Children can view connected parent logs"
    ON medication_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medications m
            JOIN family_connections fc ON fc.parent_user_id = m.user_id
            WHERE m.id = medication_logs.medication_id
              AND fc.child_user_id = auth.uid()
              AND fc.status = 'active'
        )
    );
```

### 4. Family Connections Table

```sql
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Parents and children can view their own connections
CREATE POLICY "Users can view own family connections"
    ON family_connections
    FOR SELECT
    USING (
        auth.uid() = parent_user_id OR auth.uid() = child_user_id
    );

-- Children can create connections (generate invitation code)
CREATE POLICY "Children can create invitations"
    ON family_connections
    FOR INSERT
    WITH CHECK (auth.uid() = child_user_id);

-- Parents can accept invitations (update status to active)
CREATE POLICY "Parents can accept invitations"
    ON family_connections
    FOR UPDATE
    USING (auth.uid() = parent_user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own connections"
    ON family_connections
    FOR DELETE
    USING (
        auth.uid() = parent_user_id OR auth.uid() = child_user_id
    );
```

---

## Database Functions

### 1. Calculate Adherence Rate

```sql
CREATE OR REPLACE FUNCTION calculate_adherence_rate(
    p_medication_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_scheduled INTEGER;
    v_total_taken INTEGER;
    v_adherence_rate DECIMAL(5,2);
BEGIN
    -- Count total scheduled medications
    SELECT COUNT(*) INTO v_total_scheduled
    FROM medication_logs
    WHERE medication_id = p_medication_id
      AND scheduled_at BETWEEN p_start_date AND p_end_date;

    -- Count medications taken
    SELECT COUNT(*) INTO v_total_taken
    FROM medication_logs
    WHERE medication_id = p_medication_id
      AND scheduled_at BETWEEN p_start_date AND p_end_date
      AND taken = true;

    -- Calculate rate (avoid division by zero)
    IF v_total_scheduled = 0 THEN
        RETURN 0.00;
    ELSE
        v_adherence_rate := (v_total_taken::DECIMAL / v_total_scheduled::DECIMAL) * 100;
        RETURN ROUND(v_adherence_rate, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage example
SELECT calculate_adherence_rate(
    'medication-uuid',
    NOW() - INTERVAL '7 days',
    NOW()
);
```

### 2. Generate Invitation Code

```sql
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 6-digit code
        v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM family_connections
            WHERE invitation_code = v_code
              AND invitation_expires_at > NOW()
        ) INTO v_exists;

        -- Exit loop if unique
        EXIT WHEN NOT v_exists;
    END LOOP;

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;
```

### 3. Auto-Create Medication Logs (Scheduled Job)

```sql
CREATE OR REPLACE FUNCTION create_daily_medication_logs()
RETURNS void AS $$
DECLARE
    v_medication RECORD;
    v_reminder_time TEXT;
    v_scheduled_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through active medications
    FOR v_medication IN
        SELECT id, reminder_times
        FROM medications
        WHERE active = true
          AND frequency = 'daily'
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LOOP
        -- Loop through reminder times
        FOR v_reminder_time IN
            SELECT jsonb_array_elements_text(v_medication.reminder_times)
        LOOP
            -- Calculate scheduled timestamp (today + time)
            v_scheduled_at := (CURRENT_DATE || ' ' || v_reminder_time)::TIMESTAMP WITH TIME ZONE;

            -- Insert log if not exists
            INSERT INTO medication_logs (medication_id, scheduled_at, taken)
            VALUES (v_medication.id, v_scheduled_at, false)
            ON CONFLICT (medication_id, scheduled_at) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run daily at midnight (via pg_cron or Supabase Edge Function)
```

### 4. Update Timestamps Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_logs_updated_at BEFORE UPDATE ON medication_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_connections_updated_at BEFORE UPDATE ON family_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Migration Files

### Migration 001: Initial Schema

**File**: `backend/supabase/migrations/001_initial_schema.sql`

```sql
-- Migration: Initial PillCare database schema
-- Created: 2025-11-19

BEGIN;

-- 1. Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- 2. Family connections table
CREATE TABLE family_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
    invitation_code TEXT UNIQUE,
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT no_self_connection CHECK (parent_user_id != child_user_id),
    CONSTRAINT unique_family_connection UNIQUE (parent_user_id, child_user_id)
);

CREATE INDEX idx_family_connections_parent ON family_connections(parent_user_id) WHERE status = 'active';
CREATE INDEX idx_family_connections_child ON family_connections(child_user_id) WHERE status = 'active';

-- 3. Medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'as_needed', 'custom')),
    reminder_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
    notes TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'pill',
    active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_reminder_times CHECK (jsonb_typeof(reminder_times) = 'array'),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_medications_user ON medications(user_id) WHERE active = true;

-- 4. Medication logs table
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    taken BOOLEAN NOT NULL DEFAULT false,
    taken_at TIMESTAMP WITH TIME ZONE,
    skipped_reason TEXT CHECK (
        skipped_reason IS NULL OR
        skipped_reason IN ('forgot', 'no_medication', 'felt_sick', 'at_hospital', 'other')
    ),
    notes TEXT,
    logged_via TEXT DEFAULT 'app' CHECK (logged_via IN ('app', 'voice', 'auto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT taken_at_required_when_taken CHECK (
        (taken = false) OR (taken = true AND taken_at IS NOT NULL)
    ),
    CONSTRAINT unique_medication_schedule UNIQUE (medication_id, scheduled_at)
);

CREATE INDEX idx_medication_logs_medication ON medication_logs(medication_id, scheduled_at DESC);
CREATE INDEX idx_medication_logs_missed ON medication_logs(medication_id, scheduled_at)
    WHERE taken = false AND scheduled_at < NOW();

-- 5. Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_logs_updated_at BEFORE UPDATE ON medication_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_connections_updated_at BEFORE UPDATE ON family_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Migration 002: Row Level Security

**File**: `backend/supabase/migrations/002_enable_rls.sql`

```sql
-- Migration: Enable Row Level Security
-- Created: 2025-11-19

BEGIN;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Medications policies
CREATE POLICY "Parents can manage own medications" ON medications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Children can view connected parent medications" ON medications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_connections fc
            WHERE fc.parent_user_id = medications.user_id
              AND fc.child_user_id = auth.uid()
              AND fc.status = 'active'
        )
    );

-- Medication logs policies
CREATE POLICY "Parents can manage own logs" ON medication_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medications m
            WHERE m.id = medication_logs.medication_id AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Children can view connected parent logs" ON medication_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medications m
            JOIN family_connections fc ON fc.parent_user_id = m.user_id
            WHERE m.id = medication_logs.medication_id
              AND fc.child_user_id = auth.uid()
              AND fc.status = 'active'
        )
    );

-- Family connections policies
CREATE POLICY "Users can view own family connections" ON family_connections
    FOR SELECT USING (auth.uid() = parent_user_id OR auth.uid() = child_user_id);

CREATE POLICY "Children can create invitations" ON family_connections
    FOR INSERT WITH CHECK (auth.uid() = child_user_id);

CREATE POLICY "Parents can accept invitations" ON family_connections
    FOR UPDATE USING (auth.uid() = parent_user_id);

CREATE POLICY "Users can delete own connections" ON family_connections
    FOR DELETE USING (auth.uid() = parent_user_id OR auth.uid() = child_user_id);

COMMIT;
```

### Migration 003: Helper Functions

**File**: `backend/supabase/migrations/003_helper_functions.sql`

```sql
-- Migration: Helper functions for business logic
-- Created: 2025-11-19

BEGIN;

-- Function: Calculate adherence rate
CREATE OR REPLACE FUNCTION calculate_adherence_rate(
    p_medication_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_scheduled INTEGER;
    v_total_taken INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_scheduled
    FROM medication_logs
    WHERE medication_id = p_medication_id
      AND scheduled_at BETWEEN p_start_date AND p_end_date;

    SELECT COUNT(*) INTO v_total_taken
    FROM medication_logs
    WHERE medication_id = p_medication_id
      AND scheduled_at BETWEEN p_start_date AND p_end_date
      AND taken = true;

    IF v_total_scheduled = 0 THEN
        RETURN 0.00;
    ELSE
        RETURN ROUND((v_total_taken::DECIMAL / v_total_scheduled::DECIMAL) * 100, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(
            SELECT 1 FROM family_connections
            WHERE invitation_code = v_code
              AND invitation_expires_at > NOW()
        ) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMIT;
```

---

## Query Examples

### Common Queries for React Native App

#### 1. Get Today's Medications (Parent Home Screen)

```sql
-- Get all active medications for logged-in parent
SELECT
    m.id,
    m.name,
    m.dosage,
    m.reminder_times,
    m.color,
    m.icon
FROM medications m
WHERE m.user_id = auth.uid()
  AND m.active = true
  AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
ORDER BY m.created_at;
```

#### 2. Get Today's Medication Logs (Child Timeline)

```sql
-- Get today's logs for a specific parent
SELECT
    ml.id,
    ml.scheduled_at,
    ml.taken,
    ml.taken_at,
    ml.skipped_reason,
    m.name AS medication_name,
    m.dosage,
    m.color
FROM medication_logs ml
JOIN medications m ON m.id = ml.medication_id
WHERE m.user_id = $1  -- parent_user_id
  AND ml.scheduled_at >= CURRENT_DATE
  AND ml.scheduled_at < CURRENT_DATE + INTERVAL '1 day'
ORDER BY ml.scheduled_at ASC;
```

#### 3. Find Missed Medications (For Child Notifications)

```sql
-- Find medications missed in last 30 minutes
SELECT
    ml.id,
    ml.medication_id,
    ml.scheduled_at,
    m.name,
    m.user_id AS parent_user_id,
    u.name AS parent_name
FROM medication_logs ml
JOIN medications m ON m.id = ml.medication_id
JOIN users u ON u.id = m.user_id
JOIN family_connections fc ON fc.parent_user_id = m.user_id
WHERE ml.taken = false
  AND ml.scheduled_at BETWEEN NOW() - INTERVAL '30 minutes' AND NOW()
  AND fc.child_user_id = auth.uid()
  AND fc.status = 'active';
```

#### 4. Calculate Weekly Adherence

```sql
-- Get adherence rate for last 7 days
SELECT
    m.id,
    m.name,
    calculate_adherence_rate(
        m.id,
        NOW() - INTERVAL '7 days',
        NOW()
    ) AS adherence_rate
FROM medications m
WHERE m.user_id = $1
  AND m.active = true;
```

---

## Performance Considerations

### Expected Data Volume (Year 1)

| Table | Rows (Year 1) | Growth Rate |
|-------|---------------|-------------|
| users | 10,000 | Linear |
| medications | 30,000 | Linear (3 per user avg) |
| medication_logs | 10,000,000 | Exponential (3 meds × 2 times/day × 365 days) |
| family_connections | 12,000 | Linear (1.2 per user avg) |

### Optimization Strategies

1. **Partitioning**: Partition `medication_logs` by month (after 1M+ rows)
   ```sql
   CREATE TABLE medication_logs_2025_11 PARTITION OF medication_logs
   FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
   ```

2. **Archiving**: Move logs older than 1 year to cold storage

3. **Caching**: Cache adherence calculations (Redis/Supabase Realtime)

4. **Read Replicas**: Separate read/write workloads for child app queries

---

## Next Steps

1. **Apply Migrations**: Run migration files in Supabase dashboard
2. **Generate TypeScript Types**: Use Supabase CLI to auto-generate types
3. **Test RLS Policies**: Verify security with different user roles
4. **Create Seed Data**: Populate test data for development
5. **Set Up Backup**: Configure automated backups (Supabase Pro)

---

*🤖 Generated with assistance from Database Architect Agent*
*Last Updated: 2025-11-19*
