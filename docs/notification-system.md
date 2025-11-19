# PillCare Notification System Documentation

## Overview

This document describes the comprehensive push notification system implemented for the PillCare medication reminder app. The system provides local notifications for elderly parents to remind them to take their medications at scheduled times.

## Architecture

### Core Components

1. **Notification Service** (`src/services/notifications.ts`)
   - Core notification management functions
   - Permission handling
   - Scheduling and cancellation
   - Response listeners

2. **API Integration** (`src/services/api.ts`)
   - Medication-notification binding
   - Automatic scheduling on medication creation
   - Auto-rescheduling on medication updates
   - Auto-cancellation on medication deletion

3. **App Integration** (`App.tsx`)
   - Global notification listeners
   - Navigation handling for notification taps
   - Foreground and background notification handling

4. **Parent Home Screen** (`src/screens/parent/HomeScreen.tsx`)
   - Permission request flow
   - User-friendly permission warnings
   - Test notification tools (dev mode only)

## Features

### 1. Permission Management

The system automatically requests notification permissions when the parent app loads:

```typescript
const hasPermission = await requestNotificationPermissions();
```

**User Experience:**
- Automatic permission request on app launch
- Clear Korean messages explaining why permissions are needed
- Warning banner if permissions are denied
- Easy re-request button

**Platform Support:**
- iOS: Requires explicit user permission
- Android: Creates dedicated notification channel "복약 알림"

### 2. Medication Reminder Notifications

**Scheduling:**
- Notifications are scheduled based on `medication.reminder_times` array
- Each time triggers a daily repeating notification
- Notifications include medication name, dosage, and time

**Example:**
```typescript
const medication = {
  id: '123',
  name: '혈압약',
  dosage: '1알',
  reminder_times: ['09:00', '21:00']
};

// Automatically creates 2 daily repeating notifications
const notificationIds = await scheduleMedicationNotifications(medication);
```

**Notification Content:**
- Title: "💊 약 드실 시간입니다"
- Body: "{medication.name} {medication.dosage}을(를) 복용해주세요"
- Data: medicationId, medicationName, dosage, scheduledTime, type

**Accessibility Features:**
- Large text notifications
- Sound enabled
- Vibration pattern: [0, 250, 250, 250]
- High priority (Android MAX, iOS critical)

### 3. Notification Responses

**When User Taps Notification:**
1. App opens or comes to foreground
2. Automatically navigates to `FullScreenReminderScreen`
3. Shows medication details with large UI
4. Two-button interface: "먹었어요" / "못 먹었어요"

**Foreground Handling:**
- If app is already open, notification still appears
- Auto-navigates to reminder screen after 500ms delay
- Ensures user never misses a reminder

**Background/Killed App Handling:**
- Notification appears in system tray
- Tap opens app and navigates to reminder screen
- All notification data preserved

### 4. Automatic Scheduling

**On Medication Creation:**
```typescript
const { medication, notificationIds } =
  await createMedicationWithNotifications(newMedication);
```

**On Medication Update:**
```typescript
const { medication, notificationIds } =
  await updateMedicationWithNotifications(medicationId, updates);
// Old notifications cancelled, new ones scheduled
```

**On Medication Deletion:**
```typescript
await deleteMedicationWithNotifications(medicationId);
// All related notifications cancelled
```

**On App Launch:**
```typescript
await scheduleAllMedicationNotifications();
// Re-schedules all active medications
```

## User Flow

### First Time User
1. Opens parent app
2. Permission dialog appears: "PillCare가 알림을 보내도록 허용하시겠습니까?"
3. User taps "허용"
4. System automatically schedules all active medication reminders
5. Confirmation: "모든 약의 알림이 예약되었습니다"

### Daily Usage
1. **9:00 AM** - Notification appears: "💊 약 드실 시간입니다"
2. User taps notification
3. App opens to full-screen reminder
4. Large text shows: "혈압약 1알 09:00"
5. User taps "먹었어요"
6. Log saved to database
7. Screen shows confirmation

### When App is Closed
1. Notification appears at scheduled time
2. User taps notification
3. App launches
4. Navigates to FullScreenReminderScreen
5. Same flow as above

## TypeScript Types

### NotificationData
```typescript
export interface NotificationData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // ISO 8601
  type: 'medication_reminder';
}
```

### NotificationSchedule
```typescript
export interface NotificationSchedule {
  medicationId: string;
  notificationIds: string[]; // Expo notification IDs
}
```

## API Reference

### Notification Service Functions

#### `requestNotificationPermissions()`
Requests notification permissions from the user.

**Returns:** `Promise<boolean>` - true if granted

**Example:**
```typescript
const hasPermission = await requestNotificationPermissions();
if (hasPermission) {
  console.log('알림 권한이 허용되었습니다.');
}
```

#### `scheduleMedicationNotifications(medication)`
Schedules daily repeating notifications for a medication.

**Parameters:**
- `medication: Medication` - Medication object with reminder_times

**Returns:** `Promise<string[]>` - Array of notification IDs

**Example:**
```typescript
const notificationIds = await scheduleMedicationNotifications(medication);
// notificationIds = ['notif-uuid-1', 'notif-uuid-2']
```

#### `cancelMedicationNotifications(notificationIds)`
Cancels scheduled notifications.

