---
name: create-feature
description: Create a new feature module with standard structure
version: 1.0.0
permissions:
  - file:write
  - bash
---

# Create Feature Module

Generate a new feature module following PillCare's feature-based architecture.

## Generated Structure

```
src/features/{feature-name}/
├── components/           # Feature-specific components
│   └── index.ts         # Component exports
├── screens/             # Screen components
│   ├── parent/          # Parent user screens (elderly-friendly)
│   └── child/           # Child user screens
├── hooks/               # Feature-specific hooks
│   └── index.ts
├── services/            # API/Supabase services
│   └── {feature}.ts
├── contexts/            # React contexts (if needed)
├── types/               # TypeScript types
│   └── index.ts
└── index.ts             # Feature public exports
```

## Files Generated

### index.ts (Feature Entry)
```typescript
// Public exports for {feature-name} feature
export * from './components';
export * from './hooks';
export * from './types';
```

### types/index.ts
```typescript
// TypeScript types for {feature-name}
export interface I{Feature}Item {
  id: string;
  // Add properties
}
```

### services/{feature}.ts
```typescript
import { supabase } from '@/services/supabase';

export const {feature}Service = {
  // Supabase service methods
};
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Folder | kebab-case | `medication-logs` |
| Component | PascalCase | `MedicationCard.tsx` |
| Service | camelCase | `medicationService.ts` |
| Type | PascalCase + I prefix | `IMedication` |

## Post-Creation Checklist
- [ ] Add navigation routes
- [ ] Update feature exports
- [ ] Add to navigation stack
- [ ] Create initial screen
