# PillCare Onboarding Flow Design Specification

## Document Information
- **Version**: 1.0
- **Created**: 2024-12-04
- **Author**: UI/UX Design Team
- **Status**: Design Specification

---

## 1. Overview

### 1.1 Purpose
This document defines the onboarding tutorial flow for PillCare, a medication management app designed for elderly parents and their adult children. The onboarding introduces core features while respecting the different cognitive load capacities and UI needs of each user type.

### 1.2 Design Principles
- **Parent App**: Maximum simplicity, minimum cognitive load
- **Child App**: Efficient information delivery, feature discovery
- **Both**: Clear value proposition, immediate actionability

### 1.3 Technical Integration
- Onboarding state stored in AsyncStorage (`@pillcare_onboarding_completed`)
- Check on app launch after authentication
- Accessible via Settings > "View Tutorial" for repeat access

---

## 2. Parent App Onboarding (Elderly Users)

### 2.1 Design Requirements

| Requirement | Specification |
|------------|---------------|
| Total Screens | 3 screens (excluding welcome) |
| Font Size | Minimum 24pt body, 36pt headings |
| Touch Targets | Minimum 72px height |
| Contrast Ratio | WCAG AAA (7:1 minimum) |
| Animation | Minimal, no auto-advancing |
| Voice Support | Optional TTS for each screen |

### 2.2 Color Palette (High Contrast)

```
Background:     #FFFFFF (white)
Primary Text:   #1A1A1A (near-black, gray-900)
Success:        #166534 (success-800 for text)
Success BG:     #22C55E (success-500 for buttons)
Warning:        #92400E (warning-800 for text)
Warning BG:     #F59E0B (warning-500 for highlights)
Button Primary: #22C55E (success)
Button Neutral: #4B5563 (gray-600)
```

### 2.3 Screen-by-Screen Specification

---

#### Screen 0: Welcome (Entry Point)

**Purpose**: Warm greeting, establish trust

**Layout**:
```
+----------------------------------+
|                                  |
|        [App Logo/Icon]           |
|            96x96px               |
|                                  |
|     PillCare에 오신 것을          |
|        환영합니다                 |
|                                  |
|    간단한 사용법을 알려드릴게요     |
|                                  |
|                                  |
|   +---------------------------+  |
|   |       시작하기            |  |
|   +---------------------------+  |
|                                  |
|        건너뛰기                   |
|                                  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Accessibility |
|---------|-------|---------------|
| App Logo | 96x96px, centered | `accessibilityLabel="필케어 앱 로고"` |
| Title | 36pt, bold, gray-900 | `accessibilityRole="header"` |
| Subtitle | 24pt, regular, gray-700 | `accessibilityLabel` included |
| Start Button | h-[72px], bg-success, rounded-2xl | `accessibilityRole="button"` |
| Skip Link | 20pt, underlined, gray-600 | `accessibilityHint="튜토리얼을 건너뛰고 앱을 바로 시작합니다"` |

**Content**:
- Title: "PillCare에 오신 것을 환영합니다"
- Subtitle: "간단한 사용법을 알려드릴게요"
- Button: "시작하기"
- Skip: "건너뛰기"

**Voice Guidance Script**:
> "필케어에 오신 것을 환영합니다. 간단한 사용법을 알려드리겠습니다. 시작하기 버튼을 눌러주세요."

---

#### Screen 1: Taking Medication

**Purpose**: Explain the core 2-button interaction

**Layout**:
```
+----------------------------------+
|  [Progress: 1/3]                 |
|                                  |
|          [Pill Icon]             |
|            64x64px               |
|                                  |
|      약 먹을 시간이 되면          |
|       알림이 울려요              |
|                                  |
|   +---------------------------+  |
|   |     [Mock Reminder UI]    |  |
|   |                           |  |
|   |    [Green] [Gray]         |  |
|   |   먹었어요  못먹었어요      |  |
|   +---------------------------+  |
|                                  |
|    두 버튼 중 하나만 누르면 돼요   |
|                                  |
|   +---------------------------+  |
|   |         다음              |  |
|   +---------------------------+  |
|                                  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress Indicator | 3 circles, current filled (success-500) | Large dots (16px diameter) |
| Icon | Pill illustration, 64x64px | Simple line art style |
| Heading | 32pt, bold, gray-900 | Two-line centered |
| Mock UI | Bordered container showing buttons | Scaled-down demo |
| Instruction | 24pt, regular, gray-700 | Clear action guidance |
| Next Button | h-[72px], bg-success, full-width | "다음" text |

