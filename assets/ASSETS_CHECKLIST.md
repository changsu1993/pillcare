# Assets Checklist for App Store Submission

This document lists all required assets for iOS App Store and Google Play Store submission.

## Current Assets Status

| Asset | Required Size | Status | Notes |
|-------|--------------|--------|-------|
| icon.png | 1024x1024 | Present | App icon (auto-scaled for all sizes) |
| adaptive-icon.png | 1024x1024 | Present | Android foreground icon |
| splash-icon.png | Any | Present | Splash screen center image |
| favicon.png | 48x48 | Present | Web favicon |

## Required for App Stores

### iOS App Store

| Asset | Size | Format | Status |
|-------|------|--------|--------|
| App Icon | 1024x1024 | PNG, no alpha | Required |
| Screenshots 6.7" | 1290x2796 | PNG/JPEG | Required (3-10) |
| Screenshots 6.5" | 1284x2778 | PNG/JPEG | Required (3-10) |
| Screenshots 5.5" | 1242x2208 | PNG/JPEG | Required (3-10) |
| iPad Screenshots | 2048x2732 | PNG/JPEG | If supporting iPad |
| App Preview Video | 1920x1080 | MOV/MP4 | Optional |

### Google Play Store

| Asset | Size | Format | Status |
|-------|------|--------|--------|
| App Icon | 512x512 | PNG, 32-bit | Required |
| Feature Graphic | 1024x500 | PNG/JPEG | Required |
| Phone Screenshots | 320-3840px | PNG/JPEG | Required (2-8) |
| 7" Tablet Screenshots | 320-3840px | PNG/JPEG | If supporting |
| 10" Tablet Screenshots | 320-3840px | PNG/JPEG | If supporting |
| Promo Video | YouTube URL | - | Optional |

## Optional Assets (Recommended)

### Notification Icon (Android)

For custom notification appearance on Android:

```
assets/notification-icon.png
- Size: 96x96 pixels
- Format: PNG with transparency
- Color: White/Gray only (system tints the icon)
```

Add to app.json plugins:
```json
["expo-notifications", { "icon": "./assets/notification-icon.png" }]
```

### Custom Notification Sound

For custom notification sound:

```
assets/sounds/notification.wav
- Format: WAV (16-bit, 44.1kHz)
- Duration: Max 30 seconds
- Single channel (mono) recommended
```

Add to app.json plugins:
```json
["expo-notifications", { "sounds": ["./assets/sounds/notification.wav"] }]
```

## Icon Generation Tools

Generate all required icon sizes from a single 1024x1024 source:

1. **Expo CLI** (Recommended)
   ```bash
   npx expo-optimize
   ```

2. **Online Tools**
   - https://appicon.co
   - https://makeappicon.com
   - https://icon.kitchen (Material Design icons)

3. **Figma Plugins**
   - App Icon Generator
   - Iconify

## Screenshot Guidelines

### Best Practices

1. Show real app content (not mockups)
2. Include key features and flows
3. Use device frames (optional but recommended)
4. Consistent style across all screenshots
5. Consider localization needs

### Recommended Screenshots

1. Home screen / Dashboard
2. Medication list
3. Add medication flow
4. Notification / Reminder
5. Family connection feature
6. Settings / Profile

### Tools for Screenshots

- **Simulator/Emulator**: Built-in screenshot feature
- **Device Frames**: https://mockuphone.com
- **Professional**: Figma, Sketch, Adobe XD

---

Last Updated: 2025-12-03
