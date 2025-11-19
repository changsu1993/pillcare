---
description: Initialize Supabase backend configuration
---

Set up Supabase backend for PillCare:

1. Create migration files:
   - Generate SQL migration files in backend/supabase/migrations/
   - Include all tables from CLAUDE.md schema:
     * users table with role enum
     * medications table with JSON reminder_times
     * medication_logs table
     * family_connections table with status enum
     * appointments table

2. Set up Row Level Security (RLS) policies:
   - Users can only read/update their own data
   - Children can read parent's medication data if family_connection exists
   - Parents cannot see other parents' data

3. Create Supabase Edge Functions:
   - send-medication-reminder: Triggered on reminder time
   - send-child-notification: When parent misses medication
   - family-invitation: Handle family connection invitations

4. Configure authentication:
   - Enable email/password auth
   - Enable OAuth providers (Google, Apple)
   - Set up email templates for verification

5. Generate TypeScript types:
   - Create types from database schema
   - Save to mobile/src/types/supabase.ts

6. Create .env.example file with required Supabase credentials

Display all generated files and provide setup instructions.