**Content**:
- Progress: "1 / 3"
- Heading: "약 먹을 시간이 되면\n알림이 울려요"
- Mock UI: Shows the two-button interface preview
- Instruction: "두 버튼 중 하나만 누르면 돼요"
- Button: "다음"

**Voice Guidance Script**:
> "약 먹을 시간이 되면 알림이 울립니다. 초록색 '먹었어요' 버튼이나 회색 '못 먹었어요' 버튼 중 하나만 누르시면 됩니다. 다음 버튼을 눌러주세요."

**Illustration Description**:
- Simple pill icon (capsule shape)
- Minimal detail, high contrast outline
- Optional: slight gradient fill (#22C55E to #16A34A)

---

#### Screen 2: Voice Guidance Feature

**Purpose**: Introduce accessibility feature

**Layout**:
```
+----------------------------------+
|  [Progress: 2/3]                 |
|                                  |
|        [Speaker Icon]            |
|            64x64px               |
|                                  |
|      음성 안내를 켜면            |
|     약 이름을 읽어드려요          |
|                                  |
|   +---------------------------+  |
|   |   [Sound Wave Visual]     |  |
|   |                           |  |
|   |    "혈압약을 드세요"        |  |
|   +---------------------------+  |
|                                  |
|    설정에서 켜고 끌 수 있어요     |
|                                  |
|   +---------------------------+  |
|   |         다음              |  |
|   +---------------------------+  |
|                                  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress Indicator | 3 circles, second filled | Visual progress |
| Icon | Speaker with sound waves, 64x64px | Simple line art |
| Heading | 32pt, bold, gray-900 | Two-line centered |
| Demo Area | Light gray bg (#F3F4F6), rounded | Shows example speech |
| Example Text | 28pt, italic, gray-700 | Quoted speech bubble |
| Tip | 24pt, regular, gray-600 | Settings reference |
| Next Button | h-[72px], bg-success, full-width | "다음" text |

**Content**:
- Progress: "2 / 3"
- Heading: "음성 안내를 켜면\n약 이름을 읽어드려요"
- Example: "혈압약을 드세요"
- Tip: "설정에서 켜고 끌 수 있어요"
- Button: "다음"

**Voice Guidance Script**:
> "음성 안내 기능을 켜면 약 이름을 소리로 읽어드립니다. 예를 들어, '혈압약을 드세요'라고 안내합니다. 설정 화면에서 이 기능을 켜거나 끌 수 있습니다."

**Illustration Description**:
- Speaker icon with 2-3 curved lines (sound waves)
- High contrast, bold stroke (3px)
- Optional animation: gentle pulse on sound waves

---

#### Screen 3: Completion

**Purpose**: Confirmation and quick start

**Layout**:
```
+----------------------------------+
|  [Progress: 3/3]                 |
|                                  |
|        [Checkmark Icon]          |
|            96x96px               |
|                                  |
|        준비 완료!                 |
|                                  |
|     이제 약 알림을 받을 수         |
|       있습니다                   |
|                                  |
|                                  |
|   +---------------------------+  |
|   |        시작하기           |  |
|   +---------------------------+  |
|                                  |
|   [ ] 다시 보지 않기              |
|                                  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress Indicator | 3 circles, all filled (success-500) | Complete state |
| Icon | Checkmark in circle, 96x96px | Success green (#22C55E) |
| Title | 40pt, bold, success-700 | Celebratory |
| Message | 28pt, regular, gray-700 | Two-line centered |
| Start Button | h-[72px], bg-success, full-width | "시작하기" |
| Checkbox | 24px checkbox + 20pt label | "다시 보지 않기" |

**Content**:
- Progress: "3 / 3"
- Title: "준비 완료!"
- Message: "이제 약 알림을 받을 수 있습니다"
- Button: "시작하기"
- Checkbox: "다시 보지 않기"

**Voice Guidance Script**:
> "준비가 완료되었습니다! 이제 약 복용 알림을 받을 수 있습니다. 시작하기 버튼을 눌러 앱을 사용해보세요."

**Illustration Description**:
- Large checkmark inside circle
- White checkmark on success green background
- Subtle shadow for depth

---

## 3. Child App Onboarding (Adult Children)

### 3.1 Design Requirements

| Requirement | Specification |
|------------|---------------|
| Total Screens | 4 screens (excluding welcome) |
| Font Size | 16pt body, 24pt headings |
| Touch Targets | Minimum 48px height |
| Contrast Ratio | WCAG AA (4.5:1 minimum) |
| Animation | Subtle transitions allowed |
| Information Density | Medium-high |

### 3.2 Color Palette

```
Background:     #FFFFFF (white)
Primary Text:   #1F2937 (gray-800)
Secondary Text: #6B7280 (gray-500)
Primary:        #3B82F6 (primary-500)
Primary Dark:   #1D4ED8 (primary-700)
Success:        #22C55E (success-500)
Warning:        #F59E0B (warning-500)
```

### 3.3 Screen-by-Screen Specification

---

#### Screen 0: Welcome (Entry Point)

**Purpose**: Quick introduction, value proposition

**Layout**:
```
+----------------------------------+
|                                  |
|         [App Logo]               |
|           64x64px                |
|                                  |
|        PillCare                  |
|                                  |
|   부모님의 건강한 복약 습관을       |
|     함께 관리하세요               |
|                                  |
|   +---------------------------+  |
|   |      튜토리얼 시작         |  |
|   +---------------------------+  |
|                                  |
|         건너뛰기 >                |
|                                  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Accessibility |
|---------|-------|---------------|
| Logo | 64x64px, centered | `accessibilityLabel="필케어 로고"` |
| App Name | 28pt, bold, primary-500 | `accessibilityRole="header"` |
| Tagline | 18pt, regular, gray-600 | Two lines |
| Start Button | h-[52px], bg-primary, rounded-xl | `accessibilityRole="button"` |
| Skip Link | 16pt, primary-500, right-aligned | Arrow indicator |

**Content**:
- App Name: "PillCare"
- Tagline: "부모님의 건강한 복약 습관을\n함께 관리하세요"
- Button: "튜토리얼 시작"
- Skip: "건너뛰기 >"

---

#### Screen 1: Connecting with Parent

**Purpose**: Explain family connection feature

**Layout**:
```
+----------------------------------+
|  [Progress: o o o o]    건너뛰기  |
|                                  |
|      [Connection Icon]           |
|          48x48px                 |
|                                  |
|    부모님과 연결하기               |
|                                  |
|   부모님이 생성한 초대 코드를       |
|   입력하면 복약 현황을             |
|   실시간으로 확인할 수 있어요       |
|                                  |
|   +---------------------------+  |
|   |  [Code Input Preview]     |  |
|   |   A B C - 1 2 3           |  |
|   +---------------------------+  |
|                                  |
|   설정 > 가족 연결에서            |
|   초대 코드를 입력하세요          |
|                                  |
|   +---------------------------+  |
|   |          다음             |  |
|   +---------------------------+  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress | 4 dots, first active (primary-500) | Top-left aligned |
| Skip | 14pt, gray-500, top-right | Persistent option |
| Icon | Two people connected, 48x48px | Simple illustration |
| Title | 22pt, bold, gray-800 | Single line |
| Description | 16pt, regular, gray-600 | Three lines max |
| Preview | Light border, rounded-lg | Shows code format |
| Tip | 14pt, medium, gray-500 | Navigation hint |
| Next Button | h-[48px], bg-primary, rounded-xl | Full width |

**Content**:
- Title: "부모님과 연결하기"
- Description: "부모님이 생성한 초대 코드를 입력하면 복약 현황을 실시간으로 확인할 수 있어요"
- Tip: "설정 > 가족 연결에서 초대 코드를 입력하세요"
- Button: "다음"

**Illustration Description**:
- Two person silhouettes with a connecting line/arc
- Primary blue color (#3B82F6)
- Minimalist style, single weight stroke

---

#### Screen 2: Managing Medications

**Purpose**: Show how to add/edit parent's medications

**Layout**:
```
+----------------------------------+
|  [Progress: * o o o]    건너뛰기  |
|                                  |
|       [Medication Icon]          |
|          48x48px                 |
|                                  |
|      약 등록하기                  |
|                                  |
|   부모님이 드시는 약을 등록하고     |
|   복용 시간을 설정할 수 있어요      |
|                                  |
|   +---------------------------+  |
|   | [Mini Medication Card]    |  |
|   | 혈압약           09:00    |  |
|   | 당뇨약      09:00, 18:00  |  |
|   +---------------------------+  |
|                                  |
|   약 관리 탭에서 추가하세요        |
|                                  |
|   +---------------------------+  |
|   |          다음             |  |
|   +---------------------------+  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress | 4 dots, second active | Sequential highlight |
| Icon | Pill/capsule, 48x48px | Medical theme |
| Title | 22pt, bold, gray-800 | Action-oriented |
| Description | 16pt, regular, gray-600 | Two lines |
| Preview Card | bg-gray-50, rounded-lg | Shows list format |
| Mini Items | 14pt, flex-row, space-between | Name + time |
| Tip | 14pt, medium, gray-500 | Tab reference |
| Next Button | h-[48px], bg-primary, rounded-xl | Full width |

**Content**:
- Title: "약 등록하기"
- Description: "부모님이 드시는 약을 등록하고 복용 시간을 설정할 수 있어요"
- Example 1: "혈압약 — 09:00"
- Example 2: "당뇨약 — 09:00, 18:00"
- Tip: "약 관리 탭에서 추가하세요"
- Button: "다음"

**Illustration Description**:
- Capsule with a small plus sign
- Clean, outline style
- Primary blue or success green

---

#### Screen 3: Understanding Reports

**Purpose**: Explain adherence reporting feature

**Layout**:
```
+----------------------------------+
|  [Progress: * * o o]    건너뛰기  |
|                                  |
|        [Chart Icon]              |
|          48x48px                 |
|                                  |
|     복약 현황 리포트               |
|                                  |
|   주간/월간 복약률을 한눈에         |
|   확인할 수 있어요                 |
|                                  |
|   +---------------------------+  |
|   |    [Mini Bar Chart]       |  |
|   |    월 화 수 목 금 토 일     |  |
|   |    ## ## ## ## ## ## ##   |  |
|   |                           |  |
|   |    이번 주 복약률: 85%     |  |
|   +---------------------------+  |
|                                  |
|   리포트 탭에서 확인하세요         |
|                                  |
|   +---------------------------+  |
|   |          다음             |  |
|   +---------------------------+  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress | 4 dots, third active | Sequential |
| Icon | Bar chart, 48x48px | Analytics theme |
| Title | 22pt, bold, gray-800 | Feature name |
| Description | 16pt, regular, gray-600 | Value prop |
| Chart Preview | bg-gray-50, simplified chart | Visual example |
| Bar Indicators | Colored bars (success/warning) | Week view |
| Stat | 16pt, bold, primary-500 | Key metric |
| Tip | 14pt, medium, gray-500 | Tab reference |
| Next Button | h-[48px], bg-primary, rounded-xl | Full width |

**Content**:
- Title: "복약 현황 리포트"
- Description: "주간/월간 복약률을 한눈에 확인할 수 있어요"
- Stat: "이번 주 복약률: 85%"
- Tip: "리포트 탭에서 확인하세요"
- Button: "다음"

**Illustration Description**:
- Simple bar chart with 7 bars
- Varying heights showing adherence
- Success green for high, warning yellow for low

---

#### Screen 4: Push Notifications

**Purpose**: Explain alert system for missed medications

**Layout**:
```
+----------------------------------+
|  [Progress: * * * o]    건너뛰기  |
|                                  |
|        [Bell Icon]               |
|          48x48px                 |
|                                  |
|     미복용 알림 받기              |
|                                  |
|   부모님이 약을 안 드시면          |
|   푸시 알림으로 알려드려요         |
|                                  |
|   +---------------------------+  |
|   | [Notification Preview]    |  |
|   |                           |  |
|   | PillCare                  |  |
|   | 어머니가 혈압약을           |  |
|   | 복용하지 않았습니다          |  |
|   +---------------------------+  |
|                                  |
|   설정에서 알림을 관리하세요       |
|                                  |
|   +---------------------------+  |
|   |          다음             |  |
|   +---------------------------+  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress | 4 dots, fourth active | Near complete |
| Icon | Bell with badge, 48x48px | Notification theme |
| Title | 22pt, bold, gray-800 | Feature name |
| Description | 16pt, regular, gray-600 | Clear benefit |
| Notification Preview | Border, shadow-sm, rounded-xl | iOS/Android style |
| App Name | 14pt, bold, gray-800 | "PillCare" |
| Message | 14pt, regular, gray-600 | Example content |
| Tip | 14pt, medium, gray-500 | Settings reference |
| Next Button | h-[48px], bg-primary, rounded-xl | Full width |

**Content**:
- Title: "미복용 알림 받기"
- Description: "부모님이 약을 안 드시면 푸시 알림으로 알려드려요"
- Notification: "어머니가 혈압약을 복용하지 않았습니다"
- Tip: "설정에서 알림을 관리하세요"
- Button: "다음"

**Illustration Description**:
- Bell icon with red badge (dot)
- Alert/warning connotation
- Clean outline with accent

---

#### Screen 5: Completion

**Purpose**: End tutorial, encourage first action

**Layout**:
```
+----------------------------------+
|  [Progress: * * * *]             |
|                                  |
|         [Success Icon]           |
|           72x72px                |
|                                  |
|        준비 완료!                 |
|                                  |
|   이제 부모님의 건강한 복약        |
|   습관을 함께 관리하세요           |
|                                  |
|                                  |
|   +---------------------------+  |
|   |    부모님 연결하러 가기    |  |
|   +---------------------------+  |
|                                  |
|   +---------------------------+  |
|   |      홈으로 가기          |  |
|   +---------------------------+  |
|                                  |
|   [ ] 다시 보지 않기              |
|                                  |
+----------------------------------+
```

**UI Elements**:

| Element | Style | Notes |
|---------|-------|-------|
| Progress | 4 dots, all active (success) | Complete |
| Icon | Checkmark in circle, 72x72px | Success theme |
| Title | 28pt, bold, success-600 | Celebratory |
| Message | 16pt, regular, gray-600 | Two lines |
| Primary CTA | h-[48px], bg-primary, rounded-xl | Direct action |
| Secondary CTA | h-[48px], border-primary, rounded-xl | Alternative |
| Checkbox | 20px checkbox + 14pt label | Opt-out option |

**Content**:
- Title: "준비 완료!"
- Message: "이제 부모님의 건강한 복약 습관을 함께 관리하세요"
- Primary CTA: "부모님 연결하러 가기"
- Secondary CTA: "홈으로 가기"
- Checkbox: "다시 보지 않기"

**Illustration Description**:
- Checkmark inside circle
- Success green fill with white checkmark
- Subtle celebration element (confetti/sparkle) optional

---

## 4. Navigation Flow

### 4.1 Parent App Flow

```
[App Launch]
     |
     v
[Check Onboarding Status]
     |
     +-- Completed --> [Parent Home Screen]
     |
     +-- Not Completed
            |
            v
       [Welcome Screen]
            |
            +-- "시작하기" --> [Screen 1: Taking Medication]
            |                       |
            +-- "건너뛰기"           v
            |                 [Screen 2: Voice Guidance]
            |                       |
            v                       v
    [Set Completed]          [Screen 3: Completion]
            |                       |
            v                       +-- "시작하기"
    [Parent Home]                   |
                                    +-- Checkbox checked?
                                    |       |
                                    |       +-- Yes --> [Set Completed]
                                    |       |
                                    |       +-- No --> [Don't Set]
                                    |
                                    v
                             [Parent Home]
```

### 4.2 Child App Flow

```
[App Launch]
     |
     v
[Check Onboarding Status]
     |
     +-- Completed --> [Child Home Screen]
     |
     +-- Not Completed
            |
            v
       [Welcome Screen]
            |
            +-- "튜토리얼 시작" --> [Screen 1: Connecting]
            |                            |
            +-- "건너뛰기 >"              v
            |                      [Screen 2: Medications]
            v                            |
    [Set Completed]                      v
            |                      [Screen 3: Reports]
            v                            |
    [Child Home]                         v
                                   [Screen 4: Notifications]
                                         |
                                         v
                                   [Screen 5: Completion]
                                         |
                                         +-- "부모님 연결하러 가기"
                                         |        |
                                         |        v
                                         |   [Settings > Enter Code]
                                         |
                                         +-- "홈으로 가기"
                                         |        |
                                         |        v
                                         |   [Child Home]
                                         |
                                         +-- Checkbox checked?
                                                  |
                                                  +-- Yes --> [Set Completed]
                                                  |
                                                  +-- No --> [Don't Set]
```

### 4.3 Re-access from Settings

Both apps include a "View Tutorial" option in Settings:

```
Settings Screen
     |
     +-- "튜토리얼 다시 보기" (or "사용법 보기")
            |
            v
     [Onboarding Flow] (Same screens, without completion state change)
```

---

## 5. Accessibility Specifications

### 5.1 Parent App (WCAG AAA)

| Feature | Specification |
|---------|---------------|
| Contrast Ratio | Minimum 7:1 for all text |
| Font Size | Minimum 24pt (scalable to 2x) |
| Touch Target | Minimum 72px x 72px |
| Focus Indicators | 4px outline, success color |
| Screen Reader | Full VoiceOver/TalkBack support |
| Gestures | Single-tap only, no swipe required |
| Timing | No auto-advance, user-controlled pace |
| Voice Guidance | Available via TTS on each screen |
| Haptic Feedback | Vibration on button press (if enabled) |

### 5.2 Child App (WCAG AA)

| Feature | Specification |
|---------|---------------|
| Contrast Ratio | Minimum 4.5:1 for text |
| Font Size | Minimum 14pt body, 16pt preferred |
| Touch Target | Minimum 48px x 48px |
| Focus Indicators | 2px outline, primary color |
| Screen Reader | Full VoiceOver/TalkBack support |
| Gestures | Swipe to navigate between screens (optional) |
| Timing | User-controlled, skip available |

### 5.3 Accessibility Labels

**Parent App (Korean)**:
```javascript
// Screen 1
accessibilityLabel="약 복용 알림 안내 화면, 3개 중 1번째"
accessibilityHint="다음 버튼을 눌러 계속 진행하세요"

// Buttons
accessibilityRole="button"
accessibilityState={{ disabled: false }}
```

**Child App (Korean)**:
```javascript
// Progress Indicator
accessibilityLabel="튜토리얼 진행 상황, 4개 중 2번째"

// Skip Button
accessibilityLabel="건너뛰기"
accessibilityHint="튜토리얼을 건너뛰고 앱을 바로 시작합니다"
```

---

## 6. Implementation Notes

### 6.1 Storage Keys

```typescript
// AsyncStorage keys
const ONBOARDING_KEYS = {
  PARENT_COMPLETED: '@pillcare_parent_onboarding_completed',
  CHILD_COMPLETED: '@pillcare_child_onboarding_completed',
  DONT_SHOW_AGAIN: '@pillcare_onboarding_dont_show',
};
```

### 6.2 Suggested File Structure

```
src/features/onboarding/
├── navigation/
│   └── OnboardingNavigator.tsx
├── screens/
│   ├── parent/
│   │   ├── ParentWelcomeScreen.tsx
│   │   ├── TakingMedicationScreen.tsx
│   │   ├── VoiceGuidanceScreen.tsx
│   │   └── ParentCompletionScreen.tsx
│   └── child/
│       ├── ChildWelcomeScreen.tsx
│       ├── ConnectingParentScreen.tsx
│       ├── ManagingMedicationsScreen.tsx
│       ├── UnderstandingReportsScreen.tsx
│       ├── NotificationsScreen.tsx
│       └── ChildCompletionScreen.tsx
├── components/
│   ├── ProgressIndicator.tsx
│   ├── OnboardingButton.tsx
│   ├── IllustrationView.tsx
│   └── SkipButton.tsx
├── hooks/
│   └── useOnboarding.ts
└── services/
    └── onboardingStorage.ts
```

### 6.3 NativeWind Classes Reference

**Parent App Buttons**:
```
className="bg-success h-[72px] rounded-2xl justify-center items-center w-full"
```

**Parent App Text**:
```
className="text-4xl font-bold text-gray-900 text-center"  // Heading
className="text-2xl font-normal text-gray-700 text-center" // Body
```

**Child App Buttons**:
```
className="bg-primary h-[48px] rounded-xl justify-center items-center w-full"
```

**Child App Text**:
```
className="text-xl font-bold text-gray-800"  // Heading
className="text-base text-gray-600"          // Body
```

### 6.4 Animation Guidelines

**Parent App**:
- No animations during screen transitions
- Optional: subtle scale animation on button press (0.98)

**Child App**:
- Slide transitions between screens (300ms)
- Progress indicator dot fill animation (200ms)
- Optional: fade-in for illustrations (200ms)

---

## 7. Metrics and Analytics

### 7.1 Events to Track

| Event | Parameters | Purpose |
|-------|------------|---------|
| `onboarding_started` | `user_type`, `timestamp` | Funnel start |
| `onboarding_screen_viewed` | `screen_index`, `screen_name`, `duration` | Engagement |
| `onboarding_skipped` | `screen_index`, `user_type` | Drop-off analysis |
| `onboarding_completed` | `total_duration`, `screens_viewed` | Completion rate |
| `dont_show_checked` | `user_type` | Preference tracking |
| `tutorial_revisited` | `user_type`, `source` | Re-engagement |

### 7.2 Success Metrics

| Metric | Target (Parent) | Target (Child) |
|--------|-----------------|----------------|
| Completion Rate | > 80% | > 70% |
| Avg Time per Screen | < 30 sec | < 15 sec |
| Skip Rate | < 20% | < 30% |
| Tutorial Revisit | < 5% | < 10% |

---

## 8. Testing Checklist

### 8.1 Parent App Testing

- [ ] All text readable at 200% zoom
- [ ] Buttons pressable with imprecise taps
- [ ] VoiceOver reads all content correctly
- [ ] Voice guidance plays when enabled
- [ ] No gesture-based navigation required
- [ ] Works with Bold Text setting enabled
- [ ] Contrast passes WCAG AAA checker
- [ ] Navigation works with Switch Control

### 8.2 Child App Testing

- [ ] All interactive elements > 48px
- [ ] Screen reader announces progress
- [ ] Skip button accessible at all times
- [ ] Deep link to settings works
- [ ] Contrast passes WCAG AA checker
- [ ] Swipe gestures have button alternatives
- [ ] Works in landscape orientation

---

## 9. Localization Notes

Current implementation is Korean-only. For future localization:

- All strings should be extracted to i18n files
- RTL layout support for Arabic/Hebrew
- Date/time formats should respect locale
- Voice guidance requires language-specific TTS voices

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-04 | Initial specification |

---

**End of Document**
