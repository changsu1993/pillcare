/**
 * API Service
 *
 * Helper functions for interacting with Supabase database.
 * All functions handle errors and return structured responses.
 */

import { supabase } from './supabase';
import {
  User,
  Medication,
  MedicationLog,
  FamilyConnection,
  Appointment,
  ScheduledMedication,
  MedicationAdherence,
  TimeSlotPattern,
  WeeklyTrend,
  TimeSlot,
  TrendDirection,
} from '../types/database.types';
import {
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  rescheduleMedicationNotifications,
} from '../../features/notifications/services/notifications';

/**
 * =====================================
 * MEDICATIONS API
 * =====================================
 */

/**
 * Get all active medications for current user
 */
export const getMedications = async (): Promise<Medication[]> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single medication by ID
 */
export const getMedication = async (medicationId: string): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', medicationId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new medication
 */
export const createMedication = async (
  medication: Omit<Medication, 'id' | 'created_at'>
): Promise<Medication> => {
  const { data, error } = await supabase.from('medications').insert([medication]).select().single();

  if (error) throw error;
  return data;
};

/**
 * Update a medication
 */
export const updateMedication = async (
  medicationId: string,
  updates: Partial<Medication>
): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', medicationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a medication (soft delete - sets active = false)
 */
export const deleteMedication = async (medicationId: string): Promise<void> => {
  const { error } = await supabase
    .from('medications')
    .update({ active: false })
    .eq('id', medicationId);

  if (error) throw error;
};

/**
 * =====================================
 * MEDICATION LOGS API
 * =====================================
 */

/**
 * Get medication logs for a specific date range
 */
