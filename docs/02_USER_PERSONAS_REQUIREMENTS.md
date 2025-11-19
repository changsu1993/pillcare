# PillCare - User Personas & Requirements

**Prepared by**: Business Analyst + UI/UX Designer Agents
**Date**: 2025-11-19
**Version**: 1.0 (MVP Phase)

---

## Primary User Personas

### Persona 1: "The Concerned Daughter/Son" (Child User)

**Name**: 이지은 (Ji-eun Lee), 42
**Role**: Adult child, primary caregiver coordinator
**Location**: Seoul (parents live in Busan, 3 hours away)

#### Demographics
- Age: 35-55
- Occupation: Office worker, manager-level
- Tech proficiency: High (smartphone power user)
- Income: ₩60-80M/year
- Family: Married with 1-2 kids, both parents alive (70-85)

#### Context
- Parents live >1 hour away (different city or district)
- Primary parent: Mother (75) with hypertension, diabetes, high cholesterol
- Takes 5 medications daily (morning, afternoon, evening)
- Visits parents 1-2 times/month
- Calls daily to check in (10-15 minutes)

#### Pain Points
1. **Constant Worry**: "Did mom take her blood pressure medicine this morning?"
2. **Daily Phone Tag**: Spending 10-15 min/day on medication check-in calls
3. **Guilt**: "I should be there, but I can't leave work/my family"
4. **Surprise Crises**: Finding out mom missed medications for days during monthly visit
5. **Information Gap**: No visibility into medication adherence between visits
6. **Coordination Burden**: Managing hospital appointments remotely

#### Goals
- Real-time visibility into parent's medication adherence
- Immediate alerts when parent misses medication
- Reduce daily check-in call time
- Peace of mind while at work
- Evidence for doctor visits (adherence history)

#### Quote
> "I call my mom every morning to ask if she took her pills, but I never know if she actually did. I worry about it all day. If something happened to her because I wasn't there..."

#### Technology Behavior
- Always has smartphone nearby
- Checks notifications immediately
- Prefers push notifications over email
- Uses KakaoTalk, Naver, Instagram daily
- Willing to pay for services that reduce stress

#### Success Criteria
- Can see medication status in <5 seconds
- Gets alert within 30 minutes of missed medication
- Reduces daily check-in calls by 80%
- Feels confident parent is safe

---

### Persona 2: "The Forgetful Parent" (Parent User)

**Name**: 김영숙 (Young-sook Kim), 75
**Role**: Elderly medication user
**Location**: Busan (lives alone, daughter in Seoul)

#### Demographics
- Age: 70-85
- Occupation: Retired
- Tech proficiency: Low-medium (can use smartphone basics)
- Income: Pension ₩1-2M/month
- Family: Widowed, 2 adult children (both working)

#### Context
- Lives alone in apartment (spouse passed away 5 years ago)
- Chronic conditions: Hypertension, type 2 diabetes, high cholesterol
- Takes 5 medications daily:
  - 08:00 - Blood pressure pill (Amlodipine)
  - 08:00 - Diabetes pill (Metformin)
  - 13:00 - Cholesterol pill (Atorvastatin)
  - 20:00 - Blood pressure pill (2nd dose)
  - 20:00 - Multivitamin
- Forgets medication 2-3 times per week
- Has smartphone (Samsung Galaxy) but uses only phone + KakaoTalk

#### Pain Points
1. **Memory Lapses**: "Did I already take my morning pill?"
2. **Complex Schedule**: Can't remember which pill at what time
3. **Fear of Bothering Children**: "My daughter is busy, I don't want to call her"
4. **Loneliness**: Feels alone managing health without spouse
5. **Low Tech Confidence**: "I don't know how to use apps"
6. **Vision Challenges**: Hard to read small text, tap small buttons

#### Goals
- Remember to take medications on time
- Avoid taking medication twice by mistake
- Maintain independence (not burden children)
- Feel connected to family
- Simple, non-intimidating technology

