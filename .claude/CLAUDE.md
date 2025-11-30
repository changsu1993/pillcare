# PillCare - Medication & Healthcare Management for Elderly Parents

## Project Overview

A healthcare service that automatically manages medication schedules and hospital appointments for elderly parents, with real-time notifications to their children when medications are missed.

### Core Value Proposition
- **Parent App**: Elderly-friendly design with large text, voice guidance, and simple 2-button UI
- **Child App**: Real-time monitoring of parents' medication adherence with instant notifications

## Tech Stack

### Frontend
- **React Native + Expo**: Cross-platform iOS/Android development
- **TypeScript**: Type safety and better developer experience
- **NativeWind v4**: Tailwind CSS for React Native styling
- **React Navigation**: Screen routing and navigation
- **Expo Notifications**: Local and remote push notifications

### Backend
- **Supabase**:
  - PostgreSQL database
  - Authentication (social login, email/password)
  - Real-time subscriptions
  - Storage (profile images, etc.)
- **Firebase Cloud Messaging (FCM)**: Push notifications

### Development Tools
- **MCP Servers**:
  - SQLite: Local development database
  - Filesystem: Codebase management
  - Git: Version control
  - Playwright: E2E test automation

## Project Structure

```
PillCare/
├── src/
│   ├── features/                    # Feature-based modules
│   │   ├── auth/                    # Authentication feature
│   │   │   ├── navigation/          # Auth navigator
│   │   │   └── screens/             # Login, signup, password reset
│   │   ├── home/                    # Home/dashboard feature
│   │   │   ├── screens/
│   │   │   │   ├── parent/          # Parent home screen
│   │   │   │   └── child/           # Child home screen
│   │   │   └── components/          # Adherence cards, charts
│   │   ├── medication/              # Medication management
│   │   │   ├── screens/
│   │   │   │   ├── parent/          # Add/edit medications
│   │   │   │   └── child/           # Medication list view
│   │   │   ├── components/          # Medication cards, forms
│   │   │   ├── hooks/               # useMedications, etc.
│   │   │   └── services/            # Medication API
│   │   ├── family/                  # Family connections
│   │   │   └── screens/
│   │   │       ├── parent/          # Family code display
│   │   │       └── child/           # Connect to parent
│   │   ├── notifications/           # Push notifications
│   │   │   ├── hooks/               # useNotifications
│   │   │   └── services/            # Notification scheduling
│   │   └── settings/                # App settings
│   │       ├── screens/
│   │       │   ├── parent/          # Parent settings
│   │       │   └── child/           # Child settings
│   │       ├── contexts/            # SettingsContext
│   │       └── services/            # Settings storage
│   ├── navigation/                  # Root navigators
│   │   ├── ParentNavigator.tsx      # Parent tab navigator
│   │   └── ChildNavigator.tsx       # Child tab navigator
│   ├── shared/                      # Shared across features
│   │   ├── components/              # Common UI components
│   │   ├── services/                # Supabase, API clients
│   │   ├── types/                   # TypeScript types
│   │   └── utils/                   # Helper functions
│   └── assets/                      # Images, fonts
├── ios/                             # iOS native code
├── android/                         # Android native code
├── .claude/
│   ├── agents/                      # Custom AI agents (16 specialists)
│   ├── skills/                      # Reusable skills (12 skills)
│   └── commands/                    # Slash commands
├── tailwind.config.js               # NativeWind configuration
├── global.css                       # Tailwind base styles
└── metro.config.js                  # Metro bundler config
```

## Database Schema

### users
- id (uuid, primary key)
- email (string)
- name (string)
- role (enum: 'parent' | 'child')
- phone_number (string, optional)
- created_at (timestamp)
- updated_at (timestamp)

### medications
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- name (string)
- dosage (string)
- frequency (string)
- reminder_times (json array) - e.g., ["09:00", "14:00", "21:00"]
- start_date (date)
- end_date (date, nullable)
- notes (text, nullable)
- created_at (timestamp)

### medication_logs
- id (uuid, primary key)
- medication_id (uuid, foreign key → medications)
- scheduled_at (timestamp)
- taken (boolean)
- taken_at (timestamp, nullable)
- skipped_reason (string, nullable)
- created_at (timestamp)

### family_connections
- id (uuid, primary key)
- parent_id (uuid, foreign key → users)
- child_id (uuid, foreign key → users)
- status (enum: 'pending' | 'active' | 'inactive')
- created_at (timestamp)

### appointments
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- title (string) - e.g., "Cardiology Checkup"
- hospital_name (string)
- appointment_date (timestamp)
- notes (text, nullable)
- created_at (timestamp)

## MVP Feature List

### Parent App
- [x] Medication reminder notifications (large text, vibration)
- [x] Simple "Took it / Missed it" 2-button UI
- [ ] Medication history view (calendar)
- [ ] Voice guidance feature
- [x] Large, high-contrast UI design (NativeWind)

### Child App
- [x] Parent's medication timeline view
- [x] Push notifications on missed medications
- [ ] Hospital appointment management
- [x] Configure medication reminder times
- [x] Weekly/monthly adherence reports (charts)

### Common Features
- [x] Sign up / Login (email)
- [x] Password reset with deep linking
- [x] Family connection (invitation code system)
- [x] Profile management
- [x] Settings (notification preferences, etc.)

