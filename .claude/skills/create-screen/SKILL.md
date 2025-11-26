---
name: create-screen
description: Create a new screen with accessibility support for parent/child users
version: 1.0.0
permissions:
  - file:write
---

# Create Screen Component

Generate a new screen with elderly-friendly or child-app defaults.

## Arguments Required
- **Screen Name**: PascalCase (e.g., `MedicationDetail`)
- **Feature**: Feature folder name (e.g., `medications`)
- **User Type**: `parent` or `child`

## Parent Screen Template (Elderly-Friendly)

```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const {ScreenName}: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Screen Title</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,           // Large for elderly
    fontWeight: 'bold',
    color: '#000000',       // High contrast
    marginBottom: 20,
  },
});
```

## Parent Screen Requirements
- Font: 20px+ body, 28px+ headers
- Touch targets: 60x60px minimum
- Colors: High contrast (black on white)
- Voice feedback ready
- Simple linear layout
- No gestures required

## Child Screen Template

```tsx
// Standard React Native screen
// 16px body, 20px headers
// 44x44px touch targets
// Gestures allowed
// Information-dense layouts OK
```

## Generated File Location
```
src/features/{feature}/screens/{user-type}/{ScreenName}.tsx
```

## Post-Creation
- [ ] Add to navigation stack
- [ ] Set up route params
- [ ] Add accessibility labels
- [ ] Implement voice feedback (parent)
