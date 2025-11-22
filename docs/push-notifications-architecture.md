# Push Notifications Architecture for Child App

## Overview

This document describes the architecture for sending push notifications to children when their parents miss medications in the PillCare app.

## Current Implementation (MVP)

### Architecture Diagram

```
+-------------------+     +------------------+     +-------------------+
|   Parent App      |     |    Supabase      |     |    Child App      |
|                   |     |                  |     |                   |
| 1. Parent skips   |---->| 2. Save event to |---->| 3. Realtime       |
|    medication     |     |    missed_       |     |    subscription   |
|                   |     |    medication_   |     |    receives event |
|                   |     |    events table  |     |                   |
|                   |     |                  |     | 4. Show local     |
|                   |     |                  |     |    notification   |
+-------------------+     +------------------+     +-------------------+
```

### MVP Approach

Since we cannot send actual push notifications without a backend server (Expo Push requires server-side API calls), the MVP uses:

1. **Database Events**: When parent skips medication, an event is saved to `missed_medication_events` table
2. **Supabase Realtime**: Child app subscribes to events for connected parents
3. **Local Notifications**: When event is received, child app shows a local notification (if app is running)

### Limitations

- Push notifications only work when child app is running (foreground/background)
- No notifications when app is completely closed
- Requires Supabase Realtime subscription to be active

## Database Schema

### New Tables

```sql
-- missed_medication_events
CREATE TABLE missed_medication_events (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES users(id),
  medication_id UUID REFERENCES medications(id),
  medication_name TEXT,
  scheduled_time TIMESTAMPTZ,
  skip_reason TEXT,
  notified BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- notification_preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  missed_medication_alert BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### User Table Updates

```sql
ALTER TABLE users ADD COLUMN push_token TEXT;
ALTER TABLE users ADD COLUMN push_token_updated_at TIMESTAMPTZ;
```

## Code Components

### Services

**`src/services/notifications.ts`**
- `getExpoPushToken()` - Get Expo push token
- `sendMissedMedicationNotificationToChild()` - Send local notification

**`src/services/api.ts`**
- `savePushToken()` - Save push token to database
- `getChildrenPushTokens()` - Get tokens for connected children
- `createMissedMedicationEvent()` - Create event when medication missed
- `getUnreadMissedEvents()` - Get unread events for child
- `markMissedEventAsRead()` - Mark event as read
- `subscribeMissedMedicationEvents()` - Realtime subscription
- `getNotificationPreferences()` - Get user preferences
- `updateNotificationPreferences()` - Update user preferences

### Hooks

**`src/hooks/usePushToken.ts`**
- Manages push token initialization
- Saves token to database on app start

**`src/hooks/useMissedMedicationSubscription.ts`**
- Subscribes to missed medication events
- Shows local notifications when events arrive
- Manages read/unread state

### Screens

**`src/screens/parent/SkipReasonScreen.tsx`**
- Creates `missed_medication_events` entry when parent skips medication

**`src/screens/child/SettingsScreen.tsx`**
- Toggle for push notifications (enabled/disabled)
- Toggle for missed medication alerts
- Saves preferences to database

## Future Implementation (Production)

### Recommended Architecture

```
+-------------------+     +------------------+     +-------------------+
|   Parent App      |     |  Supabase Edge   |     |    Child App      |
|                   |     |    Function      |     |                   |
| 1. Parent skips   |---->| 2. Database      |---->| 4. Receive push   |
|    medication     |     |    trigger       |     |    notification   |
|                   |     |                  |     |                   |
|                   |     | 3. Call Expo     |     |                   |
|                   |     |    Push API      |     |                   |
+-------------------+     +------------------+     +-------------------+
```

### Supabase Edge Function

Create `supabase/functions/send-push-notification/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { parentId, medicationName, scheduledTime } = await req.json()

  // Get children's push tokens from database
  const { data: children } = await supabase
    .rpc('get_children_push_tokens', { parent_user_id: parentId })

  // Get parent name
  const { data: parent } = await supabase
    .from('users')
    .select('name')
    .eq('id', parentId)
    .single()

  // Send to Expo Push API
  const messages = children
    .filter(c => c.push_token && c.missed_alert_enabled)
    .map(child => ({
      to: child.push_token,
      title: '부모님 복약 알림',
      body: `${parent.name}님이 ${medicationName}을(를) 놓치셨어요`,
      data: {
        type: 'missed_medication',
        parentId,
        medicationName,
        scheduledTime,
      },
    }))

  if (messages.length > 0) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Database Trigger

