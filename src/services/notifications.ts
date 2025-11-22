/**
 * 알림 서비스 (Notification Service)
 *
 * 로컬 푸시 알림을 관리하는 서비스입니다.
 * - 알림 권한 요청
 * - 약 복용 시간에 맞춰 알림 예약
 * - 알림 응답 처리 (사용자가 알림을 탭했을 때)
 * - 예약된 알림 취소/업데이트
 *
 * Features:
 * - Local notifications for medication reminders
 * - Elderly-friendly Korean messages
 * - Vibration and sound enabled
 * - Background and foreground handling
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../types/database.types';

/**
 * 알림 데이터 인터페이스
 * - 알림을 탭했을 때 전달되는 데이터
 */
export interface NotificationData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  type: 'medication_reminder';
}

/**
 * 알림 스케줄 정보
 */
export interface NotificationSchedule {
  medicationId: string;
  notificationIds: string[];
}

/**
 * 알림 동작 설정
 * - 앱이 foreground에 있을 때도 알림 표시
 * - 사운드, 배지, 진동 활성화
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 알림 권한 요청
 *
 * @returns 권한 허용 여부 (true: 허용됨, false: 거부됨)
 *
 * @description
 * - iOS: 알림, 사운드, 배지 권한 요청
 * - Android: 별도 권한 불필요 (기본 허용)
 *
 * @example
 * const hasPermission = await requestNotificationPermissions();
 * if (hasPermission) {
 *   console.log('알림 권한이 허용되었습니다.');
 * }
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // 권한이 아직 결정되지 않았으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('알림 권한이 거부되었습니다.');
      return false;
    }

    // Android: 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication', {
        name: '복약 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });
    }

    return true;
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return false;
  }
};

/**
 * 약 복용 알림 예약
 *
 * @param medication - 약 정보 (이름, 복용량, 알림 시간 포함)
 * @returns 예약된 알림 ID 배열
 *
 * @description
 * - medication.reminder_times에 설정된 시간마다 매일 반복 알림 예약
 * - 각 알림에는 약 정보(ID, 이름, 복용량, 예약 시간)가 포함됨
 * - 큰 텍스트, 진동, 사운드로 노인 친화적 알림
 *
 * @example
 * const medication = {
 *   id: '123',
 *   name: '혈압약',
 *   dosage: '1알',
 *   reminder_times: ['09:00', '21:00']
 * };
 * const notificationIds = await scheduleMedicationNotifications(medication);
 * // 09:00, 21:00에 매일 알림 예약됨
 */
export const scheduleMedicationNotifications = async (
  medication: Medication
): Promise<string[]> => {
  try {
    const notificationIds: string[] = [];

    // 각 복용 시간마다 알림 예약
    for (const timeString of medication.reminder_times) {
      const [hours, minutes] = timeString.split(':').map(Number);

      // 오늘 날짜 기준으로 시간 설정
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      // 이미 지난 시간이면 내일로 설정
      if (scheduledDate.getTime() < Date.now()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      // 알림 내용 구성
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 약 드실 시간입니다',
          body: `${medication.name} ${medication.dosage}을(를) 복용해주세요`,
          data: {
            medicationId: medication.id,
            medicationName: medication.name,
            dosage: medication.dosage,
            scheduledTime: scheduledDate.toISOString(),
            type: 'medication_reminder',
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          badge: 1,
        },
        trigger: {
          // 매일 같은 시간에 반복
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      notificationIds.push(notificationId);
      console.log(`알림 예약됨: ${medication.name} - ${timeString} (ID: ${notificationId})`);
    }

    return notificationIds;
  } catch (error) {
    console.error('약 알림 예약 실패:', error);
    throw error;
  }
};

/**
 * 특정 약의 모든 예약 알림 취소
 *
 * @param notificationIds - 취소할 알림 ID 배열
 *
 * @description
 * - 약이 삭제되거나 비활성화될 때 사용
 * - 여러 알림을 한 번에 취소
 *
 * @example
 * await cancelMedicationNotifications(['notif-1', 'notif-2']);
 */
export const cancelMedicationNotifications = async (notificationIds: string[]): Promise<void> => {
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log(`알림 취소됨: ${id}`);
    }
  } catch (error) {
    console.error('알림 취소 실패:', error);
    throw error;
  }
};

/**
 * 모든 예약된 알림 취소
 *
 * @description
 * - 사용자가 로그아웃하거나 앱을 초기화할 때 사용
 *
 * @example
 * await cancelAllNotifications();
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('모든 알림이 취소되었습니다.');
  } catch (error) {
    console.error('모든 알림 취소 실패:', error);
    throw error;
  }
};

/**
 * 예약된 모든 알림 조회
 *
 * @returns 예약된 알림 배열
 *
 * @description
 * - 디버깅 또는 알림 목록 표시용
 *
 * @example
 * const scheduledNotifications = await getAllScheduledNotifications();
 * console.log(`예약된 알림 개수: ${scheduledNotifications.length}`);
 */
export const getAllScheduledNotifications = async (): Promise<
  Notifications.NotificationRequest[]
> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`예약된 알림 개수: ${notifications.length}`);
    return notifications;
  } catch (error) {
    console.error('예약된 알림 조회 실패:', error);
    return [];
  }
};

/**
 * 약 정보 업데이트 시 알림 재예약
 *
 * @param medication - 업데이트된 약 정보
 * @param oldNotificationIds - 기존 알림 ID 배열 (취소용)
 * @returns 새로 예약된 알림 ID 배열
 *
 * @description
 * - 기존 알림을 취소하고 새로운 시간으로 다시 예약
 * - 약 이름, 복용량, 시간 변경 시 사용
 *
 * @example
 * const newIds = await rescheduleMedicationNotifications(
 *   updatedMedication,
 *   ['old-notif-1', 'old-notif-2']
 * );
 */
