---
name: run-dev
description: Start Expo development server with platform options
version: 1.0.0
permissions:
  - bash
---

# Run Development Server

Start the PillCare Expo development environment.

## Capabilities

1. **Environment Check**
   - Verify no existing Expo processes
   - Check port availability (8081, 19000, 19001)
   - Detect running simulators/emulators

2. **Start Options**
   - Default: `npx expo start` (QR code mode)
   - iOS: `npx expo start --ios` (iOS Simulator)
   - Android: `npx expo start --android` (Android Emulator)
   - Web: `npx expo start --web` (Browser)
   - Clear cache: `npx expo start --clear`

3. **Troubleshooting**
   - Kill stale Metro processes if needed
   - Clear bundler cache on errors
   - Restart with clean state

## Usage

When user wants to start development:
- Ask which platform (ios/android/web) or default
- Check for existing processes
- Start appropriate server
- Provide keyboard shortcut reference

## Common Issues

- Port 8081 in use: Kill existing process
- Metro bundler stuck: Clear cache and restart
- Simulator not found: Guide to install/start