#### Quote
> "I try to remember my pills, but sometimes I forget if I already took them. I don't want to bother my daughter—she's so busy with work and her kids."

#### Technology Behavior
- Uses phone for calls only
- Uses KakaoTalk for family messages (taught by children)
- Struggles with small buttons and complex menus
- Needs voice guidance for new apps
- Prefers loud, clear alerts (hearing slightly impaired)

#### Physical Limitations
- **Vision**: Mild presbyopia (reading glasses, prefers large text 20pt+)
- **Hearing**: Mild impairment (needs loud alerts, vibration)
- **Motor Skills**: Slight tremor (needs large tap targets 60px+)
- **Memory**: Mild forgetfulness (repeats questions, needs simple flows)

#### Success Criteria
- Can log medication with 1 tap (no typing, no menus)
- Hears/feels reminder even in other room
- Never confused about which pill to take
- Feels app is "friendly" not "cold"

---

### Secondary Persona: "The Busy Urban Family" (Dual-Income Couple)

**Name**: 박민준 (Min-jun Park), 38 & 정수진 (Su-jin Jung), 36
**Context**: Both parents working, 2 kids (elementary school), 4 elderly parents total
**Pain Points**: No time for daily check-ins, managing 4 parents' medications
**Willingness to Pay**: High (₩10,000+/month for time savings)

---

## User Stories (MVP Scope)

### Parent App Stories

#### Epic: Medication Reminders
```
As a forgetful parent,
I want to receive LOUD reminders when it's time to take my medication,
So that I never forget and can stay healthy.

Acceptance Criteria:
- Reminder arrives exactly at scheduled time (±1 min accuracy)
- Alert includes: loud sound (80db+), vibration (5 sec), full-screen notification
- Shows medication name in large text (24pt+)
- Voice reads: "Time for your [medication name]" (Korean TTS)
- Reminder persists until acknowledged (no auto-dismiss)
- Works even if app is closed (background notifications)
```

```
As a parent with multiple medications,
I want to see WHICH medication to take right now,
So that I don't mix up my pills.

Acceptance Criteria:
- Shows medication photo or icon
- Displays medication name (e.g., "혈압약" not "Amlodipine")
- Shows dosage (e.g., "1알" not "5mg")
- Uses high-contrast colors (black text on white background)
- Font size: 24pt minimum
```

#### Epic: Medication Logging
```
As a parent who just took medication,
I want to log it with ONE TAP,
So that I can confirm quickly and get back to my day.

Acceptance Criteria:
- Only 2 buttons visible: "먹었어요" (Took it) and "못 먹었어요" (Missed it)
- Buttons are large: minimum 60px × 60px tap target
- Buttons use color coding: Green (Took it), Gray (Missed it)
- Voice confirmation: "혈압약 복용을 기록했습니다" (Medication logged)
- No keyboard, no typing required
- Logs timestamp automatically
```

```
As a parent who missed medication,
I want to easily mark it as missed,
So that my children know what happened (not that I ignored them).

Acceptance Criteria:
- "못 먹었어요" button equally prominent (no shame)
- Optional skip reason: 1-tap choices (깜빡했어요, 약이 없어요, 기분이 안좋아요)
- Voice acknowledgment: "알겠습니다. 자녀에게 알려드렸습니다"
- No negative language or scolding
```

### Child App Stories

#### Epic: Medication Monitoring
```
As a concerned child,
I want to see if my parent took their medication TODAY,
So that I know they're safe without calling.

Acceptance Criteria:
- Homepage shows today's medications in timeline format
- Each medication shows: name, time, status (✅ Took / ⏰ Pending / ❌ Missed)
- Green checkmark for taken, red X for missed, yellow clock for pending
- Updates in real-time (within 30 seconds of parent logging)
- Can view history (past 7 days minimum)
```

