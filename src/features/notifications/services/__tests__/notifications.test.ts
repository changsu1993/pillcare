/**
 * Notifications Service Tests
 *
 * Tests for medication reminder notifications and push notification handling.
 */

import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  cancelAllNotifications,
  getAllScheduledNotifications,
  rescheduleMedicationNotifications,
  getExpoPushToken,
  sendMissedMedicationNotificationToChild,
  registerNotificationResponseListener,
  registerForegroundNotificationListener,
  sendTestNotification,
} from '../notifications';

// Local mock factory to avoid test-utils import issues
const createMockMedication = (overrides = {}) => ({
  id: 'medication-1',
  user_id: 'test-user-id',
  name: 'Test Medication',
  dosage: '1 tablet',
  frequency: 'daily',
  reminder_times: ['09:00', '21:00'],
  start_date: new Date().toISOString().split('T')[0],
  end_date: undefined,
  notes: 'Take with food',
  active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

// expo-notifications is mocked in setup.ts

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

// Create a mock for Platform that can be modified
let mockPlatformOS = 'ios';
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    select: jest.fn((obj: any) => obj.ios || obj.default),
  },
}));

describe('Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = 'ios';
  });

  describe('requestNotificationPermissions', () => {
    it('should return true when permission is already granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permission when not granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
        expires: 'never',
        granted: false,
        canAskAgain: true,
      } as any);
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false when permission is denied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
        expires: 'never',
        granted: false,
        canAskAgain: true,
      } as any);
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
        expires: 'never',
        granted: false,
        canAskAgain: false,
      } as any);

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });

    it('should setup Android notification channel on Android', async () => {
      mockPlatformOS = 'android';
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);

      await requestNotificationPermissions();

      expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'medication',
        expect.objectContaining({
          name: expect.any(String),
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: expect.any(Array),
          sound: 'default',
          enableVibrate: true,
        })
      );
    });

    it('should not setup channel on iOS', async () => {
      mockPlatformOS = 'ios';
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);

      await requestNotificationPermissions();

      expect(mockNotifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });

    it('should handle permission request error gracefully', async () => {
      mockNotifications.getPermissionsAsync.mockRejectedValue(new Error('Permission error'));

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe('scheduleMedicationNotifications', () => {
    it('should schedule notifications for each reminder time', async () => {
      const medication = createMockMedication({
        reminder_times: ['09:00', '21:00'],
      });

      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id');

      const result = await scheduleMedicationNotifications(medication);

      expect(result).toHaveLength(2);
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    });

    it('should include medication data in notification content', async () => {
      const medication = createMockMedication({
        id: 'med-123',
        name: 'Aspirin',
        dosage: '100mg',
        reminder_times: ['09:00'],
      });

      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id');

      await scheduleMedicationNotifications(medication);

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: expect.objectContaining({
              medicationId: 'med-123',
              medicationName: 'Aspirin',
              dosage: '100mg',
              type: 'medication_reminder',
            }),
          }),
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 9,
            minute: 0,
          }),
        })
      );
    });

    it('should schedule daily repeating notifications', async () => {
      const medication = createMockMedication({
        reminder_times: ['14:30'],
      });

      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id');

      await scheduleMedicationNotifications(medication);

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 14,
            minute: 30,
          }),
        })
      );
    });

    it('should throw error when scheduling fails', async () => {
      const medication = createMockMedication({
        reminder_times: ['09:00'],
      });

      mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('Scheduling failed'));

      await expect(scheduleMedicationNotifications(medication)).rejects.toThrow(
        'Scheduling failed'
      );
    });

    it('should handle empty reminder times', async () => {
      const medication = createMockMedication({
        reminder_times: [],
      });

      const result = await scheduleMedicationNotifications(medication);

      expect(result).toHaveLength(0);
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelMedicationNotifications', () => {
    it('should cancel all specified notification IDs', async () => {
      const notificationIds = ['notif-1', 'notif-2', 'notif-3'];

      await cancelMedicationNotifications(notificationIds);

      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-2');
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-3');
    });

    it('should handle empty notification ID array', async () => {
      await cancelMedicationNotifications([]);

      expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('should throw error when cancellation fails', async () => {
      mockNotifications.cancelScheduledNotificationAsync.mockRejectedValue(
        new Error('Cancel failed')
      );

      await expect(cancelMedicationNotifications(['notif-1'])).rejects.toThrow('Cancel failed');
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all scheduled notifications', async () => {
      await cancelAllNotifications();

      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    it('should throw error on failure', async () => {
      mockNotifications.cancelAllScheduledNotificationsAsync.mockRejectedValue(
        new Error('Cancel all failed')
      );

      await expect(cancelAllNotifications()).rejects.toThrow('Cancel all failed');
    });
  });

  describe('getAllScheduledNotifications', () => {
    it('should return list of scheduled notifications', async () => {
      const mockScheduled = [
        { identifier: 'notif-1', content: {}, trigger: {} },
        { identifier: 'notif-2', content: {}, trigger: {} },
      ];

      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockScheduled as any);

      const result = await getAllScheduledNotifications();

      expect(result).toEqual(mockScheduled);
    });

    it('should return empty array on error', async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockRejectedValue(
        new Error('Fetch failed')
      );

      const result = await getAllScheduledNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('rescheduleMedicationNotifications', () => {
    it('should cancel old notifications and schedule new ones', async () => {
      const medication = createMockMedication({
        reminder_times: ['10:00', '22:00'],
      });
      const oldNotificationIds = ['old-1', 'old-2'];

      // Reset mocks for this specific test
      mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('new-notification-id');

      const result = await rescheduleMedicationNotifications(medication, oldNotificationIds);

      // Should cancel old notifications
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-1');
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-2');

      // Should schedule new notifications
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should throw error on failure', async () => {
      const medication = createMockMedication();
      const oldNotificationIds = ['old-1'];

      mockNotifications.cancelScheduledNotificationAsync.mockRejectedValue(
        new Error('Reschedule failed')
      );

      await expect(
        rescheduleMedicationNotifications(medication, oldNotificationIds)
      ).rejects.toThrow('Reschedule failed');
    });
  });

  describe('getExpoPushToken', () => {
    it('should return push token when permission granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[xxxxx]',
        type: 'expo',
      });

      const result = await getExpoPushToken();

      expect(result).toBe('ExponentPushToken[xxxxx]');
    });

    it('should return null when permission denied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined',
        expires: 'never',
        granted: false,
        canAskAgain: true,
      } as any);
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
        expires: 'never',
        granted: false,
        canAskAgain: false,
      } as any);

      const result = await getExpoPushToken();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('Token error'));

      const result = await getExpoPushToken();

      expect(result).toBeNull();
    });
  });

  describe('sendMissedMedicationNotificationToChild', () => {
    it('should schedule immediate notification', async () => {
      await sendMissedMedicationNotificationToChild({
        parentId: 'parent-123',
        parentName: 'Mom',
        medicationName: 'Blood Pressure',
        scheduledTime: '09:00',
        eventId: 'event-123',
      });

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: expect.objectContaining({
              type: 'missed_medication',
              parentId: 'parent-123',
              parentName: 'Mom',
              medicationName: 'Blood Pressure',
            }),
          }),
          trigger: null, // Immediate delivery
        })
      );
    });

    it('should not throw on scheduling error (non-critical)', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(
        new Error('Notification failed')
      );

      // Should not throw
      await expect(
        sendMissedMedicationNotificationToChild({
          parentId: 'parent-123',
          parentName: 'Mom',
          medicationName: 'Blood Pressure',
          scheduledTime: '09:00',
          eventId: 'event-123',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('registerNotificationResponseListener', () => {
    it('should register response listener', () => {
      const callback = jest.fn();

      const subscription = registerNotificationResponseListener(callback);

      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        callback
      );
      expect(subscription).toHaveProperty('remove');
    });
  });

  describe('registerForegroundNotificationListener', () => {
    it('should register foreground notification listener', () => {
      const callback = jest.fn();

      const subscription = registerForegroundNotificationListener(callback);

      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalledWith(callback);
      expect(subscription).toHaveProperty('remove');
    });
  });

  describe('sendTestNotification', () => {
    it('should schedule test notification with 5 second delay', async () => {
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('test-notif-id');

      await sendTestNotification();

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: expect.objectContaining({
              type: 'medication_reminder',
            }),
          }),
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
          }),
        })
      );
    });

    it('should throw error on failure', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('Test failed'));

      await expect(sendTestNotification()).rejects.toThrow('Test failed');
    });
  });
});

describe('Notification Content Format', () => {
  it('should use elderly-friendly Korean notification text', async () => {
    const medication = createMockMedication({
      name: 'Aspirin',
      dosage: '100mg',
      reminder_times: ['09:00'],
    });

    mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id');

    await scheduleMedicationNotifications(medication);

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringMatching(/drug|약/), // Contains medication emoji or Korean word
          body: expect.stringContaining('Aspirin'),
        }),
      })
    );
  });
});