export const getMedicationLogs = async (
  medicationId: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<MedicationLog[]> => {
  let query = supabase
    .from('medication_logs')
    .select('*, medications(name, dosage)')
    .order('scheduled_at', { ascending: false });

  if (medicationId) {
    query = query.eq('medication_id', medicationId);
  }

  if (startDate) {
    query = query.gte('scheduled_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('scheduled_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Get today's medication logs
 */
export const getTodayLogs = async (): Promise<MedicationLog[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getMedicationLogs(null, today, tomorrow);
};

/**
 * Get today's scheduled medications
 *
 * This function:
 * 1. Gets all active medications for the user
 * 2. Generates today's scheduled times from reminder_times
 * 3. Checks medication_logs for taken/missed status
 * 4. Returns a combined list for display
 */
export const getTodayScheduledMedications = async (): Promise<ScheduledMedication[]> => {
  // Get all active medications
  const medications = await getMedications();

  if (medications.length === 0) {
    return [];
  }

  // Get today's date boundaries
  const today = new Date();

  // Get existing logs for today
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const existingLogs = await getMedicationLogs(null, todayStart, todayEnd);

  // Create a map of existing logs by medication_id and scheduled_at
  const logsMap = new Map<string, MedicationLog>();
  existingLogs.forEach((log) => {
    const key = `${log.medication_id}-${log.scheduled_at}`;
    logsMap.set(key, log);
  });

  // Generate scheduled medications for today
  const scheduledMedications: ScheduledMedication[] = [];

  for (const med of medications) {
    // Check if medication is active for today
    const startDate = new Date(med.start_date);
    const endDate = med.end_date ? new Date(med.end_date) : null;

    // Skip if today is before start date or after end date
    if (today < startDate) continue;
    if (endDate && today > endDate) continue;

    // Generate scheduled times for today
    for (const time of med.reminder_times) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledAt = new Date(today);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const scheduledAtStr = scheduledAt.toISOString();
      const logKey = `${med.id}-${scheduledAtStr}`;
      const existingLog = logsMap.get(logKey);

      scheduledMedications.push({
        id: `${med.id}-${time}`,
        medication_id: med.id,
        medication_name: med.name,
        dosage: med.dosage,
        scheduled_time: time,
        scheduled_at: scheduledAtStr,
        taken: existingLog?.taken ?? false,
        taken_at: existingLog?.taken_at,
        skipped_reason: existingLog?.skipped_reason,
        notes: med.notes,
      });
    }
  }

  // Sort by scheduled time
  scheduledMedications.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

  return scheduledMedications;
};

/**
 * Log a medication as taken
 */
export const logMedicationTaken = async (
  medicationId: string,
  scheduledAt: Date,
  takenAt: Date = new Date()
): Promise<MedicationLog> => {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      {
        medication_id: medicationId,
        scheduled_at: scheduledAt.toISOString(),
        taken: true,
        taken_at: takenAt.toISOString(),
      },
      {
        onConflict: 'medication_id,scheduled_at',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Log a medication as missed/skipped
 */
export const logMedicationMissed = async (
  medicationId: string,
  scheduledAt: Date,
  reason: string | null = null
): Promise<MedicationLog> => {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      {
        medication_id: medicationId,
        scheduled_at: scheduledAt.toISOString(),
        taken: false,
        skipped_reason: reason,
      },
      {
        onConflict: 'medication_id,scheduled_at',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * =====================================
 * FAMILY CONNECTIONS API
 * =====================================
 */

/**
 * Get all family connections for current user
 * Returns connections where user is either parent or child
 */
export const getFamilyConnections = async (): Promise<FamilyConnection[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      *,
      parent:parent_id(id, name, email, phone_number),
      child:child_id(id, name, email, phone_number)
    `
    )
    .eq('status', 'active')
    .or(`parent_id.eq.${user.id},child_id.eq.${user.id}`);

  if (error) throw error;
  return data || [];
};

/**
 * Check if current user has any active family connections
 */
export const hasActiveConnection = async (): Promise<boolean> => {
  const connections = await getFamilyConnections();
  return connections.length > 0;
};

/**
 * Generate invitation code (Parent creates code for children to enter)
 * @returns Generated 6-digit invitation code
 */
export const generateInvitationCode = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if there's already a pending invitation
  const { data: existingInvitation } = await supabase
    .from('family_connections')
    .select('invitation_code, invitation_expires_at')
    .eq('parent_id', user.id)
    .eq('status', 'pending')
    .gt('invitation_expires_at', new Date().toISOString())
    .single();

  // If valid invitation exists, return existing code
  if (existingInvitation?.invitation_code) {
    return existingInvitation.invitation_code;
  }

  // Generate new 6-digit code
  const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure code is unique
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('family_connections')
      .select('id')
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .single();

    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique code');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

  const { error } = await supabase.from('family_connections').insert({
    parent_id: user.id,
    child_id: null, // Will be filled when child enters code
    invitation_code: code,
    invitation_expires_at: expiresAt.toISOString(),
    status: 'pending',
  });

  if (error) throw error;
  return code;
};

/**
 * Connect with invitation code (Child enters code from parent)
 * @param code 6-digit invitation code
 * @returns Connection result with parent name if successful
 */
export const connectWithCode = async (
  code: string
): Promise<{
  success: boolean;
  parentName?: string;
  error?: string;
}> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Find pending invitation by code
  const { data: invitation, error: findError } = await supabase
    .from('family_connections')
    .select(
      `
      *,
      parent:parent_id(id, name, email)
    `
    )
    .eq('invitation_code', code.trim())
    .eq('status', 'pending')
    .gt('invitation_expires_at', new Date().toISOString())
    .single();

  if (findError || !invitation) {
    return {
      success: false,
      error: 'Invalid or expired invitation code',
    };
  }

  // Check if already connected to this parent
  const { data: existingConnection } = await supabase
    .from('family_connections')
    .select('id')
    .eq('parent_id', invitation.parent_id)
    .eq('child_id', user.id)
    .eq('status', 'active')
    .single();

  if (existingConnection) {
    return {
      success: false,
      error: 'Already connected to this parent',
    };
  }

  // Update invitation with child ID and activate
  const { error: updateError } = await supabase
    .from('family_connections')
    .update({
      child_id: user.id,
      status: 'active',
      invitation_code: null, // Clear code after use
    })
    .eq('id', invitation.id);

  if (updateError) {
    return { success: false, error: 'Failed to connect' };
  }

  // Extract parent name from joined data
  const parent = invitation.parent as unknown as User | null;
  const parentName = parent?.name || 'Unknown';

  return {
    success: true,
    parentName,
  };
};

/**
 * Remove a family connection
 */
export const removeFamilyConnection = async (connectionId: string): Promise<void> => {
  const { error } = await supabase
    .from('family_connections')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId);

  if (error) throw error;
};

/**
 * Get connected children for parent user
 */
export const getConnectedChildren = async (): Promise<User[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      child:child_id(id, name, email, phone_number, role, created_at, updated_at)
    `
    )
    .eq('parent_id', user.id)
    .eq('status', 'active');

  if (error) throw error;

  // Extract child users from result
  const children: User[] = [];
  data?.forEach((item) => {
    const child = item.child;
    if (child) {
      if (Array.isArray(child)) {
        children.push(...(child as User[]));
      } else {
        children.push(child as unknown as User);
      }
    }
  });

  return children;
};

/**
 * =====================================
 * USER API
 * =====================================
 */

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

  if (error) throw error;
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * =====================================
 * NOTIFICATION SCHEDULING API
 * =====================================
 */

// 로컬 스토리지에 알림 스케줄 저장 (AsyncStorage 사용)
// TODO: 향후 Supabase에 저장하여 여러 기기 간 동기화
const notificationSchedules: Map<string, string[]> = new Map();

/**
 * 약 생성 시 알림 자동 예약
 */
export const createMedicationWithNotifications = async (
  medication: Omit<Medication, 'id' | 'created_at'>
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // 1. 약 정보 저장
  const savedMedication = await createMedication(medication);

  // 2. 알림 예약
  try {
    const notificationIds = await scheduleMedicationNotifications(savedMedication);
    notificationSchedules.set(savedMedication.id, notificationIds);

    console.log(
      `약 생성 및 알림 예약 완료: ${savedMedication.name} (${notificationIds.length}개 알림)`
    );

    return { medication: savedMedication, notificationIds };
  } catch (error) {
    console.error('알림 예약 실패:', error);
    // 알림 예약 실패해도 약은 저장됨
    return { medication: savedMedication, notificationIds: [] };
  }
};

/**
 * 약 업데이트 시 알림 재예약
 */
export const updateMedicationWithNotifications = async (
  medicationId: string,
  updates: Partial<Medication>
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // 1. 약 정보 업데이트
  const updatedMedication = await updateMedication(medicationId, updates);

  // 2. 기존 알림 취소 후 재예약
  try {
    const oldNotificationIds = notificationSchedules.get(medicationId) || [];
    const newNotificationIds = await rescheduleMedicationNotifications(
      updatedMedication,
      oldNotificationIds
    );
    notificationSchedules.set(medicationId, newNotificationIds);

    console.log(
      `약 업데이트 및 알림 재예약 완료: ${updatedMedication.name} (${newNotificationIds.length}개 알림)`
    );

    return { medication: updatedMedication, notificationIds: newNotificationIds };
  } catch (error) {
    console.error('알림 재예약 실패:', error);
    return { medication: updatedMedication, notificationIds: [] };
  }
};

/**
 * 약 삭제 시 알림 자동 취소
 */
export const deleteMedicationWithNotifications = async (medicationId: string): Promise<void> => {
  // 1. 알림 취소
  try {
    const notificationIds = notificationSchedules.get(medicationId) || [];
    if (notificationIds.length > 0) {
      await cancelMedicationNotifications(notificationIds);
      notificationSchedules.delete(medicationId);
      console.log(`약 삭제 및 알림 취소 완료: ${medicationId}`);
    }
  } catch (error) {
    console.error('알림 취소 실패:', error);
  }

  // 2. 약 삭제 (soft delete)
  await deleteMedication(medicationId);
};

/**
 * 약 등록 폼 데이터 타입
 * - AddMedicationScreen에서 사용
 */
export interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
  reminder_times: string[]; // ["09:00", "14:00", "21:00"]
  start_date: string; // "YYYY-MM-DD"
  end_date?: string; // "YYYY-MM-DD"
  notes?: string;
}

/**
 * 약 등록 폼에서 약 생성
 *
 * @param formData - 폼에서 입력받은 약 정보
 * @returns 생성된 약 정보 및 알림 ID 배열
 *
 * @description
 * - 폼 데이터를 Medication 타입으로 변환
 * - 데이터베이스에 저장
 * - 알림 자동 예약
 *
 * @example
 * const result = await createMedicationFromForm({
 *   name: '혈압약',
 *   dosage: '1정',
 *   frequency: 'daily_2',
 *   reminder_times: ['09:00', '21:00'],
 *   start_date: '2024-01-01',
 *   notes: '식후 30분'
 * });
 */
export const createMedicationFromForm = async (
  formData: MedicationFormData
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // 현재 사용자 ID 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  // 폼 데이터를 Medication 타입으로 변환
  const medicationData: Omit<Medication, 'id' | 'created_at'> = {
    user_id: user.id,
    name: formData.name.trim(),
    dosage: formData.dosage.trim(),
    frequency: formData.frequency,
    reminder_times: formData.reminder_times,
    start_date: formData.start_date,
    end_date: formData.end_date || undefined,
    notes: formData.notes?.trim() || undefined,
    active: true,
  };

  // 약 생성 및 알림 예약
  return createMedicationWithNotifications(medicationData);
};

/**
 * 자녀가 부모님 약을 등록 (parentId 지정)
 *
 * @example
 * const result = await createMedicationForParent('parent-uuid', {
 *   name: '혈압약',
 *   dosage: '1정',
 *   frequency: 'daily_2',
 *   reminder_times: ['09:00', '21:00'],
 *   start_date: '2024-01-01',
 * });
 */
export const createMedicationForParent = async (
  parentId: string,
  formData: MedicationFormData
): Promise<{ medication: Medication; notificationIds: string[] }> => {
  // 폼 데이터를 Medication 타입으로 변환
  const medicationData: Omit<Medication, 'id' | 'created_at'> = {
    user_id: parentId,
    name: formData.name.trim(),
    dosage: formData.dosage.trim(),
    frequency: formData.frequency,
    reminder_times: formData.reminder_times,
    start_date: formData.start_date,
    end_date: formData.end_date || undefined,
    notes: formData.notes?.trim() || undefined,
    active: true,
  };

  // 약 생성 및 알림 예약
  return createMedicationWithNotifications(medicationData);
};

/**
 * 모든 활성 약에 대해 알림 일괄 예약
 * (앱 재시작 시 또는 권한 허용 직후 사용)
 */
export const scheduleAllMedicationNotifications = async (): Promise<void> => {
  try {
    const medications = await getMedications();

    for (const medication of medications) {
      if (medication.active && medication.reminder_times.length > 0) {
        const notificationIds = await scheduleMedicationNotifications(medication);
        notificationSchedules.set(medication.id, notificationIds);
      }
    }

    console.log(`총 ${medications.length}개 약의 알림이 예약되었습니다.`);
  } catch (error) {
    console.error('일괄 알림 예약 실패:', error);
    throw error;
  }
};

/**
 * =====================================
 * CHILD APP API (자녀용 API)
 * =====================================
 */

/**
 * Get connected parent's info for child user
 * @returns Parent user info or null if not connected
 */
export const getConnectedParent = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      parent:parent_id(id, name, email, phone_number, role, created_at, updated_at)
    `
    )
    .eq('child_id', user.id)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw error;
  }

  // Supabase 관계형 쿼리 결과 처리
  const parent = data?.parent;
  if (!parent) return null;

  // 배열인 경우 첫 번째 요소 반환
  if (Array.isArray(parent)) {
    return (parent[0] as User) || null;
  }

  return parent as unknown as User;
};

/**
 * Get parent's medications (for child view)
 * @param parentId - Parent user ID
 * @returns List of parent's active medications
 */
export const getParentMedications = async (parentId: string): Promise<Medication[]> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', parentId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get parent's medication logs for a date range
 * @param parentId - Parent user ID
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns List of medication logs with medication info
 */
export const getParentMedicationLogs = async (
  parentId: string,
  startDate: string,
  endDate: string
): Promise<MedicationLog[]> => {
  // First get all medication IDs for the parent
  const { data: medications, error: medError } = await supabase
    .from('medications')
    .select('id')
    .eq('user_id', parentId);

  if (medError) throw medError;
  if (!medications || medications.length === 0) return [];

  const medicationIds = medications.map((m) => m.id);

  // Then get logs for those medications
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*, medications(name, dosage, frequency)')
    .in('medication_id', medicationIds)
    .gte('scheduled_at', `${startDate}T00:00:00`)
    .lte('scheduled_at', `${endDate}T23:59:59`)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get parent's today's medication logs
 * @param parentId - Parent user ID
 * @returns List of today's medication logs
 */
export const getParentTodayLogs = async (parentId: string): Promise<MedicationLog[]> => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return getParentMedicationLogs(parentId, dateStr, dateStr);
};

/**
 * Calculate adherence rate for parent
 * @param parentId - Parent user ID
 * @param days - Number of days to calculate (default: 7)
 * @returns Adherence rate as percentage (0-100)
 */
export const calculateAdherenceRate = async (
  parentId: string,
  days: number = 7
): Promise<number> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const logs = await getParentMedicationLogs(parentId, startDateStr, endDateStr);

  if (logs.length === 0) return 0;

  const takenCount = logs.filter((log) => log.taken).length;
  return Math.round((takenCount / logs.length) * 100);
};

/**
 * Get weekly adherence data for parent
 * @param parentId - Parent user ID
 * @returns Array of daily adherence data for the last 7 days
 */
export const getWeeklyAdherenceData = async (
  parentId: string
): Promise<{ date: string; rate: number; taken: number; total: number }[]> => {
  const result: { date: string; rate: number; taken: number; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const logs = await getParentMedicationLogs(parentId, dateStr, dateStr);
    const taken = logs.filter((log) => log.taken).length;
    const total = logs.length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

    result.push({ date: dateStr, rate, taken, total });
  }

  return result;
};

/**
 * Get monthly adherence data for parent
 * @param parentId - Parent user ID
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12)
 * @returns Object with date as key and adherence data as value
 */
export const getMonthlyAdherenceData = async (
  parentId: string,
  year: number,
  month: number
): Promise<Record<string, { rate: number; taken: number; total: number }>> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const logs = await getParentMedicationLogs(parentId, startDateStr, endDateStr);

  // Group logs by date
  const groupedByDate: Record<string, MedicationLog[]> = {};
  logs.forEach((log) => {
    const dateStr = log.scheduled_at.split('T')[0];
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = [];
    }
    groupedByDate[dateStr].push(log);
  });

  // Calculate rate for each date
  const result: Record<string, { rate: number; taken: number; total: number }> = {};
  Object.entries(groupedByDate).forEach(([dateStr, dateLogs]) => {
    const taken = dateLogs.filter((log) => log.taken).length;
    const total = dateLogs.length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
    result[dateStr] = { rate, taken, total };
  });

  return result;
};

/**
 * Toggle medication active status
 * @param medicationId - Medication ID
 * @param active - Active status
 * @returns Updated medication
 */
export const toggleMedicationActive = async (
  medicationId: string,
  active: boolean
): Promise<Medication> => {
  return updateMedication(medicationId, { active });
};

/**
 * =====================================
 * PUSH TOKEN & NOTIFICATION API
 * =====================================
 */

import {
  MissedMedicationEvent,
  NotificationPreferences,
  ChildPushTokenInfo,
} from '../types/database.types';

/**
 * Save push token for current user
 * @param token - Expo Push Token
 */
export const savePushToken = async (token: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({
      push_token: token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
  console.log('푸시 토큰 저장 완료');
};

/**
 * Get push tokens for connected children of a parent
 * @param parentId - Parent user ID
 * @returns Array of child push token info
 */
export const getChildrenPushTokens = async (parentId: string): Promise<ChildPushTokenInfo[]> => {
  const { data, error } = await supabase.rpc('get_children_push_tokens', {
    parent_user_id: parentId,
  });

  if (error) {
    console.error('자녀 푸시 토큰 조회 실패:', error);
    return [];
  }

  return data || [];
};

/**
 * Create missed medication event (for child notifications)
 * @param medicationId - Medication ID
 * @param medicationName - Medication name
 * @param scheduledTime - Scheduled time
 * @param skipReason - Skip reason (optional)
 * @returns Created event
 */
export const createMissedMedicationEvent = async (
  medicationId: string,
  medicationName: string,
  scheduledTime: Date,
  skipReason?: string
): Promise<MissedMedicationEvent> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('missed_medication_events')
    .insert({
      parent_id: user.id,
      medication_id: medicationId,
      medication_name: medicationName,
      scheduled_time: scheduledTime.toISOString(),
      skip_reason: skipReason || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Send push notification to children about missed medication
 * Calls Supabase Edge Function
 * @param event - Missed medication event
 */
export const sendMissedMedicationPushNotification = async (
  event: MissedMedicationEvent
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        parent_id: event.parent_id,
        medication_name: event.medication_name,
        scheduled_time: event.scheduled_time,
        skip_reason: event.skip_reason,
        event_id: event.id,
      },
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    // Silently fail - push notification is not critical
    // The missed event is already recorded in the database
  }
};

/**
 * Get unread missed medication events for child
 * @param parentId - Parent user ID
 * @returns Array of unread events
 */
export const getUnreadMissedEvents = async (parentId: string): Promise<MissedMedicationEvent[]> => {
  const { data, error } = await supabase
    .from('missed_medication_events')
    .select('*, parent:parent_id(id, name, email)')
    .eq('parent_id', parentId)
    .is('read_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get recent missed medication events for child
 * @param parentId - Parent user ID
 * @param limit - Number of events to return (default: 10)
 * @returns Array of events
 */
export const getRecentMissedEvents = async (
  parentId: string,
  limit: number = 10
): Promise<MissedMedicationEvent[]> => {
  const { data, error } = await supabase
    .from('missed_medication_events')
    .select('*, parent:parent_id(id, name, email)')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Mark missed medication event as read
 * @param eventId - Event ID
 */
export const markMissedEventAsRead = async (eventId: string): Promise<void> => {
  const { error } = await supabase
    .from('missed_medication_events')
    .update({ read_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) throw error;
};

/**
 * Mark all missed events as read for a parent
 * @param parentId - Parent user ID
 */
export const markAllMissedEventsAsRead = async (parentId: string): Promise<void> => {
  const { error } = await supabase
    .from('missed_medication_events')
    .update({ read_at: new Date().toISOString() })
    .eq('parent_id', parentId)
    .is('read_at', null);

  if (error) throw error;
};

/**
 * =====================================
 * NOTIFICATION PREFERENCES API
 * =====================================
 */

/**
 * Get notification preferences for current user
 * @returns Notification preferences or null
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found - return null
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Update notification preferences for current user
 * @param updates - Partial preferences to update
 * @returns Updated preferences
 */
export const updateNotificationPreferences = async (
  updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<NotificationPreferences> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Try to update existing preferences
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new with defaults
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: user.id,
        push_enabled: updates.push_enabled ?? true,
        missed_medication_alert: updates.missed_medication_alert ?? true,
        daily_summary: updates.daily_summary ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * =====================================
 * REALTIME SUBSCRIPTIONS
 * =====================================
 */

/**
 * Subscribe to missed medication events for a parent
 * Used by child app to receive real-time notifications
 *
 * @param parentId - Parent user ID to subscribe to
 * @param callback - Function to call when new event arrives
 * @returns Unsubscribe function
 */
export const subscribeMissedMedicationEvents = (
  parentId: string,
  callback: (event: MissedMedicationEvent) => void
): (() => void) => {
  const channel = supabase
    .channel(`missed_events_${parentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'missed_medication_events',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload) => {
        console.log('새 미복용 이벤트 수신:', payload);
        callback(payload.new as MissedMedicationEvent);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * =====================================
 * REPORT & ANALYTICS API
 * =====================================
 */

/**
 * Time slot definitions for pattern analysis
 */
const TIME_SLOT_CONFIG: Record<TimeSlot, { start: number; end: number; range: string }> = {
  morning: { start: 6, end: 12, range: '06:00-12:00' },
  afternoon: { start: 12, end: 18, range: '12:00-18:00' },
  evening: { start: 18, end: 22, range: '18:00-22:00' },
  night: { start: 22, end: 6, range: '22:00-06:00' },
};

/**
 * Determine time slot from hour
 * @param hour - Hour of day (0-23)
 * @returns TimeSlot
 */
const getTimeSlotFromHour = (hour: number): TimeSlot => {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night'; // 22-6
};

/**
 * Get per-medication adherence statistics
 *
 * Calculates adherence rate for each medication individually,
 * helping identify which medications are most often missed.
 *
 * @param parentId - Parent user ID
 * @param days - Number of days to analyze (default: 30)
 * @returns Array of medication adherence data sorted by adherence rate (ascending)
 *
 * @example
 * const adherenceByDrug = await getMedicationAdherenceByDrug('parent-uuid', 30);
 * // Returns: [
 * //   { medication_id: '...', medication_name: '혈압약', dosage: '1정', total_scheduled: 60, total_taken: 45, adherence_rate: 75 },
 * //   { medication_id: '...', medication_name: '당뇨약', dosage: '2정', total_scheduled: 30, total_taken: 28, adherence_rate: 93.33 }
 * // ]
 */
export const getMedicationAdherenceByDrug = async (
  parentId: string,
  days: number = 30
): Promise<MedicationAdherence[]> => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get parent's medications
    const medications = await getParentMedications(parentId);
    if (medications.length === 0) return [];

    // Get all logs for the period
    const logs = await getParentMedicationLogs(parentId, startDateStr, endDateStr);

    // Group logs by medication_id
    const logsByMedication = new Map<string, MedicationLog[]>();
    logs.forEach((log) => {
      const existing = logsByMedication.get(log.medication_id) || [];
      existing.push(log);
      logsByMedication.set(log.medication_id, existing);
    });

    // Calculate adherence for each medication
    const adherenceData: MedicationAdherence[] = medications.map((med) => {
      const medLogs = logsByMedication.get(med.id) || [];
      const totalScheduled = medLogs.length;
      const totalTaken = medLogs.filter((log) => log.taken).length;
      const adherenceRate =
        totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100 * 100) / 100 : 0;

      return {
        medication_id: med.id,
        medication_name: med.name,
        dosage: med.dosage,
        total_scheduled: totalScheduled,
        total_taken: totalTaken,
        adherence_rate: adherenceRate,
      };
    });

    // Sort by adherence rate (ascending) - lowest adherence first
    adherenceData.sort((a, b) => a.adherence_rate - b.adherence_rate);

    return adherenceData;
  } catch (error) {
    console.error('약별 복약률 분석 실패:', error);
    throw error;
  }
};

/**
 * Analyze missed medication patterns by time slot
 *
 * Identifies which time periods (morning, afternoon, evening, night)
 * have the highest miss rates to help optimize reminder strategies.
 *
 * @param parentId - Parent user ID
 * @param days - Number of days to analyze (default: 30)
 * @returns Array of time slot patterns sorted by miss rate (descending)
 *
 * @example
 * const patterns = await getMissedMedicationPattern('parent-uuid', 30);
 * // Returns: [
 * //   { time_slot: 'evening', time_range: '18:00-22:00', missed_count: 15, total_count: 60, miss_rate: 25 },
 * //   { time_slot: 'morning', time_range: '06:00-12:00', missed_count: 8, total_count: 60, miss_rate: 13.33 },
 * //   ...
 * // ]
 */
export const getMissedMedicationPattern = async (
  parentId: string,
  days: number = 30
): Promise<TimeSlotPattern[]> => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all logs for the period
    const logs = await getParentMedicationLogs(parentId, startDateStr, endDateStr);

    if (logs.length === 0) {
      // Return empty pattern for all time slots
      return (['morning', 'afternoon', 'evening', 'night'] as TimeSlot[]).map((slot) => ({
        time_slot: slot,
        time_range: TIME_SLOT_CONFIG[slot].range,
        missed_count: 0,
        total_count: 0,
        miss_rate: 0,
      }));
    }

    // Initialize counters for each time slot
    const slotCounts: Record<TimeSlot, { missed: number; total: number }> = {
      morning: { missed: 0, total: 0 },
      afternoon: { missed: 0, total: 0 },
      evening: { missed: 0, total: 0 },
      night: { missed: 0, total: 0 },
    };

    // Categorize each log by time slot
    logs.forEach((log) => {
      const scheduledDate = new Date(log.scheduled_at);
      const hour = scheduledDate.getHours();
      const timeSlot = getTimeSlotFromHour(hour);

      slotCounts[timeSlot].total += 1;
      if (!log.taken) {
        slotCounts[timeSlot].missed += 1;
      }
    });

    // Build result array
    const patterns: TimeSlotPattern[] = (
      ['morning', 'afternoon', 'evening', 'night'] as TimeSlot[]
    ).map((slot) => {
      const { missed, total } = slotCounts[slot];
      const missRate = total > 0 ? Math.round((missed / total) * 100 * 100) / 100 : 0;

      return {
        time_slot: slot,
        time_range: TIME_SLOT_CONFIG[slot].range,
        missed_count: missed,
        total_count: total,
        miss_rate: missRate,
      };
    });

    // Sort by miss rate (descending) - highest miss rate first
    patterns.sort((a, b) => b.miss_rate - a.miss_rate);

    return patterns;
  } catch (error) {
    console.error('시간대별 미복약 패턴 분석 실패:', error);
    throw error;
  }
};

/**
 * Get weekly adherence trend over 4 weeks
 *
 * Tracks adherence rate changes over time to identify improvement
 * or decline patterns in medication compliance.
 *
 * @param parentId - Parent user ID
 * @returns Array of 4 weekly trend data points, oldest first
 *
 * @example
 * const trend = await getAdherenceTrend('parent-uuid');
 * // Returns: [
 * //   { week_start: '2024-01-01', week_end: '2024-01-07', week_label: '1주차', adherence_rate: 75, trend: 'stable' },
 * //   { week_start: '2024-01-08', week_end: '2024-01-14', week_label: '2주차', adherence_rate: 80, trend: 'up' },
 * //   { week_start: '2024-01-15', week_end: '2024-01-21', week_label: '3주차', adherence_rate: 78, trend: 'down' },
 * //   { week_start: '2024-01-22', week_end: '2024-01-28', week_label: '4주차', adherence_rate: 85, trend: 'up' }
 * // ]
 */
export const getAdherenceTrend = async (parentId: string): Promise<WeeklyTrend[]> => {
  try {
    const trends: WeeklyTrend[] = [];
    const today = new Date();

    // Calculate 4 weeks of data (going backwards from today)
    for (let weekIndex = 3; weekIndex >= 0; weekIndex--) {
      // Calculate week boundaries
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - weekIndex * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Get logs for this week
      const logs = await getParentMedicationLogs(parentId, weekStartStr, weekEndStr);

      // Calculate adherence rate
      const totalScheduled = logs.length;
      const totalTaken = logs.filter((log) => log.taken).length;
      const adherenceRate =
        totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

      // Determine week label (1주차 = oldest, 4주차 = most recent)
      const weekLabel = `${4 - weekIndex}주차`;

      trends.push({
        week_start: weekStartStr,
        week_end: weekEndStr,
        week_label: weekLabel,
        adherence_rate: adherenceRate,
        trend: 'stable' as TrendDirection, // Will be calculated after all weeks are processed
      });
    }

    // Calculate trend direction by comparing with previous week
    for (let i = 0; i < trends.length; i++) {
      if (i === 0) {
        // First week has no previous week to compare
        trends[i].trend = 'stable';
      } else {
        const currentRate = trends[i].adherence_rate;
        const previousRate = trends[i - 1].adherence_rate;
        const difference = currentRate - previousRate;

        // Use 5% threshold for determining trend
        if (difference > 5) {
          trends[i].trend = 'up';
        } else if (difference < -5) {
          trends[i].trend = 'down';
        } else {
          trends[i].trend = 'stable';
        }
      }
    }

    return trends;
  } catch (error) {
    console.error('복약률 트렌드 분석 실패:', error);
    throw error;
  }
};

/**
 * =====================================
 * APPOINTMENTS API
 * =====================================
 */

/**
 * Appointment form data for creating/updating appointments
 */
export interface AppointmentFormData {
  title: string;
  hospital_name: string;
  appointment_date: Date | string;
  notes?: string;
}

/**
 * Get all appointments for current user (parent)
 * @returns List of appointments ordered by appointment date
 */
export const getAppointments = async (): Promise<Appointment[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single appointment by ID
 * @param appointmentId - Appointment ID
 * @returns Single appointment
 */
export const getAppointment = async (appointmentId: string): Promise<Appointment> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get parent's appointments (for child view)
 * @param parentId - Parent user ID
 * @returns List of parent's appointments
 */
export const getParentAppointments = async (parentId: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', parentId)
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get upcoming appointments for a user
 * @param userId - User ID
 * @param days - Number of days to look ahead (default: 7)
 * @returns List of upcoming appointments
 */
export const getUpcomingAppointments = async (
  userId: string,
  days: number = 7
): Promise<Appointment[]> => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('appointment_date', now.toISOString())
    .lte('appointment_date', futureDate.toISOString())
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new appointment
 * @param data - Appointment form data
 * @returns Created appointment
 */
export const createAppointment = async (data: AppointmentFormData): Promise<Appointment> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const appointmentData = {
    user_id: user.id,
    title: data.title.trim(),
    hospital_name: data.hospital_name.trim(),
    appointment_date:
      typeof data.appointment_date === 'string'
        ? data.appointment_date
        : data.appointment_date.toISOString(),
    notes: data.notes?.trim() || undefined,
  };

  const { data: created, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return created;
};

/**
 * Create appointment for parent (by child)
 * @param parentId - Parent user ID
 * @param data - Appointment form data
 * @returns Created appointment
 */
export const createAppointmentForParent = async (
  parentId: string,
  data: AppointmentFormData
): Promise<Appointment> => {
  const appointmentData = {
    user_id: parentId,
    title: data.title.trim(),
    hospital_name: data.hospital_name.trim(),
    appointment_date:
      typeof data.appointment_date === 'string'
        ? data.appointment_date
        : data.appointment_date.toISOString(),
    notes: data.notes?.trim() || undefined,
  };

  const { data: created, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return created;
};

/**
 * Update an appointment
 * @param appointmentId - Appointment ID
 * @param updates - Partial appointment data to update
 * @returns Updated appointment
 */
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<AppointmentFormData>
): Promise<Appointment> => {
  const updateData: Record<string, string> = {};

  if (updates.title !== undefined) {
    updateData.title = updates.title.trim();
  }
  if (updates.hospital_name !== undefined) {
    updateData.hospital_name = updates.hospital_name.trim();
  }
  if (updates.appointment_date !== undefined) {
    updateData.appointment_date =
      typeof updates.appointment_date === 'string'
        ? updates.appointment_date
        : updates.appointment_date.toISOString();
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes?.trim() || '';
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete an appointment
 * @param appointmentId - Appointment ID
 */
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);

  if (error) throw error;
};
