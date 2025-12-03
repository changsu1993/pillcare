# PillCare Deployment Guide

This document provides comprehensive instructions for deploying PillCare to TestFlight (iOS) and Google Play Console (Android) using Expo Application Services (EAS).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Build Profiles](#build-profiles)
5. [iOS Deployment (TestFlight)](#ios-deployment-testflight)
6. [Android Deployment (Google Play)](#android-deployment-google-play)
7. [Over-the-Air Updates](#over-the-air-updates)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Pre-deployment Checklist](#pre-deployment-checklist)

---

## Prerequisites

### Required Accounts

| Account | Purpose | URL |
|---------|---------|-----|
| Expo Account | EAS Build and Submit | https://expo.dev/signup |
| Apple Developer | iOS distribution | https://developer.apple.com/enroll |
| Google Play Console | Android distribution | https://play.google.com/console |

### Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify installation
eas whoami
```

### Required Files (DO NOT COMMIT)

- `google-services.json` - Firebase config for Android
- `GoogleService-Info.plist` - Firebase config for iOS (optional, managed by EAS)
- `google-service-account.json` - For auto-submit to Google Play

---

## Initial Setup

### 1. Initialize EAS in Your Project

```bash
# Configure EAS Build
npm run eas:init

# This creates/updates eas.json and app.json with project ID
```

### 2. Update Project IDs

Edit `app.json` and replace placeholders:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"
      }
    },
    "owner": "YOUR_EXPO_USERNAME"
  }
}
```

Get your project ID from: https://expo.dev/accounts/[username]/projects/PillCare

### 3. Configure Credentials

```bash
# iOS credentials (auto-managed by EAS recommended)
npm run credentials:ios

# Android credentials
npm run credentials:android
```

---

## Environment Configuration

### EAS Secrets

Store sensitive environment variables using EAS Secrets (not in .env files for builds):

```bash
# Set production Supabase credentials
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-production-anon-key"

# List all secrets
eas secret:list

# Delete a secret
eas secret:delete --name SECRET_NAME
```

### Build-time vs Runtime Variables

| Type | Prefix | Usage |
|------|--------|-------|
| Build-time (public) | `EXPO_PUBLIC_` | Bundled into app |
| Build-time (private) | No prefix | Only during build |
| EAS Secrets | Any | Injected during EAS Build |

---

## Build Profiles

### Development

For internal testing with development client:

```bash
# Build for physical devices
npm run build:dev

# Build iOS simulator
npm run build:dev:sim
```

### Preview

For internal testing before production (uses internal distribution):

```bash
# Build APK/IPA for internal testing
npm run build:preview
```

### Production

For App Store / Play Store release:

```bash
# Build both platforms
npm run build:production

# Build single platform
npm run build:ios
npm run build:android
```

---

## iOS Deployment (TestFlight)

### Step 1: Configure Apple Developer Account

1. Go to https://appstoreconnect.apple.com
2. Create a new app with bundle ID: `com.pillcare.app`
3. Fill in required metadata (see [Pre-deployment Checklist](#pre-deployment-checklist))

### Step 2: Configure eas.json

Update `eas.json` with your Apple credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234"
      }
    }
  }
}
```

Get `ascAppId` from App Store Connect > App Information > Apple ID

### Step 3: Build and Submit

```bash
# Option 1: Build then submit separately
npm run build:ios
npm run submit:ios

# Option 2: Build and submit in one command
npm run deploy:ios
```

### Step 4: TestFlight Distribution

1. Go to App Store Connect > TestFlight
2. Wait for build processing (5-30 minutes)
3. Add internal/external testers
4. For external testers, submit for Beta App Review

---

## Android Deployment (Google Play)

### Step 1: Create Google Play Console App

1. Go to https://play.google.com/console
2. Create a new app
3. Complete store listing requirements

### Step 2: Create Service Account

For automated submissions:

1. Go to Google Play Console > Setup > API access
2. Create a new service account
3. Download JSON key as `google-service-account.json`
4. Grant "Release manager" permissions

### Step 3: Configure eas.json

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

### Step 4: Build and Submit

```bash
# Build AAB (Android App Bundle)
npm run build:android

# Submit to Play Console
npm run submit:android

# Or combined
npm run deploy:android
```

### Step 5: Release Tracks

| Track | Purpose | Review Required |
|-------|---------|-----------------|
| internal | Team testing (100 users max) | No |
| alpha | Closed testing | No |
| beta | Open testing | No |
| production | Public release | Yes |

---

## Over-the-Air Updates

EAS Update allows pushing JS/asset updates without app store review:

```bash
# Push update to preview channel
npm run update:preview "Fix medication reminder bug"

# Push update to production channel
npm run update:production "Performance improvements"

# View update history
eas update:list
```

### Limitations

OTA updates can change:
- JavaScript code
- Assets (images, fonts)
- Configuration files

OTA updates CANNOT change:
- Native code
- Native modules
- app.json native properties (version, permissions, etc.)

---

## Rollback Procedures

### OTA Update Rollback

```bash
# List recent updates
eas update:list --branch production

# Republish previous update
eas update:republish --group GROUP_ID --branch production
```

### Binary Rollback (App Store/Play Store)

1. **iOS**: Cannot directly rollback; must submit new build with reverted code
2. **Android**: Can halt rollout and upload previous APK/AAB version

### Emergency Procedures

1. **Immediate**: Use OTA update to disable problematic feature
2. **Short-term**: Submit hotfix build through expedited review
3. **Long-term**: Conduct post-mortem and update deployment procedures

---

## Troubleshooting

### Common Issues

#### Build Fails: Missing google-services.json

```
Error: google-services.json not found
```

Solution: Add Firebase config file or remove `googleServicesFile` from app.json if not using FCM.

#### iOS Signing Issues

```bash
# Reset iOS credentials
eas credentials --platform ios

# Choose "Manage credentials" > "Remove specific"
# Then rebuild to regenerate
```

#### Android Keystore Issues

```bash
# View current keystore
eas credentials --platform android

# Reset if needed (WARNING: breaks existing installs)
# Only do this for development builds
```

#### Submission Rejected

- Review rejection reasons in App Store Connect / Play Console
- Common issues:
  - Missing privacy policy URL
  - Incomplete app metadata
  - Crashes during review
  - Insufficient app functionality

### Debug Commands

```bash
# Check project configuration
npm run doctor

# View build logs
eas build:view

# Check credentials status
eas credentials --platform all
```

---

## Pre-deployment Checklist

### Before First Production Build

- [ ] Update `app.json` with correct project ID
- [ ] Set production Supabase credentials in EAS Secrets
- [ ] Configure iOS credentials (certificates, provisioning profiles)
- [ ] Configure Android keystore
- [ ] Add `google-services.json` for FCM (if using push notifications)
- [ ] Create Google Play service account for auto-submit
- [ ] Verify all app icons and splash screens are correct size
- [ ] Test deep linking configuration

### App Store Metadata (iOS)

- [ ] App name and subtitle
- [ ] Description (primary and promotional)
- [ ] Screenshots (6.5", 5.5", iPad if supporting)
- [ ] App preview video (optional)
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] Marketing URL (optional)
- [ ] App category
- [ ] Age rating questionnaire
- [ ] App Store icon (1024x1024)

### Play Store Metadata (Android)

- [ ] App title
- [ ] Short description (80 characters)
- [ ] Full description (4000 characters)
- [ ] Screenshots (phone, 7" tablet, 10" tablet)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target audience
- [ ] App category

### Before Each Release

- [ ] Run `npm run validate:full` (typecheck, lint, tests)
- [ ] Test on physical iOS and Android devices
- [ ] Review crash reports from previous version
- [ ] Update version number and build number
- [ ] Update changelog / release notes
- [ ] Backup production database (if applicable)
- [ ] Notify stakeholders of deployment schedule

---

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH (e.g., 1.2.3)

MAJOR: Breaking changes, major features
MINOR: New features, backwards compatible
PATCH: Bug fixes, minor improvements
```

### Build Numbers

- **iOS buildNumber**: Increments with each submission to TestFlight
- **Android versionCode**: Increments with each upload to Play Console

EAS can auto-increment these with `autoIncrement: true` in eas.json.

### Manual Version Update

```bash
# Update version in package.json and app.json
# Then rebuild
npm run build:production
```

---

## Contact & Support

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction
- **EAS Submit**: https://docs.expo.dev/submit/introduction
- **Apple Developer Support**: https://developer.apple.com/contact
- **Google Play Support**: https://support.google.com/googleplay/android-developer

---

Last Updated: 2025-12-03
