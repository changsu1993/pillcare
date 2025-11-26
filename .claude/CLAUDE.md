# PillCare - Medication & Healthcare Management for Elderly Parents

## Project Overview

A healthcare service that automatically manages medication schedules and hospital appointments for elderly parents, with real-time notifications to their children when medications are missed.

### Core Value Proposition
- **Parent App**: Elderly-friendly design with large text, voice guidance, and simple 2-button UI
- **Child App**: Real-time monitoring of parents' medication adherence with instant notifications

## Tech Stack

### Frontend
- **React Native**: Cross-platform iOS/Android development
- **TypeScript**: Type safety and better developer experience
- **React Navigation**: Screen routing and navigation
- **React Native Push Notification**: Local and remote notifications

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
│   ├── features/              # Feature-based modules
│   │   ├── auth/              # Authentication feature
│   │   ├── medications/       # Medication management
│   │   ├── home/              # Home screens
│   │   └── settings/          # Settings feature
│   │       ├── components/    # Feature-specific components
│   │       ├── screens/
│   │       │   ├── parent/    # Parent-facing screens
│   │       │   └── child/     # Child-facing screens
│   │       ├── hooks/         # Feature-specific hooks
│   │       ├── services/      # Feature services
│   │       ├── contexts/      # React contexts
│   │       └── types/         # TypeScript types
│   ├── components/            # Shared components
│   ├── services/              # Global services (Supabase, etc.)
│   ├── hooks/                 # Global hooks
│   ├── navigation/            # Navigation configuration
│   ├── types/                 # Global TypeScript types
│   └── utils/                 # Utility functions
├── ios/
├── android/
├── .claude/
│   ├── agents/                # Custom AI agents (16 specialists)
│   ├── skills/                # Reusable skills (12 skills)
│   └── commands/              # Slash commands
└── tests/                     # E2E tests
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
- [ ] Medication reminder notifications (large text, vibration, voice)
- [ ] Simple "Took it / Missed it" 2-button UI
- [ ] Medication history view (calendar)
- [ ] Voice guidance feature
- [ ] Large, high-contrast UI design

### Child App
- [ ] Parent's medication timeline view
- [ ] Push notifications on missed medications
- [ ] Hospital appointment management
- [ ] Configure medication reminder times
- [ ] Weekly/monthly adherence reports

### Common Features
- [ ] Sign up / Login (email, social auth)
- [ ] Family connection (invitation code system)
- [ ] Profile management
- [ ] Settings (notification preferences, etc.)

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
# Install MCP servers
./setup-mcp.sh

# Install dependencies
cd mobile && npm install

# Run iOS
npm run ios

# Run Android
npm run android
```

### Testing
```bash
# Unit tests
npm test

# E2E tests (Playwright)
npm run test:e2e
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
**Last Updated**: 2025-11-27
**Version**: 0.2.0 (Feature-based Architecture)
