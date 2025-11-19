# PillCare

> Medication and healthcare management app for elderly parents with real-time monitoring for their children.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- React Native development environment ([Setup Guide](https://reactnative.dev/docs/environment-setup))

### Installation

1. **Install MCP servers** (for Claude Code development)
```bash
./setup-mcp.sh
```

2. **Install dependencies**
```bash
cd mobile
npm install
```

3. **Run the app**
```bash
# iOS
npm run ios

# Android
npm run android
```

## Project Structure

See [CLAUDE.md](./.claude/CLAUDE.md) for detailed documentation.

## Features

### Parent App
- ✅ Large text, high contrast UI
- ✅ Voice-guided medication reminders
- ✅ Simple 2-button medication logging

### Child App
- ✅ Real-time medication tracking
- ✅ Push notifications for missed medications
- ✅ Appointment management

## Tech Stack

- **Frontend**: React Native + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Notifications**: Firebase Cloud Messaging
- **Testing**: Jest, Playwright

## Development

### Testing
```bash
npm test                # Unit tests
npm run test:e2e        # E2E tests
```

### Building
```bash
npm run build:ios       # iOS build
npm run build:android   # Android build
```

## Contributing

This is currently a solo project in MVP phase. Contributions will be welcome after initial release.

## License

MIT