## Monetization Strategy

### B2C (Short-term)
- **Premium Subscription**: ₩5,000/month per child user
  - Unlimited medication entries
  - Voice reminders
  - Medication adherence analytics
  - Priority support

### B2B (Mid to Long-term)
- Hospital/clinic/pharmacy partnerships
- Insurance company integration (adherence incentives)
- Pharmaceutical company medication adherence solutions

## Development Roadmap

### Phase 1: MVP Development (3 months)
- Parent/child app core features
- Medication reminders and logging
- Family connection system
- Basic UI/UX

### Phase 2: Beta Testing (3 months)
- Acquire 50-100 beta users
- UX improvements based on elderly user feedback
- Stability and performance optimization
- Bug fixes

### Phase 3: Official Launch (6 months)
- App Store / Google Play release
- Premium subscription launch
- B2B partnership initiation
- Marketing campaigns

## Development Guide

### Local Development Setup
```bash
# Install dependencies
npm install

# Start Expo development server (Expo Go)
npx expo start

# Start with Development Build (for native features)
npx expo start --dev-client

# Create Development Build (first time setup)
npx expo prebuild --platform ios
npx expo run:ios
```

### Styling with NativeWind
```tsx
// Use Tailwind classes via className prop
<View className="flex-1 bg-white p-4">
  <Text className="text-2xl font-bold text-gray-900">Title</Text>
</View>

// Custom colors defined in tailwind.config.js
// primary, success, warning, error, gray-50 to gray-900
```

### Testing
```bash
# TypeScript type check
npx tsc --noEmit

# Lint and auto-fix
npm run lint:fix
```

### Deployment
```bash
# iOS (TestFlight)
npm run build:ios

# Android (Play Console Beta)
npm run build:android
```

## Design Principles

### For Elderly Users (Parent App)
1. **Large Touch Targets**: Minimum 60px × 60px buttons
2. **High Contrast**: WCAG AAA compliance (7:1 ratio)
3. **Simple Navigation**: Maximum 2 levels deep
4. **Voice Feedback**: Audio confirmation for all actions
5. **No Gestures**: Avoid swipe, pinch, long-press

### For Adult Children (Child App)
1. **Information Density**: Show more data at a glance
2. **Quick Actions**: Swipe gestures for common tasks
3. **Notifications**: Actionable notifications (call parent, etc.)
4. **Analytics**: Visual charts for adherence trends

## Security & Privacy

- **HIPAA Compliance**: (Future consideration for US market)
- **GDPR Compliance**: For EU users
- **Data Encryption**: At rest and in transit
- **Role-based Access Control**: Parents can only see their own data
- **Audit Logs**: Track all data access and modifications

## Key Performance Indicators (KPIs)

### Product Metrics
- Medication adherence rate
- Daily active users (DAU)
- User retention (7-day, 30-day)
- Notification response time

### Business Metrics
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Premium conversion rate
- Churn rate

## Claude Code Integration

### Agents (16 Specialists)

All agents use **Opus** model for best performance.

| Agent | Description |
|-------|-------------|
| **mobile-developer** | React Native/Flutter specialist |
| **frontend-developer** | React component architecture |
| **backend-architect** | API design and microservices |
| **fullstack-developer** | End-to-end development |
| **database-architect** | Database design and optimization |
| **test-engineer** | Test automation and QA |
| **code-reviewer** | Code quality and security review |
| **debugger** | Root cause analysis |
| **security-auditor** | OWASP compliance, auth flows |
| **devops-engineer** | CI/CD and infrastructure |
| **deployment-engineer** | Container orchestration |
| **cloud-architect** | AWS/GCP/Azure infrastructure |
| **react-performance-optimizer** | Bundle and render optimization |
| **ui-ux-designer** | User-centered design |
| **product-strategist** | Product roadmap and market analysis |
| **business-analyst** | KPI tracking and reporting |

### Skills (12 Reusable Workflows)

| Skill | Description |
|-------|-------------|
| **run-dev** | Start Expo development server |
| **lint-fix** | Auto-fix linting and formatting |
| **type-check** | TypeScript type checking |
| **accessibility-audit** | Elderly UX accessibility (WCAG AAA) |
| **security-review** | Healthcare data security audit |
| **create-feature** | Generate feature module structure |
| **create-screen** | Create screen with accessibility |
| **create-component** | Create typed, accessible component |
| **update-deps** | Safe dependency updates |
| **clean-cache** | Clear caches and reset environment |
| **generate-types** | Generate Supabase TypeScript types |
| **performance-audit** | App performance analysis |

### Commands (Slash Commands)

| Command | Description |
|---------|-------------|
| `/test-app` | Run E2E tests |
| `/db-schema` | Show database schema |
| `/analyze-code` | Codebase analysis |
| `/deploy` | Deploy to TestFlight/Play Console |
| `/setup-supabase` | Initialize Supabase |

## Resources

- [React Native Documentation](https://reactnative.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Elderly UX Guidelines](https://www.nngroup.com/articles/usability-seniors/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## License
MIT License

---
**Last Updated**: 2025-11-30
**Version**: 0.3.0 (NativeWind + Feature-based Architecture)