```
As a concerned child,
I want to receive an alert when my parent MISSES medication,
So that I can call them and remind them.

Acceptance Criteria:
- Push notification within 30 minutes of missed medication
- Notification shows: parent name, medication name, scheduled time
- Includes quick action: "Call Mom" button (opens phone dialer)
- Notification sound distinct from other apps
- Works even if app is closed
```

#### Epic: Family Connection
```
As a child setting up the app,
I want to connect my parent's app to mine,
So that I can start monitoring their medications.

Acceptance Criteria:
- Child generates 6-digit invitation code
- Parent enters code in their app (large number pad)
- Connection confirmed with names/photos
- Parent can see who's connected (transparency)
- Parent can disconnect at any time (consent/control)
```

---

## Functional Requirements (MVP)

### FR-1: User Authentication
- FR-1.1: Email + password registration
- FR-1.2: Social login (Kakao, Google) for child users
- FR-1.3: Biometric login (fingerprint, face ID) for returning users
- FR-1.4: Password reset via email

### FR-2: Family Connection
- FR-2.1: Child generates 6-digit invitation code (valid 24 hours)
- FR-2.2: Parent enters code to establish connection
- FR-2.3: Parent can see connected children (name, photo)
- FR-2.4: Parent can revoke connection
- FR-2.5: Support 1 parent → multiple children connections

### FR-3: Medication Management
- FR-3.1: Add medication (name, dosage, frequency, times)
- FR-3.2: Edit medication schedule
- FR-3.3: Delete medication
- FR-3.4: Support recurring schedules (daily, weekly, custom)
- FR-3.5: Support multiple medications (minimum 10)
- FR-3.6: Medication time slots: 00:00-23:59 (any minute precision)

### FR-4: Medication Reminders (Parent App)
- FR-4.1: Push notification at exact scheduled time (±1 min)
- FR-4.2: Full-screen alert overlay (interrupts current activity)
- FR-4.3: Loud sound alert (customizable, default 80db)
- FR-4.4: Vibration alert (5 seconds, pattern)
- FR-4.5: Voice guidance (Korean TTS): "혈압약 드실 시간입니다"
- FR-4.6: Alert persists until user interaction (no auto-dismiss)
- FR-4.7: Snooze option (10 min, 30 min, 1 hour)
- FR-4.8: Works offline (local scheduling)

### FR-5: Medication Logging (Parent App)
- FR-5.1: 2-button UI: "먹었어요" (Took it) / "못 먹었어요" (Missed it)
- FR-5.2: Log timestamp automatically
- FR-5.3: Optional skip reason (1-tap selection)
- FR-5.4: Voice confirmation feedback
- FR-5.5: Sync log to cloud (for child app visibility)
- FR-5.6: Offline logging (sync when online)

### FR-6: Medication Timeline (Child App)
- FR-6.1: Today's medications list (sorted by time)
- FR-6.2: Status indicators: ✅ Taken / ⏰ Pending / ❌ Missed
- FR-6.3: Real-time updates (<30 sec latency)
- FR-6.4: Historical view (7 days minimum)
- FR-6.5: Filter by medication type
- FR-6.6: Export to PDF (for doctor visits)

### FR-7: Missed Medication Alerts (Child App)
- FR-7.1: Push notification when parent misses medication
- FR-7.2: Alert timing: 30 min after scheduled time (if not logged)
- FR-7.3: Quick action: "Call [Parent Name]" button
- FR-7.4: Notification includes: medication name, scheduled time, parent name
- FR-7.5: Multiple notifications if multiple medications missed

### FR-8: Accessibility Features (Parent App)
- FR-8.1: Large font mode (24pt default, 32pt max)
- FR-8.2: High contrast mode (WCAG AAA compliant, 7:1 ratio)
- FR-8.3: Voice navigation (all screens can be navigated by voice)
- FR-8.4: Screen reader support (iOS VoiceOver, Android TalkBack)
- FR-8.5: Haptic feedback for all interactions
- FR-8.6: Minimum tap target: 60px × 60px

