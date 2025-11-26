---
name: generate-types
description: Generate TypeScript types from Supabase schema
version: 1.0.0
permissions:
  - bash
  - file:write
---

# Generate Supabase Types

Generate TypeScript types from Supabase database schema.

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Project linked or local Supabase running
- Valid SUPABASE_URL and SUPABASE_ANON_KEY

## Generation Commands

**From Remote Project**
```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > src/types/supabase.ts
```

**From Local Supabase**
```bash
npx supabase gen types typescript --local \
  > src/types/supabase.ts
```

## Generated Types Structure

```typescript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { /* select */ }
        Insert: { /* insert */ }
        Update: { /* update */ }
      }
      medications: { ... }
      medication_logs: { ... }
      family_connections: { ... }
      appointments: { ... }
    }
    Enums: {
      user_role: 'parent' | 'child'
      connection_status: 'pending' | 'active' | 'inactive'
    }
  }
}
```

## Usage Examples

```typescript
import { Database } from '@/types/supabase';

// Table row type
type Medication = Database['public']['Tables']['medications']['Row'];

// Insert type
type NewMedication = Database['public']['Tables']['medications']['Insert'];

// Update type
type MedicationUpdate = Database['public']['Tables']['medications']['Update'];

// Enum type
type UserRole = Database['public']['Enums']['user_role'];
```

## Type Aliases (Recommended)

Create `src/types/database.ts`:
```typescript
import { Database } from './supabase';

export type User = Database['public']['Tables']['users']['Row'];
export type Medication = Database['public']['Tables']['medications']['Row'];
export type MedicationLog = Database['public']['Tables']['medication_logs']['Row'];
```

## When to Regenerate
- After schema migrations
- When adding new tables
- After modifying columns/types
- When adding new enums