```sql
CREATE OR REPLACE FUNCTION notify_children_on_missed_medication()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ..."}',
    body := json_build_object(
      'parentId', NEW.parent_id,
      'medicationName', NEW.medication_name,
      'scheduledTime', NEW.scheduled_time
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_children
  AFTER INSERT ON missed_medication_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_children_on_missed_medication();
```

### Expo Push Token Format

Expo push tokens look like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

Requirements:
- Physical device (not simulator)
- EAS project configured in `app.json`
- Notification permissions granted

## Notification Content

### Korean Localization

**Title**: "부모님 복약 알림"
**Body**: "{부모님 이름}님이 {약 이름}을(를) 놓치셨어요"

**Data payload**:
```json
{
  "type": "missed_medication",
  "parentId": "uuid",
  "parentName": "어머니",
  "medicationName": "혈압약",
  "scheduledTime": "2024-01-15T09:00:00Z",
  "eventId": "uuid"
}
```

## Testing

### MVP Testing

1. Open child app and connect to parent
2. Keep child app in foreground
3. On parent app, skip medication
4. Child app should show local notification

### Physical Device Testing

Push tokens only work on physical devices. For testing:
1. Install on physical device via EAS Build
2. Check console for push token
3. Verify token is saved in database

### Test Notification Function

```typescript
// In development, test with:
await sendMissedMedicationNotificationToChild({
  parentId: 'test-parent-id',
  parentName: '테스트 부모님',
  medicationName: '테스트 약',
  scheduledTime: new Date().toISOString(),
  eventId: 'test-event-id',
});
```

## Security Considerations

### RLS Policies

- Parents can only create events for themselves
- Children can only see events from connected parents
- Children can only mark their connected parents' events as read
- Push tokens are stored securely in users table

### Token Security

- Push tokens are device-specific
- Tokens should be refreshed periodically
- Old tokens should be cleaned up

## Performance Considerations

### Realtime Subscriptions

- One subscription per connected parent
- Subscription is cleaned up when component unmounts
- Consider connection pooling for multiple parents

### Database Indexes

```sql
CREATE INDEX idx_missed_events_parent_id ON missed_medication_events(parent_id);
CREATE INDEX idx_missed_events_created_at ON missed_medication_events(created_at DESC);
CREATE INDEX idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;
```

## Migration Path

### Phase 1 (Current MVP)
- Database events + Realtime subscriptions
- Local notifications when app is running
- Notification preferences in database

### Phase 2 (Production)
1. Set up EAS project ID in `app.json`
2. Create Supabase Edge Function
3. Add database trigger
4. Test with physical devices
5. Remove local notification fallback

### Phase 3 (Enhancements)
- Daily summary notifications
- Notification batching (avoid spam)
- Notification history UI
- Deep linking to specific events

## Troubleshooting

### Push Token Issues

```
Error: Push token not available
```
- Ensure running on physical device
- Check EAS project configuration
- Verify notification permissions

### Realtime Subscription Issues

```
Error: Subscription not receiving events
```
- Check RLS policies
- Verify parent-child connection is active
- Check Supabase Realtime is enabled

### Notification Not Showing

- Check notification preferences (push_enabled, missed_medication_alert)
- Verify app has notification permission
- Check device notification settings

---

**Last Updated**: 2024-11-22
**Version**: 1.0.0 (MVP)
**Author**: Park Changsu