export const rescheduleMedicationNotifications = async (
  medication: Medication,
  oldNotificationIds: string[]
): Promise<string[]> => {
  try {
    // 기존 알림 취소
    await cancelMedicationNotifications(oldNotificationIds);

    // 새로운 알림 예약
    const newIds = await scheduleMedicationNotifications(medication);

    console.log(`알림 재예약 완료: ${medication.name} (${newIds.length}개 알림)`);
    return newIds;
  } catch (error) {
    console.error('알림 재예약 실패:', error);
    throw error;
  }
};

/**
 * 푸시 토큰 가져오기
 *
 * @returns Expo Push Token (서버 전송용)
 *
 * @description
 * - Expo Push Notification 서비스용 토큰
 * - 데이터베이스에 저장하여 원격 푸시 알림에 사용
 *
 * @example
 * const token = await getExpoPushToken();
 * if (token) {
 *   await savePushToken(token);
 * }
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get project ID from Constants (Expo SDK 54+)
    const Constants = require('expo-constants').default;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('Project ID not found. Push token may not work in production.');
      // For development, return null gracefully
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Expo Push Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Push Token 가져오기 실패:', error);
    return null;
  }
};

/**
 * 자녀에게 미복용 알림 전송 (MVP: 로컬 시뮬레이션)
 *
 * @param parentName - 부모님 이름
 * @param medicationName - 약 이름
 * @param eventId - 이벤트 ID (missed_medication_events 테이블)
 *
 * @description
 * MVP에서는 실제 원격 푸시 알림을 보낼 수 없습니다 (백엔드 서버 필요).
 * 대신:
 * 1. missed_medication_events 테이블에 이벤트 저장
 * 2. 자녀 앱에서 실시간 구독 또는 폴링으로 확인
 * 3. 자녀 앱이 포그라운드에 있으면 로컬 알림 표시
 *
 * 프로덕션에서는 Supabase Edge Functions 또는 백엔드 서버를 통해
 * Expo Push API를 호출하여 실제 푸시 알림을 전송해야 합니다.
 *
 * @example
 * await sendMissedMedicationNotificationToChild({
 *   parentName: '어머니',
 *   medicationName: '혈압약',
 *   eventId: 'event-uuid'
 * });
 */
export const sendMissedMedicationNotificationToChild = async ({
  parentId,
  parentName,
  medicationName,
  scheduledTime,
  eventId,
}: {
  parentId: string;
  parentName: string;
  medicationName: string;
  scheduledTime: string;
  eventId: string;
}): Promise<void> => {
  try {
    // MVP: 로컬 알림으로 시뮬레이션 (자녀 앱이 포그라운드에 있을 때)
    // 실제 원격 푸시는 Supabase Edge Function으로 구현 필요
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '부모님 복약 알림',
        body: `${parentName}님이 ${medicationName}을(를) 놓치셨어요`,
        data: {
          type: 'missed_medication',
          parentId,
          parentName,
          medicationName,
          scheduledTime,
          eventId,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // 즉시 전송
    });

    console.log(`미복용 알림 전송 (로컬): ${parentName} - ${medicationName}`);
  } catch (error) {
    console.error('미복용 알림 전송 실패:', error);
    // 에러가 발생해도 앱이 중단되지 않도록 함
  }
};

/**
 * 알림 응답 리스너 등록
 *
 * @param callback - 알림을 탭했을 때 실행할 함수
 * @returns 리스너 구독 객체 (cleanup용)
 *
 * @description
 * - 사용자가 알림을 탭하면 FullScreenReminderScreen으로 이동
 * - App.tsx에서 사용
 *
 * @example
 * const subscription = registerNotificationResponseListener((response) => {
 *   const { medicationId, scheduledTime } = response.notification.request.content.data;
 *   navigation.navigate('FullScreenReminder', { medicationId, scheduledTime });
 * });
 *
 * // Cleanup
 * return () => subscription.remove();
 */
export const registerNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Foreground 알림 리스너 등록
 *
 * @param callback - 앱이 열려있을 때 알림이 오면 실행할 함수
 * @returns 리스너 구독 객체 (cleanup용)
 *
 * @description
 * - 앱이 foreground에 있을 때도 알림 처리
 * - 자동으로 FullScreenReminderScreen으로 이동하거나 인앱 알림 표시
 *
 * @example
 * const subscription = registerForegroundNotificationListener((notification) => {
 *   console.log('Foreground 알림 수신:', notification);
 *   // 자동으로 화면 전환하거나 인앱 알림 표시
 * });
 *
 * // Cleanup
 * return () => subscription.remove();
 */
export const registerForegroundNotificationListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * 즉시 테스트 알림 전송 (개발/디버깅용)
 *
 * @description
 * - 알림이 제대로 작동하는지 테스트
 * - 5초 후에 알림 표시
 *
 * @example
 * await sendTestNotification();
 */
export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 테스트 알림',
        body: '알림이 정상적으로 작동합니다!',
        data: {
          medicationId: 'test-123',
          medicationName: '테스트 약',
          dosage: '1알',
          scheduledTime: new Date().toISOString(),
          type: 'medication_reminder',
        },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5, // 5초 후 알림
      },
    });

    console.log('테스트 알림이 5초 후 전송됩니다.');
  } catch (error) {
    console.error('테스트 알림 전송 실패:', error);
    throw error;
  }
};
