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
  NotificationSchedule,
} from '../types/database.types';
import {
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  rescheduleMedicationNotifications,
} from './notifications';

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
  const { data, error } = await supabase
    .from('medications')
    .insert([medication])
    .select()
    .single();

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
      updated_at: new Date().toISOString(),
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
export const removeFamilyConnection = async (
  connectionId: string
): Promise<void> => {
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

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  updates: Partial<User>
): Promise<User> => {
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
    const notificationIds = await scheduleMedicationNotifications(
      savedMedication
    );
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
export const deleteMedicationWithNotifications = async (
  medicationId: string
): Promise<void> => {
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
 * 모든 활성 약에 대해 알림 일괄 예약
 * (앱 재시작 시 또는 권한 허용 직후 사용)
 */
export const scheduleAllMedicationNotifications = async (): Promise<void> => {
  try {
    const medications = await getMedications();

    for (const medication of medications) {
      if (medication.active && medication.reminder_times.length > 0) {
        const notificationIds = await scheduleMedicationNotifications(
          medication
        );
        notificationSchedules.set(medication.id, notificationIds);
      }
    }

    console.log(
      `총 ${medications.length}개 약의 알림이 예약되었습니다.`
    );
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
    return parent[0] as User || null;
  }

  return parent as unknown as User;
};

/**
 * Get parent's medications (for child view)
 * @param parentId - Parent user ID
 * @returns List of parent's active medications
 */
export const getParentMedications = async (
  parentId: string
): Promise<Medication[]> => {
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
export const getParentTodayLogs = async (
  parentId: string
): Promise<MedicationLog[]> => {
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
 * Create medication for parent (by child)
 * @param parentId - Parent user ID
 * @param formData - Medication form data
 * @returns Created medication
 */
export const createMedicationForParent = async (
  parentId: string,
  formData: MedicationFormData
): Promise<Medication> => {
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

  const medication = await createMedication(medicationData);
  return medication;
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
