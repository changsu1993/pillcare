/**
 * Adherence API
 *
 * Functions for calculating medication adherence rates.
 */

import type { MedicationAdherence, MedicationLog } from '../../../types/database.types';
import { getParentMedications, getParentMedicationLogs } from './parent-data.api';

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
 * Get per-medication adherence statistics
 *
 * Calculates adherence rate for each medication individually,
 * helping identify which medications are most often missed.
 *
 * @param parentId - Parent user ID
 * @param days - Number of days to analyze (default: 30)
 * @returns Array of medication adherence data sorted by adherence rate (ascending)
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
