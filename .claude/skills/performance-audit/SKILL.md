---
name: performance-audit
description: Audit app performance for smooth elderly user experience
version: 1.0.0
permissions:
  - bash
  - file:read
---

# Performance Audit

Performance review focused on smooth elderly user experience.

## Performance Targets (Elderly UX)

| Metric | Target | Why |
|--------|--------|-----|
| Touch Response | < 100ms | Immediate feedback |
| Screen Transition | < 300ms | No perceived delay |
| Voice Feedback | < 200ms | Natural response |
| Animation | 60fps | Smooth visuals |
| Cold Start | < 3 seconds | Quick access |
| Bundle Size | < 5MB | Fast downloads |

## Audit Areas

### 1. Bundle Size
```bash
npx react-native-bundle-visualizer
```
- Identify large dependencies
- Find unused code/imports
- Check for duplicate packages

### 2. Startup Performance
- Review App.tsx initialization
- Check for blocking operations
- Verify lazy loading implementation
- Measure time to interactive

### 3. Render Performance

**Re-render Analysis**
- Check React.memo usage
- Verify useCallback/useMemo
- Find inline functions in JSX
- Identify prop drilling issues

**List Performance**
- FlatList vs ScrollView usage
- keyExtractor implementation
- getItemLayout for fixed heights
- removeClippedSubviews enabled

### 4. Image Optimization
- Image sizes and formats
- Caching implementation
- Placeholder/loading states
- Progressive loading

### 5. Memory Management
- Memory leak detection
- useEffect cleanup
- Event listener management
- Large data pagination

### 6. Network Performance
- API call patterns
- Duplicate request prevention
- Caching strategy
- Response time measurement

## Analysis Tools

```bash
# React DevTools Profiler
# Flipper (Network, Performance)
# Xcode Instruments (iOS)
# Android Studio Profiler
```

## Output

- Performance score (0-100)
- Critical issues blocking UX
- Optimization opportunities
- Estimated improvement impact
- Specific code fixes
