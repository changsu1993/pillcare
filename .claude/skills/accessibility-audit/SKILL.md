---
name: accessibility-audit
description: Audit accessibility for elderly users (WCAG AAA compliance)
version: 1.0.0
permissions:
  - file:read
  - bash
---

# Accessibility Audit for Elderly Users

Comprehensive accessibility review focused on elderly parent users.

## PillCare Accessibility Standards

### Visual Requirements (WCAG AAA)
- **Font Size**: Minimum 20px body, 28px+ headers
- **Touch Targets**: Minimum 60x60px (larger than standard 44px)
- **Color Contrast**: 7:1 ratio minimum
- **No Color-Only Information**: Icons + text always

### Component Checklist

For each UI component, verify:
- [ ] `accessibilityLabel` - describes the element
- [ ] `accessibilityRole` - button, text, header, etc.
- [ ] `accessibilityHint` - explains what happens on interaction
- [ ] `accessibilityState` - for toggles, checkboxes

### Navigation Rules
- Maximum 2 levels of depth
- No gesture-only navigation (swipe, pinch, long-press)
- Clear, large back buttons
- Consistent patterns across screens

### Feedback Requirements
- Voice feedback via expo-speech
- Haptic feedback on actions
- Clear loading indicators
- Large, readable error messages

## Audit Process

1. Scan all screens in `src/features/*/screens/parent/`
2. Check component accessibility props
3. Measure touch target sizes
4. Verify color contrast ratios
5. Test voice feedback integration

## Output

- Accessibility score (0-100)
- Violations by severity (Critical/Major/Minor)
- Specific fix code examples
- WCAG reference for each issue

## References
- WCAG 2.1 AAA Guidelines
- Nielsen Norman Group Elderly UX Research
- Apple/Google Accessibility Guidelines