**Parameters:**
- `notificationIds: string[]` - Array of notification IDs to cancel

**Returns:** `Promise<void>`

**Example:**
```typescript
await cancelMedicationNotifications(['notif-uuid-1', 'notif-uuid-2']);
```

#### `rescheduleMedicationNotifications(medication, oldNotificationIds)`
Cancels old notifications and schedules new ones.

**Parameters:**
- `medication: Medication` - Updated medication object
- `oldNotificationIds: string[]` - IDs of notifications to cancel

**Returns:** `Promise<string[]>` - Array of new notification IDs

**Example:**
```typescript
const newIds = await rescheduleMedicationNotifications(
  updatedMedication,
  ['old-id-1', 'old-id-2']
);
```

#### `sendTestNotification()`
Sends a test notification after 5 seconds (dev/debug only).

**Returns:** `Promise<void>`

**Example:**
```typescript
await sendTestNotification();
// Notification appears in 5 seconds
```

### API Service Functions

#### `createMedicationWithNotifications(medication)`
Creates medication and schedules notifications in one transaction.

**Returns:** `Promise<{ medication: Medication; notificationIds: string[] }>`

#### `updateMedicationWithNotifications(medicationId, updates)`
Updates medication and re-schedules notifications.

**Returns:** `Promise<{ medication: Medication; notificationIds: string[] }>`

#### `deleteMedicationWithNotifications(medicationId)`
Deletes medication and cancels all notifications.

**Returns:** `Promise<void>`

#### `scheduleAllMedicationNotifications()`
Schedules notifications for all active medications (app launch).

**Returns:** `Promise<void>`

## Testing

### Dev Mode Features

The parent HomeScreen includes developer tools visible only in `__DEV__` mode:

1. **Test Notification Button**
   - Sends a test notification after 5 seconds
   - Verifies notification delivery
   - Tests navigation flow

2. **Check Scheduled Notifications**
   - Shows count of currently scheduled notifications
   - Useful for debugging

### Manual Testing Checklist

- [ ] Permission request appears on first launch
- [ ] Permission denial shows warning banner
- [ ] Test notification appears after 5 seconds
- [ ] Notification tap opens FullScreenReminderScreen
- [ ] Notification appears when app is in foreground
- [ ] Notification appears when app is in background
- [ ] Notification appears when app is killed
- [ ] Multiple medications schedule multiple notifications
- [ ] Updating medication time re-schedules notifications
- [ ] Deleting medication cancels notifications
- [ ] Vibration works on notification
- [ ] Sound plays on notification

## Future Enhancements (Phase 2)

### Remote Push Notifications
- Push notifications to child app when parent misses medication
- Expo Push Notifications service integration
- Server-side notification triggers

### Notification Settings
- User preferences for sound/vibration
- Snooze functionality
- Custom reminder advance time (e.g., 5 min before)

### Analytics
- Track notification delivery rates
- Measure notification response times
- User engagement metrics

### Multi-Device Sync
- Sync notification schedules to Supabase
- Support multiple devices per user
- Device-specific notification management

## Troubleshooting

### Notifications Not Appearing

**Check permissions:**
```typescript
const notifications = await getAllScheduledNotifications();
console.log(`Scheduled: ${notifications.length}`);
```

**Common issues:**
1. Permission denied - Check Settings > PillCare > Notifications
2. No medications active - Check `medication.active = true`
3. Empty reminder_times - Check `medication.reminder_times.length > 0`
4. Android: Notification channel disabled

### Navigation Not Working

**Check:**
1. NavigationContainer has ref attached
2. Notification data includes all required fields
3. Parent navigator is mounted (user role = 'parent')

### Notifications Disappear After Reboot

**Solution:**
- Call `scheduleAllMedicationNotifications()` on app launch
- iOS/Android clear scheduled notifications on reboot
- Re-scheduling on app open ensures continuity

## Performance Considerations

### Memory
- Notification schedules stored in Map (in-memory)
- Future: Persist to AsyncStorage or Supabase
- Minimal memory footprint (<1KB per medication)

### Battery
- Daily triggers use native iOS/Android schedulers
- No background polling required
- Battery-efficient implementation

### Network
- Local notifications only (no network required)
- Phase 2 will add remote notifications for child app

## Security & Privacy

### Data in Notifications
- Only medication name and dosage shown
- No personal health information in notification body
- medicationId in data payload for internal use only

### Permissions
- Follows platform best practices
- Clear explanation of why permissions needed
- Graceful degradation if denied

## Code Quality

### TypeScript
- Full type safety with strict mode
- Comprehensive JSDoc comments (Korean)
- No `any` types used

### Error Handling
- Try-catch blocks on all async functions
- Graceful fallbacks (medication saves even if notification fails)
- Detailed console logging for debugging

### Code Style
- 2-space indentation
- Single quotes
- Async/await (no callbacks)
- Descriptive variable names

## Accessibility

### WCAG Compliance
- High contrast notifications
- Clear, large text
- Sound + vibration for multi-sensory alert
- Simple, elderly-friendly Korean language

### Platform Accessibility
- VoiceOver/TalkBack support
- Accessibility labels on all buttons
- Follows platform notification guidelines

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0 (MVP)
**Author:** Park Changsu
