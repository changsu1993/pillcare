---
name: create-component
description: Create a reusable component with TypeScript and accessibility
version: 1.0.0
permissions:
  - file:write
---

# Create Reusable Component

Generate a typed, accessible React Native component.

## Arguments Required
- **Component Name**: PascalCase (e.g., `MedicationCard`)
- **Location**: `shared` or feature name

## Component Template

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface {ComponentName}Props {
  // Required props
  title: string;
  // Optional props
  onPress?: () => void;
  testID?: string;
}

export const {ComponentName}: React.FC<{ComponentName}Props> = ({
  title,
  onPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Tap to interact"
    >
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 60,          // Elderly-friendly touch target
    minWidth: 60,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: '#000000',
  },
});
```

## File Locations

| Location | Path |
|----------|------|
| Shared | `src/components/{ComponentName}.tsx` |
| Feature | `src/features/{feature}/components/{ComponentName}.tsx` |

## Component Checklist
- [ ] TypeScript props interface
- [ ] Default props for optional values
- [ ] testID prop for testing
- [ ] accessibilityLabel
- [ ] accessibilityRole
- [ ] accessibilityHint (elderly components)
- [ ] StyleSheet.create for styles

## Elderly-Facing Components
- 60x60px minimum touch target
- High contrast colors
- Haptic feedback option
- Voice feedback callback prop

## Post-Creation
- [ ] Export from index.ts
- [ ] Add unit tests
- [ ] Document props with comments