---

## Non-Functional Requirements (MVP)

### NFR-1: Performance
- NFR-1.1: App launch time: <3 seconds (cold start)
- NFR-1.2: Medication logging: <1 second response time
- NFR-1.3: Timeline refresh: <2 seconds
- NFR-1.4: Notification delivery: 100% success rate (±1 min accuracy)
- NFR-1.5: Offline mode: All parent app features work without internet

### NFR-2: Reliability
- NFR-2.1: App uptime: 99.9% (max 8 hours downtime/year)
- NFR-2.2: Notification reliability: 99.99% (critical safety feature)
- NFR-2.3: Data sync: Conflict resolution (last-write-wins)
- NFR-2.4: Crash rate: <0.1% of sessions

### NFR-3: Security & Privacy
- NFR-3.1: All data encrypted in transit (TLS 1.3)
- NFR-3.2: All data encrypted at rest (AES-256)
- NFR-3.3: HIPAA-level security (audit logs, access controls)
- NFR-3.4: Parent consent required for family connection
- NFR-3.5: Parent can delete all data (GDPR right to erasure)
- NFR-3.6: No third-party data sharing without consent

### NFR-4: Usability (Elderly UX)
- NFR-4.1: First-time setup: <5 minutes (with child's help)
- NFR-4.2: Daily medication logging: <10 seconds (1-2 taps)
- NFR-4.3: Error rate: <5% for elderly users (usability testing)
- NFR-4.4: Task success rate: >90% for primary flows
- NFR-4.5: User satisfaction (SUS score): >70 (above average)

### NFR-5: Accessibility (WCAG 2.1 Level AAA)
- NFR-5.1: Color contrast: 7:1 minimum (AAA standard)
- NFR-5.2: Font scalability: Up to 200% without loss of functionality
- NFR-5.3: Keyboard navigation: All features accessible without touch
- NFR-5.4: Screen reader: 100% compatibility (iOS/Android)
- NFR-5.5: Motion: No animations that could trigger seizures

### NFR-6: Device Compatibility
- NFR-6.1: iOS: 15.0+ (last 3 years of devices)
- NFR-6.2: Android: 10.0+ (API level 29+)
- NFR-6.3: Screen sizes: 4.7" to 6.7" (iPhone SE to iPhone Pro Max)
- NFR-6.4: Low-end devices: Works on 2GB RAM devices

### NFR-7: Scalability
- NFR-7.1: Support 10,000 concurrent users (Month 3)
- NFR-7.2: Support 100,000 concurrent users (Month 12)
- NFR-7.3: Database: Handle 1M medication logs/day
- NFR-7.4: Push notifications: 100K notifications/hour capacity

---

## User Flows (Critical Paths)

### Flow 1: Parent - First-Time Setup
1. Download app from App Store / Google Play
2. Open app → Welcome screen
3. Choose language (Korean default)
4. Grant permissions (notifications, microphone for voice)
5. Create account OR enter family invitation code (child helps)
6. Add first medication (child helps):
   - Medication name (voice input or keyboard)
   - Time (simple clock picker)
   - Frequency (daily / weekly)
7. Test reminder (trigger immediate reminder to verify sound/vibration)
8. Complete → Home screen (today's medications)

**Success Criteria**: 90% complete setup within 10 minutes (with help)

### Flow 2: Parent - Daily Medication Reminder
1. Reminder triggers at scheduled time (e.g., 08:00)
2. Full-screen alert appears (even if app closed)
3. Sound plays (80db+), vibration (5 sec), voice says: "혈압약 드실 시간입니다"
4. Parent sees: Large text "혈압약 1알", medication icon
5. Parent taps: "먹었어요" (green button, 60px × 60px)
6. Voice confirms: "혈압약 복용을 기록했습니다"
7. Alert dismisses, returns to home screen
8. Log syncs to cloud (within 30 sec)

**Success Criteria**: <10 seconds from reminder to log completion

### Flow 3: Child - Checking Parent's Status
1. Open app
2. Home screen shows parent's today timeline:
   - 08:00 혈압약 ✅ Took it (09:05)
   - 13:00 콜레스테롤약 ⏰ Pending
   - 20:00 혈압약 ⏰ Pending
3. Tap on "혈압약" → See details (medication info, history)
4. Tap "History" → See last 7 days adherence (calendar view)

**Success Criteria**: See status in <5 seconds from app open

### Flow 4: Child - Missed Medication Alert
1. Parent misses 13:00 medication (doesn't log by 13:30)
2. Child receives push notification: "엄마가 콜레스테롤약을 못 드셨어요 (13:00)"
3. Tap notification → Opens app to medication timeline
4. See: "13:00 콜레스테롤약 ❌ Missed (No action)"
5. Tap "Call Mom" button → Phone dialer opens with mom's number
6. Call mom, remind her to take medication
7. Mom takes medication, logs it late (13:45)
8. Child sees update: "13:00 콜레스테롤약 ✅ Took it (13:45 - Late)"

**Success Criteria**: Notification to call action <30 seconds

---

## Acceptance Testing Scenarios

### Scenario 1: Elderly Usability Test
**Setup**: Recruit 10 participants (ages 70-85, smartphone users)
**Task**: Set up app and log 3 medications without help
**Pass Criteria**:
- 80%+ complete setup successfully
- <5% error rate during medication logging
- SUS score >70
- Participants rate app as "easy" or "very easy" (4/5+)

### Scenario 2: Notification Reliability Test
**Setup**: Configure 100 medications across 10 test devices
**Task**: Verify all notifications deliver on time
**Pass Criteria**:
- 100% notification delivery rate
- 95%+ notifications arrive within ±1 min of scheduled time
- 99%+ notifications include sound + vibration
- 0% notification dismissals without user action

### Scenario 3: Offline Functionality Test
**Setup**: Disconnect device from internet
**Task**: Log medications, receive reminders
**Pass Criteria**:
- Reminders trigger offline (100% success)
- Logs saved locally (100% success)
- Logs sync when back online (100% success, no data loss)

---

## Success Metrics (Post-Launch)

### Product Metrics
| Metric | Target (Month 1) | Target (Month 3) | Measurement Method |
|--------|-----------------|------------------|-------------------|
| Parent DAU (Daily Active Users) | 70% | 85% | App analytics |
| Child WAU (Weekly Active Users) | 40% | 60% | App analytics |
| Medication Adherence Rate | 65% | 75% | Taken / Scheduled |
| Avg. logging time | <15 sec | <10 sec | Event tracking |
| First-time setup completion | 80% | 90% | Funnel analysis |

### User Satisfaction
| Metric | Target (Month 1) | Target (Month 3) | Measurement Method |
|--------|-----------------|------------------|-------------------|
| App Store Rating | 4.2+ | 4.5+ | App stores |
| NPS (Net Promoter Score) | 35 | 50 | In-app survey |
| SUS (System Usability Scale) | 68 | 75 | Usability study |
| Parent satisfaction | 80% | 90% | "Would recommend" survey |
| Child peace-of-mind | 70% | 85% | "Reduced worry" survey |

---

## Next Steps

1. **UI/UX Design**: Create wireframes and high-fidelity mockups (elderly-optimized)
2. **Database Design**: Define schema for users, medications, logs, families
3. **Technical Architecture**: React Native setup, Supabase backend, FCM notifications
4. **Usability Testing Plan**: Recruit elderly participants, define test scenarios

---

*🤖 Generated with assistance from Business Analyst + UI/UX Designer Agents*
*Last Updated: 2025-11-19*
