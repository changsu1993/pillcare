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
├── mobile/               # React Native app
│   ├── src/
│   │   ├── screens/     # Screen components
│   │   │   ├── parent/  # Parent-facing screens
│   │   │   └── child/   # Child-facing screens
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API, notification services
│   │   ├── hooks/       # Custom React Hooks
│   │   └── utils/       # Utility functions
│   ├── ios/
│   └── android/
├── backend/             # Supabase configuration
│   ├── supabase/
│   │   ├── migrations/  # Database schema
│   │   └── functions/   # Edge Functions
│   └── firebase/        # FCM configuration
├── data/                # SQLite DB (local development)
├── tests/               # E2E tests
└── docs/                # Documentation
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

## Resources

- [React Native Documentation](https://reactnative.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Elderly UX Guidelines](https://www.nngroup.com/articles/usability-seniors/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## License
MIT License

---
**Last Updated**: 2025-11-19
**Version**: 0.1.0 (MVP Planning Phase)
