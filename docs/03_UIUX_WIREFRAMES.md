# PillCare - UI/UX Wireframes & Design System

**Prepared by**: UI/UX Designer Agent
**Date**: 2025-11-19
**Version**: 1.0 (MVP Phase)

---

## Executive Summary

This document outlines the user interface design for PillCare, with a strong focus on **elderly-friendly UX principles**. The parent app prioritizes simplicity, large touch targets, high contrast, and voice guidance. The child app focuses on information density and quick actions.

**Design Philosophy**: "So simple, even grandpa can use it."

---

## Table of Contents

1. [Elderly UX Design Principles](#elderly-ux-design-principles)
2. [Design System](#design-system)
3. [Parent App Wireframes](#parent-app-wireframes)
4. [Child App Wireframes](#child-app-wireframes)
5. [User Flow Diagrams](#user-flow-diagrams)
6. [Accessibility Guidelines](#accessibility-guidelines)
7. [Implementation Notes](#implementation-notes)

---

## Elderly UX Design Principles

### 1. **Large Everything**
- **Font Size**: 24pt minimum (parent app), 32pt for critical info
- **Touch Targets**: 60px × 60px minimum (vs. 44px standard)
- **Spacing**: 24px minimum between interactive elements
- **Icons**: 48px × 48px minimum

### 2. **High Contrast**
- **Color Contrast**: 7:1 ratio minimum (WCAG AAA)
- **Background**: Pure white (#FFFFFF) or very light gray (#F5F5F5)
- **Text**: Pure black (#000000) or very dark gray (#1A1A1A)
- **Avoid**: Gray text on gray background, low-contrast colors

### 3. **Simple Navigation**
- **Max Depth**: 2 levels (home → detail, no deeper)
- **Navigation Pattern**: Tab bar (max 3 tabs) or single-screen app
- **Back Button**: Always visible, large, labeled "뒤로"
- **No Gestures**: No swipe, pinch, long-press (tap only)

### 4. **Voice-First**
- **Voice Feedback**: Every action confirmed with voice
- **Voice Input**: Alternative to typing (medication names)
- **Voice Navigation**: Screen reader compatible

### 5. **Forgiving UI**
- **Undo**: Easy to undo mistakes
- **Confirmation**: Destructive actions require confirmation
- **Error Messages**: Clear, non-technical language
- **No Time Pressure**: No auto-dismiss alerts, no timers

### 6. **Consistent Patterns**
- **Same Layout**: All screens follow same structure
- **Color Coding**: Green = good, Red = alert, Yellow = pending
- **Button Position**: Primary action always in same place
- **Icons**: Same icons mean same thing everywhere

---

## Design System

### Color Palette

#### Primary Colors (Parent App)
```
Success Green:    #22C55E (medication taken)
Alert Red:        #EF4444 (medication missed)
Pending Yellow:   #F59E0B (medication upcoming)
Primary Blue:     #3B82F6 (primary actions, links)
```

#### Neutrals
```
Pure White:       #FFFFFF (background)
Light Gray:       #F5F5F5 (secondary background)
Medium Gray:      #9CA3AF (disabled states)
Dark Gray:        #1A1A1A (body text)
Pure Black:       #000000 (headings)
```

#### Semantic Colors
```
Info:             #3B82F6 (informational messages)
Warning:          #F59E0B (warnings, reminders)
Error:            #EF4444 (errors, missed medications)
Success:          #22C55E (success, taken medications)
```

### Typography

#### Parent App (Elderly-Optimized)
```
Heading 1:        32pt, Bold, Black (#000000)
Heading 2:        28pt, Bold, Black (#000000)
Body Large:       24pt, Regular, Dark Gray (#1A1A1A)
Body:             20pt, Regular, Dark Gray (#1A1A1A)
Button Text:      24pt, Bold, White (#FFFFFF) on colored bg
```

#### Child App (Standard)
```
Heading 1:        24pt, Bold, Black (#000000)
Heading 2:        20pt, SemiBold, Black (#000000)
Body:             16pt, Regular, Dark Gray (#1A1A1A)
Small:            14pt, Regular, Medium Gray (#9CA3AF)
Button Text:      16pt, SemiBold
```

#### Font Family
```
Primary:          Noto Sans KR (Korean)
Fallback:         -apple-system, BlinkMacSystemFont, "Segoe UI"
Weight Range:     400 (Regular), 600 (SemiBold), 700 (Bold)
```

### Spacing Scale
```
4px   (xs)  - Tight spacing
8px   (sm)  - Small spacing
16px  (md)  - Default spacing
24px  (lg)  - Large spacing (elderly minimum)
32px  (xl)  - Extra large spacing
48px  (2xl) - Section spacing
```

### Component Library

#### Buttons

**Parent App - Primary Button**
```
Size:             Width 100%, Height 72px (60px min + 12px padding)
Font:             24pt Bold
Border Radius:    16px (large, easy to see)
Padding:          16px vertical, 24px horizontal
Color:            White text on Green (#22C55E) background
Shadow:           0px 4px 8px rgba(0,0,0,0.1)
Active State:     Darken background by 10%
```

**Parent App - Secondary Button**
```
Same as primary, but:
Color:            White text on Medium Gray (#9CA3AF) background
```

**Child App - Standard Button**
```
Size:             Auto width, Height 48px
Font:             16pt SemiBold
Border Radius:    8px
Padding:          12px vertical, 20px horizontal
```

#### Cards

**Medication Card (Parent App)**
```
Size:             Width 100%, Height auto (min 120px)
Background:       White (#FFFFFF)
Border:           2px solid Light Gray (#F5F5F5)
Border Radius:    16px
Padding:          24px
Shadow:           0px 2px 8px rgba(0,0,0,0.1)
```

**Timeline Card (Child App)**
```
Size:             Width 100%, Height auto
Background:       White (#FFFFFF)
Border:           1px solid Light Gray (#E5E7EB)
Border Radius:    12px
Padding:          16px
Shadow:           0px 1px 3px rgba(0,0,0,0.05)
```

#### Icons
```
Size (Parent):    48px × 48px minimum
Size (Child):     24px × 24px
Style:            Outline (not filled, better contrast)
Stroke Width:     2px (parent), 1.5px (child)
Color:            Match text color or semantic color
```

---

## Parent App Wireframes

### Screen 1: Home - Today's Medications

**Purpose**: Show today's medication schedule at a glance
**Key Info**: Current time, upcoming medications, completion status

```
┌─────────────────────────────────────────────┐
│  ☰                PillCare           ⚙️      │ ← Header (64px)
├─────────────────────────────────────────────┤
│                                             │
│  오늘의 약                                    │ ← Heading (32pt)
│  2025년 11월 19일 (화요일)                    │ ← Date (20pt)
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ✅  아침 8:00                         │  │ ← Status icon (48px)
│  │                                       │  │
│  │  혈압약 (Amlodipine)                  │  │ ← Med name (24pt)
│  │  1알                                  │  │ ← Dosage (20pt)
│  │                                       │  │
│  │  복용 완료: 오전 8:05                  │  │ ← Status (20pt, green)
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ⏰  점심 1:00                         │  │
│  │                                       │  │
│  │  콜레스테롤약 (Atorvastatin)          │  │
│  │  1알                                  │  │
│  │                                       │  │
│  │  1시간 후 알림                         │  │ ← Upcoming (20pt, yellow)
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ⏰  저녁 8:00                         │  │
│  │                                       │  │
│  │  혈압약 (Amlodipine)                  │  │
│  │  1알                                  │  │
│  │                                       │  │
│  │  6시간 후                              │  │
│  └───────────────────────────────────────┘  │
│                                             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │      + 새 약 추가                     │   │ ← Button (72px height)
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Each medication card: 120px minimum height
- 24px spacing between cards
- Status icons: 48px × 48px (✅ green, ⏰ yellow, ❌ red)
- Tap entire card to see medication details
- No swipe gestures (tap only)

---

### Screen 2: Medication Reminder (Full-Screen Alert)

**Purpose**: Alert user to take medication RIGHT NOW
**Trigger**: Scheduled medication time

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│              💊                             │ ← Large icon (96px)
│                                             │
│                                             │
│          약 드실 시간입니다!                  │ ← Heading (32pt)
│                                             │
│                                             │
│         혈압약 (Amlodipine)                  │ ← Med name (28pt, bold)
│            1알 복용                          │ ← Dosage (24pt)
│                                             │
│        오전 8:00                            │ ← Time (24pt)
│                                             │
│                                             │
│  🔊 소리와 진동으로 알려드립니다              │ ← Voice feedback (20pt)
│                                             │
│                                             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │       ✓  먹었어요                    │   │ ← Primary (72px)
│  │                                      │   │ ← Green bg, 28pt text
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │       ✗  못 먹었어요                 │   │ ← Secondary (72px)
│  │                                      │   │ ← Gray bg, 28pt text
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │       ⏰  10분 후 다시 알림           │   │ ← Tertiary (56px)
│  └──────────────────────────────────────┘   │ ← Light gray bg
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior**:
- **Full-screen overlay**: Blocks all other interactions
- **Sound**: Loud alarm (80db+), plays until dismissed
- **Vibration**: 5-second pattern, repeats 3 times
- **Voice**: "혈압약 드실 시간입니다" (Korean TTS)
- **No auto-dismiss**: User MUST interact
- **Persistent**: If app closed, notification shows on lock screen

**Button Actions**:
- **먹었어요**: Log as taken → Voice: "혈압약 복용을 기록했습니다" → Return to home
- **못 먹었어요**: Show skip reason → Log as missed → Notify children
- **10분 후 다시 알림**: Snooze → Reminder comes back in 10 min

---

### Screen 3: Medication Taken Confirmation

**Purpose**: Confirm successful medication logging
**Duration**: 2 seconds, auto-dismiss

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│              ✅                             │ ← Large checkmark (128px)
│                                             │ ← Green color
│                                             │
│                                             │
│           복용 기록 완료!                     │ ← Success msg (32pt)
│                                             │
│         혈압약을 드셨습니다                   │ ← Med name (24pt)
│        오전 8:05에 기록됨                     │ ← Timestamp (20pt)
│                                             │
│                                             │
│  🔊 "혈압약 복용을 기록했습니다"              │ ← Voice (20pt, gray)
│                                             │
│                                             │
│                                             │
│  자녀에게 알림을 보냈습니다                   │ ← Family notification
│                                             │
│                                             │
│                                             │
│                                             │
│    (2초 후 자동으로 홈 화면으로 돌아갑니다)    │ ← Auto-dismiss (16pt)
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Large success animation (checkmark grows + green flash)
- Voice confirmation (TTS)
- Auto-dismiss after 2 seconds OR tap anywhere
- Haptic feedback (success vibration pattern)

---

### Screen 4: Skip Reason Selection

**Purpose**: Capture why medication was missed
**Trigger**: User taps "못 먹었어요" button

```
┌─────────────────────────────────────────────┐
│  ←                                          │ ← Back button (48px)
│                                             │
│                                             │
│        왜 못 드셨나요?                        │ ← Question (28pt)
│                                             │
│    이유를 선택해주세요 (선택사항)              │ ← Subtitle (20pt, gray)
│                                             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │     깜빡했어요                        │   │ ← Reason 1 (72px height)
│  │                                      │   │ ← 24pt text
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │     약이 없어요                       │   │ ← Reason 2
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │     몸이 안좋아요                     │   │ ← Reason 3
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │     병원에 갔어요                     │   │ ← Reason 4
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │     이유 없이 기록하기                │   │ ← Skip (56px)
│  └──────────────────────────────────────┘   │ ← Light gray bg
│                                             │
└─────────────────────────────────────────────┘
```

**Button Actions**:
- Tap any reason → Log with reason → Voice: "알겠습니다. 자녀에게 알려드렸습니다"
- "이유 없이 기록하기" → Log without reason
- All actions → Notify children + Return to home

---

### Screen 5: Medication Detail View

**Purpose**: Show medication information and history
**Trigger**: Tap medication card on home screen

```
┌─────────────────────────────────────────────┐
│  ←  혈압약                            🗑️    │ ← Back + Delete (48px)
├─────────────────────────────────────────────┤
│                                             │
│  💊                                         │ ← Medication icon (64px)
│                                             │
│  혈압약 (Amlodipine)                        │ ← Name (28pt, bold)
│  1알, 하루 2번                              │ ← Dosage (20pt)
│                                             │
│  ───────────────────────────────────────    │
│                                             │
│  복용 시간                                   │ ← Section header (20pt)
│                                             │
│  🌅  오전 8:00                              │ ← Time 1 (24pt)
│  🌙  오후 8:00                              │ ← Time 2 (24pt)
│                                             │
│  ───────────────────────────────────────    │
│                                             │
│  이번 주 복용 기록                           │ ← Section header (20pt)
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  월  화  수  목  금  토  일           │    │ ← Week view
│  │  ✅  ✅  ✅  ❌  ✅  ✅  ⏰          │    │ ← Visual history
│  └─────────────────────────────────────┘    │
│                                             │
│  복용률: 86% (6/7)                          │ ← Adherence rate (20pt)
│                                             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │       시간 변경                       │   │ ← Edit button (64px)
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Simple 7-day visual history (icons only)
- Large edit button for time changes
- Delete icon in top-right (trash can, 32px)
- Confirmation dialog before delete

---

### Screen 6: Settings

**Purpose**: App configuration, help, logout
**Navigation**: Tap gear icon (⚙️) in top-right of home

```
┌─────────────────────────────────────────────┐
│  ←  설정                                     │ ← Back button
├─────────────────────────────────────────────┤
│                                             │
│  내 정보                                     │ ← Section (20pt, gray)
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  👤  이름: 김영숙                     │   │ ← User info (64px)
│  │     전화: 010-1234-5678               │   │ ← 20pt text
│  └──────────────────────────────────────┘   │
│                                             │
│  연결된 가족                                 │ ← Section
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  👧  딸: 이지은                        │   │ ← Family member (64px)
│  │     연결일: 2025.11.01                │   │
│  │                          연결 해제 ›   │   │ ← Action
│  └──────────────────────────────────────┘   │
│                                             │
│  알림 설정                                   │ ← Section
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  🔊  소리           [      ON  ]      │   │ ← Toggle (64px)
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  📳  진동           [      ON  ]      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  🗣️  음성 안내      [      ON  ]      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  도움말                                      │ ← Section
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  ❓  사용 방법                    ›   │   │ ← Help (64px)
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  📞  고객센터 (1588-xxxx)        ›   │   │
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Large toggle switches (48px × 24px minimum)
- All rows 64px height
- Clear section headers
- Phone number for customer support (tap to call)

---

## Child App Wireframes

### Screen 1: Home - Parent's Medication Timeline

**Purpose**: Monitor parent's medication adherence today
**Key Info**: Real-time status, adherence rate, quick actions

```
┌─────────────────────────────────────────────┐
│  ☰  엄마의 복약 기록          🔔  👤         │ ← Header (56px)
├─────────────────────────────────────────────┤
│                                             │
│  오늘 (11월 19일)                            │ ← Date (20pt)
│  복약률: 67% (2/3)                          │ ← Adherence (16pt)
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ✅  오전 8:00           9:05 복용     │  │ ← Timeline item (72px)
│  │                                       │  │
│  │  혈압약 (Amlodipine) 1알              │  │ ← Med info (16pt)
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ❌  오후 1:00           미복용        │  │ ← Missed (red bg)
│  │                                       │  │
│  │  콜레스테롤약 (Atorvastatin) 1알      │  │
│  │                                       │  │
│  │  사유: 깜빡했어요                     │  │ ← Skip reason (14pt)
│  │                                       │  │
│  │  [📞 전화하기]  [📨 메시지 보내기]    │  │ ← Quick actions (32px)
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ⏰  오후 8:00           예정          │  │ ← Pending (yellow bg)
│  │                                       │  │
│  │  혈압약 (Amlodipine) 1알              │  │
│  │                                       │  │
│  │  3시간 후 알림 예정                   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  < 어제        이번 주        다음 > │    │ ← Date navigation (44px)
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  📊 기록   🏠 홈   ⚙️ 설정                  │ ← Tab bar (56px)
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Status-based color coding (green/red/yellow background)
- Quick action buttons on missed medications
- Swipe left/right to change date (gestures OK for child app)
- Pull-to-refresh for real-time updates
- Tab bar: 3 tabs only (Records, Home, Settings)

---

### Screen 2: Weekly Adherence Report

**Purpose**: View parent's medication adherence trends
**Navigation**: Tap "📊 기록" tab

```
┌─────────────────────────────────────────────┐
│  ☰  복약 기록                    🔔  👤      │
├─────────────────────────────────────────────┤
│                                             │
│  11월 13일 - 11월 19일                       │ ← Week range (18pt)
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         이번 주 복약률                │    │ ← Chart card
│  │                                     │    │
│  │           78%                       │    │ ← Big number (48pt)
│  │                                     │    │
│  │  ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇░░░░░        │    │ ← Progress bar
│  │                                     │    │
│  │  월  화  수  목  금  토  일          │    │
│  │  90% 80% 70% 60% 90% 80% 90%       │    │ ← Daily breakdown
│  └─────────────────────────────────────┘    │
│                                             │
│  약별 복약률                                 │ ← Section (16pt)
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  혈압약 (Amlodipine)                  │  │ ← Med card (64px)
│  │                                       │  │
│  │  ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇░░  90% (9/10)   │  │ ← Progress (14pt)
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  콜레스테롤약 (Atorvastatin)          │  │
│  │                                       │  │
│  │  ▇▇▇▇▇▇▇▇▇░░░░░░░░  60% (3/5)       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  당뇨약 (Metformin)                   │  │
│  │                                       │  │
│  │  ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇  100% (7/7)   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │   📄 리포트 다운로드 (PDF)           │    │ ← Export button (48px)
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  📊 기록   🏠 홈   ⚙️ 설정                  │
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Visual progress bars (not just numbers)
- Weekly view default (can switch to monthly)
- Export to PDF for doctor visits
- Color coding: Green (>80%), Yellow (60-79%), Red (<60%)

---

### Screen 3: Push Notification (Missed Medication)

**Purpose**: Alert child when parent misses medication
**Trigger**: 30 min after scheduled time without logging

```
┌─────────────────────────────────────────────┐
│                                             │
│  📱 iPhone Notification (Lock Screen)       │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  PillCare                    지금      │  │ ← App name + time
│  ├───────────────────────────────────────┤  │
│  │                                       │  │
│  │  ⚠️ 엄마가 약을 못 드셨어요            │  │ ← Alert title (Bold)
│  │                                       │  │
│  │  콜레스테롤약 (오후 1:00)             │  │ ← Med info
│  │  사유: 깜빡했어요                     │  │ ← Reason
│  │                                       │  │
│  │  ┌────────────┐  ┌────────────┐      │  │
│  │  │ 전화하기    │  │ 앱 열기     │      │  │ ← Quick actions
│  │  └────────────┘  └────────────┘      │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘

Sound: Alert tone (distinct from other notifications)
Vibration: 3 short bursts
Badge: Red badge on app icon (number of missed meds)
```

**Actions**:
- **전화하기**: Opens phone dialer with parent's number
- **앱 열기**: Opens app to medication timeline
- **Swipe/Tap**: Dismiss notification

---

### Screen 4: Family Connection Setup

**Purpose**: Link parent's app to child's app
**Trigger**: First-time setup OR "Add Parent" button

```
┌─────────────────────────────────────────────┐
│  ←  부모님 연결                              │ ← Back button
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│          👨‍👩‍👧                                │ ← Family icon (96px)
│                                             │
│                                             │
│      부모님 앱과 연결하기                     │ ← Heading (24pt)
│                                             │
│  부모님 앱에서 이 코드를 입력해주세요          │ ← Instruction (16pt)
│                                             │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │          8  2  4  5  9  1            │  │ ← 6-digit code (48pt)
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  유효시간: 23:45 남음                        │ ← Timer (14pt, gray)
│                                             │
│                                             │
│  연결 방법:                                  │ ← Help section (16pt)
│  1. 부모님 앱 열기                           │
│  2. "가족 연결" 메뉴 선택                    │
│  3. 위 코드 입력                             │
│  4. 자동으로 연결됩니다                      │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      🔄  새 코드 생성                │    │ ← Refresh code (48px)
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      ❌  취소                        │    │ ← Cancel (48px)
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior**:
- Code valid for 24 hours
- Auto-refresh every 30 seconds (background)
- Real-time connection detection (no manual refresh)
- Success screen when parent enters code

---

### Screen 5: Parent Profile & Settings (Child App)

**Purpose**: Manage parent info, notification preferences
**Navigation**: Tap parent profile in header

```
┌─────────────────────────────────────────────┐
│  ←  엄마 프로필                              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │          👤                           │  │ ← Profile photo (96px)
│  │                                       │  │
│  │        김영숙 (75세)                  │  │ ← Name (20pt)
│  │    전화: 010-1234-5678                │  │ ← Phone (16pt)
│  │                                       │  │
│  │  연결일: 2025년 11월 1일              │  │ ← Connection date (14pt)
│  └───────────────────────────────────────┘  │
│                                             │
│  약 복용 정보                                │ ← Section (16pt, gray)
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  현재 복용 중인 약: 3개               │  │ ← Summary (56px)
│  │  이번 주 복약률: 78%                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  알림 설정                                   │ ← Section
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  미복약 시 알림      [      ON  ]     │  │ ← Toggle (56px)
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  알림 시간 (미복약 후)                │  │ ← Settings (56px)
│  │                          30분  ›      │  │ ← Current value
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  매일 요약 리포트    [      ON  ]     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  위험 설정                                   │ ← Section (Red text)
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  🔗 연결 해제                    ›    │  │ ← Disconnect (56px)
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Notes**:
- Profile photo optional (default avatar if not set)
- Quick call button (tap phone number)
- Disconnect requires confirmation dialog
- Notification preferences saved per parent

---

## User Flow Diagrams

### Flow 1: Parent - Medication Reminder to Logging

```
[Scheduled Time]
      │
      ▼
[Full-Screen Alert Appears]
 ├─ Sound (80db+)
 ├─ Vibration (5 sec)
 └─ Voice: "약 드실 시간입니다"
      │
      ▼
[Parent Sees 2 Buttons]
      │
      ├──────────────┬──────────────┐
      │              │              │
      ▼              ▼              ▼
[먹었어요]      [못 먹었어요]    [10분 후]
      │              │              │
      ▼              ▼              ▼
[Log Taken]    [Skip Reason?]   [Snooze 10min]
      │              │              │
      ▼              ▼              │
[Voice Confirm] [Log Skipped]      │
      │              │              │
      ▼              ▼              │
[Sync to Cloud] [Notify Child]     │
      │              │              │
      ▼              ▼              ▼
[Return Home]  [Return Home]  [Reminder Returns]
```

---

### Flow 2: Child - Receiving Missed Medication Alert

```
[Parent Misses Medication]
      │
      ▼
[30 min grace period]
      │
      ▼
[Still Not Logged?]
      │
      ▼
[Push Notification Sent]
 ├─ Sound (alert tone)
 ├─ Badge (red dot on icon)
 └─ Lock screen notification
      │
      ▼
[Child Receives Alert]
      │
      ├──────────────┬──────────────┐
      │              │              │
      ▼              ▼              ▼
[Tap "전화하기"]  [Tap "앱 열기"]  [Dismiss]
      │              │              │
      ▼              ▼              │
[Phone Dialer]  [Open Timeline]     │
 Opens with      Shows missed        │
 parent's #      medication          │
      │              │              │
      ▼              ▼              ▼
[Call Parent]   [See Details]   [Later]
      │              │
      ▼              ▼
[Remind to     [Optional:
 Take Med]      Message Parent]
```

---

### Flow 3: Family Connection Setup

```
[Child Opens App - First Time]
      │
      ▼
[Welcome Screen]
      │
      ▼
["부모님 연결하기" Button]
      │
      ▼
[Generate 6-Digit Code]
 └─ Valid for 24 hours
      │
      ▼
[Show Code to Child]
      │
┌─────┴─────────────────────────┐
│ PARENT APP                    │
│                               │
│ [Parent Opens App]            │
│       │                       │
│       ▼                       │
│ [Home Screen]                 │
│       │                       │
│       ▼                       │
│ ["가족 연결" Menu]             │
│       │                       │
│       ▼                       │
│ [Enter 6-Digit Code]          │
│  ├─ Large Number Pad          │
│  └─ Voice Input Option        │
│       │                       │
│       ▼                       │
│ [Submit Code]                 │
│       │                       │
└───────┼───────────────────────┘
        │
        ▼
[Server Validates Code]
        │
        ├───────────┬───────────┐
        │           │           │
        ▼           ▼           ▼
   [Valid]     [Invalid]   [Expired]
        │           │           │
        ▼           ▼           ▼
[Create Link]  [Error Msg]  [New Code]
        │
        ▼
[Both Apps Show Success]
 ├─ Parent: "딸/아들과 연결되었습니다"
 └─ Child: "엄마/아빠가 연결되었습니다"
        │
        ▼
[Sync Medication Data]
        │
        ▼
[Child Can Now Monitor]
```

---

## Accessibility Guidelines

### WCAG 2.1 Level AAA Compliance

#### 1. **Perceivable**
- **Color Contrast**: 7:1 minimum (AAA standard)
  - Text: #000000 on #FFFFFF = 21:1 ✅
  - Large text: 4.5:1 minimum
- **Text Size**: 24pt minimum for parent app body text
- **Resizable Text**: Support up to 200% zoom without loss of functionality
- **Audio Alternatives**: Voice guidance for all visual alerts
- **Non-Text Content**: All icons have text labels

#### 2. **Operable**
- **Keyboard Navigation**: All features accessible via keyboard (for assistive devices)
- **Touch Targets**: 60px × 60px minimum (vs. 44px WCAG AA)
- **No Timing**: No auto-dismiss alerts (except success confirmations)
- **No Seizures**: No flashing content >3 times per second
- **Focus Visible**: Clear focus indicators (3px blue outline)

#### 3. **Understandable**
- **Simple Language**: 5th-grade reading level max
- **Predictable Navigation**: Same layout on every screen
- **Error Prevention**: Confirmation dialogs for destructive actions
- **Help Available**: "?" icon on every screen → context help

#### 4. **Robust**
- **Screen Reader Support**: 100% VoiceOver (iOS) and TalkBack (Android) compatibility
- **Semantic HTML**: Proper heading hierarchy, ARIA labels
- **Orientation**: Works in portrait and landscape
- **Platform Features**: Supports system font sizing, dark mode (child app)

---

### Screen Reader Annotations

**Example: Medication Reminder Screen**

```jsx
<View accessible={true} accessibilityRole="alert">
  <Image
    source={pillIcon}
    accessibilityLabel="약 아이콘"
    accessible={true}
  />
  <Text
    accessibilityRole="header"
    accessibilityLabel="약 드실 시간입니다"
  >
    약 드실 시간입니다!
  </Text>
  <Text accessibilityLabel="혈압약 아침로디핀 1알 복용">
    혈압약 (Amlodipine) 1알
  </Text>
  <Button
    accessibilityLabel="먹었어요 버튼. 약을 드셨으면 누르세요"
    accessibilityHint="약 복용을 기록합니다"
  >
    ✓ 먹었어요
  </Button>
  <Button
    accessibilityLabel="못 먹었어요 버튼. 약을 못 드셨으면 누르세요"
    accessibilityHint="약을 건너뛰고 사유를 기록합니다"
  >
    ✗못 먹었어요
  </Button>
</View>
```

---

## Implementation Notes

### Technical Specifications

#### React Native Components
```javascript
// High-contrast theme for elderly users
const elderlyTheme = {
  colors: {
    background: '#FFFFFF',
    text: '#000000',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  fontSizes: {
    heading1: 32,
    heading2: 28,
    body: 24,
    small: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    button: 16,
    card: 16,
  },
  touchTargets: {
    minimum: 60, // 60px × 60px
  },
};
```

#### Voice Guidance (Korean TTS)
```javascript
import Tts from 'react-native-tts';

// Configure Korean TTS
Tts.setDefaultLanguage('ko-KR');
Tts.setDefaultRate(0.4); // Slow speech for elderly
Tts.setDefaultPitch(1.2); // Slightly higher pitch

// Speak medication reminder
const speakReminder = (medicationName) => {
  Tts.speak(`${medicationName} 드실 시간입니다`);
};

// Voice confirmation
const speakConfirmation = (medicationName) => {
  Tts.speak(`${medicationName} 복용을 기록했습니다`);
};
```

#### Push Notifications (FCM)
```javascript
import messaging from '@react-native-firebase/messaging';

// Send missed medication alert to child
const sendMissedMedicationAlert = async (childUserId, medication) => {
  const message = {
    notification: {
      title: '⚠️ 엄마가 약을 못 드셨어요',
      body: `${medication.name} (${medication.time})`,
      sound: 'alert_critical.mp3',
    },
    data: {
      type: 'MISSED_MEDICATION',
      medicationId: medication.id,
      parentId: medication.userId,
    },
    apns: {
      payload: {
        aps: {
          'interruption-level': 'critical', // iOS critical alert
          sound: {
            critical: 1,
            name: 'alert_critical.mp3',
            volume: 1.0,
          },
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'missed_medication',
        priority: 'max',
        sound: 'alert_critical',
      },
    },
    token: childUserFcmToken,
  };

  await messaging().send(message);
};
```

#### Offline Storage (Parent App)
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store medication log offline
const logMedicationOffline = async (log) => {
  const offlineLogs = await AsyncStorage.getItem('offline_logs') || '[]';
  const logs = JSON.parse(offlineLogs);
  logs.push(log);
  await AsyncStorage.setItem('offline_logs', JSON.stringify(logs));
};

// Sync when back online
const syncOfflineLogs = async () => {
  const offlineLogs = await AsyncStorage.getItem('offline_logs');
  if (offlineLogs) {
    const logs = JSON.parse(offlineLogs);
    await api.post('/medication-logs/bulk', logs);
    await AsyncStorage.removeItem('offline_logs');
  }
};
```

---

### Animation Guidelines

#### Parent App (Minimal Animations)
```javascript
// Simple fade-in (200ms)
const SimpleFadeIn = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};

// Success checkmark animation (500ms)
const SuccessCheckmark = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Text style={{ fontSize: 128, color: '#22C55E' }}>✅</Text>
    </Animated.View>
  );
};
```

**Rules for Parent App Animations**:
- ❌ No parallax scrolling
- ❌ No complex transitions
- ❌ No auto-playing animations
- ✅ Simple fade in/out only
- ✅ Success/error feedback animations (brief)
- ✅ Respect `prefers-reduced-motion` system setting

#### Child App (Standard Animations)
```javascript
// Standard iOS-like navigation transitions
// Card stack, slide-in modals, swipe gestures OK
```

---

### Performance Budgets

#### Parent App (Optimized for Old Devices)
```
App Size:         <50 MB (download)
Launch Time:      <3 seconds (cold start)
Memory Usage:     <100 MB (average)
CPU Usage:        <30% (idle)
Battery Drain:    <5% per hour (background)
Notification:     100% delivery rate
```

#### Child App (Standard)
```
App Size:         <100 MB
Launch Time:      <2 seconds
Memory Usage:     <200 MB
```

---

### Testing Checklist

#### Usability Testing (Elderly Users)
- [ ] Recruit 10 participants (ages 70-85)
- [ ] Test first-time setup (with child's help)
- [ ] Test medication reminder flow (solo)
- [ ] Test medication logging (solo)
- [ ] Measure task completion time (<10 sec for logging)
- [ ] Measure error rate (<5%)
- [ ] SUS survey (target: >70)
- [ ] Gather qualitative feedback

#### Accessibility Testing
- [ ] VoiceOver (iOS) full navigation
- [ ] TalkBack (Android) full navigation
- [ ] Color contrast analyzer (all screens AAA)
- [ ] Keyboard navigation (all features)
- [ ] Font scaling (100%, 150%, 200%)
- [ ] Dark mode compatibility (child app)
- [ ] Landscape orientation support

#### Device Testing
- [ ] iPhone SE (2020) - smallest modern iPhone
- [ ] iPhone 14 Pro Max - largest iPhone
- [ ] Samsung Galaxy A series - budget Android
- [ ] Samsung Galaxy S series - flagship Android
- [ ] Low-end device: 2GB RAM, Android 10

---

## Next Steps

1. **High-Fidelity Mockups**: Create pixel-perfect designs in Figma
2. **Interactive Prototype**: Build clickable prototype for usability testing
3. **Design System Package**: Export components for React Native
4. **Usability Testing**: Recruit elderly users, run 5-10 sessions
5. **Iterate**: Refine based on feedback (expect 3-5 iterations)

---

*🤖 Generated with assistance from UI/UX Designer Agent*
*Last Updated: 2025-11-19*
