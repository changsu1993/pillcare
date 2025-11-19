---
description: Show database schema and statistics
---

Display the current PillCare database schema using the SQLite MCP server:

1. Connect to ./data/pillcare.db
2. Show all tables with their schemas:
   - users (id, email, name, role, phone_number, created_at, updated_at)
   - medications (id, user_id, name, dosage, frequency, reminder_times, start_date, end_date, notes, created_at)
   - medication_logs (id, medication_id, scheduled_at, taken, taken_at, skipped_reason, created_at)
   - family_connections (id, parent_id, child_id, status, created_at)
   - appointments (id, user_id, title, hospital_name, appointment_date, notes, created_at)
3. Show row counts for each table
4. Display any indexes and foreign key relationships
5. Show recent migrations applied (if migration table exists)

Format the output in a readable table format.
