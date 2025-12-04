/**
 * Export Service
 *
 * Service for exporting medication history data to CSV and PDF formats.
 * Uses expo-file-system for file operations and expo-print for PDF generation.
 */

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Medication } from '../../../shared/types/database.types';
import { getParentMedicationLogs, getParentMedications } from '../../../shared/services/api';

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'pdf';

/**
 * Date range preset options
 */
export type DateRangePreset = '7days' | '30days' | '90days' | 'all';

/**
 * Export options interface
 */
export interface ExportOptions {
  parentId: string;
  parentName: string;
  format: ExportFormat;
  dateRange: DateRangePreset | { startDate: string; endDate: string };
  medicationIds?: string[]; // If undefined or empty, export all medications
}

/**
 * Export data row for internal processing
 */
export interface ExportDataRow {
  date: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: 'taken' | 'missed';
  takenTime: string | null;
}

/**
 * Export summary statistics
 */
export interface ExportSummary {
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  adherenceRate: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Calculate date range from preset
 */
const getDateRangeFromPreset = (
  preset: DateRangePreset
): { startDate: string; endDate: string } => {
  const endDate = new Date();
  const startDate = new Date();

  switch (preset) {
    case '7days':
      startDate.setDate(endDate.getDate() - 6);
      break;
    case '30days':
      startDate.setDate(endDate.getDate() - 29);
      break;
    case '90days':
      startDate.setDate(endDate.getDate() - 89);
      break;
    case 'all':
      // Set start date to 1 year ago for "all" option
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

/**
 * Format date string to Korean format
 */
const formatDateKorean = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

/**
 * Format time from ISO string
 */
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Format date from ISO string (YYYY-MM-DD)
 */
const formatDate = (isoString: string): string => {
  return isoString.split('T')[0];
};

/**
 * Fetch and process medication logs for export
 */
export const fetchExportData = async (
  options: ExportOptions
): Promise<{ rows: ExportDataRow[]; summary: ExportSummary; medications: Medication[] }> => {
  // Determine date range
  const dateRange =
    typeof options.dateRange === 'string'
      ? getDateRangeFromPreset(options.dateRange)
      : options.dateRange;

  // Fetch medications
  const allMedications = await getParentMedications(options.parentId);

  // Filter medications if specific ones are selected
  const medications =
    options.medicationIds && options.medicationIds.length > 0
      ? allMedications.filter((med) => options.medicationIds?.includes(med.id))
      : allMedications;

  // Fetch logs
  const logs = await getParentMedicationLogs(
    options.parentId,
    dateRange.startDate,
    dateRange.endDate
  );

  // Filter logs by selected medications
  const filteredLogs =
    options.medicationIds && options.medicationIds.length > 0
      ? logs.filter((log) => options.medicationIds?.includes(log.medication_id))
      : logs;

  // Create medication name map
  const medicationMap = new Map<string, { name: string; dosage: string }>();
  medications.forEach((med) => {
    medicationMap.set(med.id, { name: med.name, dosage: med.dosage });
  });

  // Transform logs to export rows
  const rows: ExportDataRow[] = filteredLogs.map((log) => {
    const medInfo = medicationMap.get(log.medication_id) || {
      name: (log.medications as unknown as Medication)?.name || 'Unknown',
      dosage: (log.medications as unknown as Medication)?.dosage || '-',
    };

    return {
      date: formatDate(log.scheduled_at),
      medicationName: medInfo.name,
      dosage: medInfo.dosage,
      scheduledTime: formatTime(log.scheduled_at),
      status: log.taken ? 'taken' : 'missed',
      takenTime: log.taken_at ? formatTime(log.taken_at) : null,
    };
  });

  // Sort by date and time
  rows.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  // Calculate summary
  const totalScheduled = rows.length;
  const totalTaken = rows.filter((r) => r.status === 'taken').length;
  const totalMissed = totalScheduled - totalTaken;
  const adherenceRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

  const summary: ExportSummary = {
    totalScheduled,
    totalTaken,
    totalMissed,
    adherenceRate,
    dateRange,
  };

  return { rows, summary, medications };
};

/**
 * Generate CSV content from export data
 */
export const generateCSV = (rows: ExportDataRow[]): string => {
  // CSV header in Korean
  const header = '날짜,약 이름,복용량,예정 시간,복용 여부,복용 시간';

  // CSV rows
  const csvRows = rows.map((row) => {
    const statusText = row.status === 'taken' ? '복용' : '미복용';
    const takenTimeText = row.takenTime || '-';
    return `${row.date},${row.medicationName},${row.dosage},${row.scheduledTime},${statusText},${takenTimeText}`;
  });

  return [header, ...csvRows].join('\n');
};

/**
 * Generate PDF HTML content from export data
 */
export const generatePDFHtml = (
  rows: ExportDataRow[],
  summary: ExportSummary,
  parentName: string
): string => {
  // Group rows by date
  const rowsByDate = new Map<string, ExportDataRow[]>();
  rows.forEach((row) => {
    const existing = rowsByDate.get(row.date) || [];
    existing.push(row);
    rowsByDate.set(row.date, existing);
  });

  // Generate daily breakdown HTML
  let dailyBreakdownHtml = '';
  const sortedDates = Array.from(rowsByDate.keys()).sort();

  sortedDates.forEach((date) => {
    const dayRows = rowsByDate.get(date) || [];
    const dayTaken = dayRows.filter((r) => r.status === 'taken').length;
    const dayTotal = dayRows.length;
    const dayRate = dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 0;

    dailyBreakdownHtml += `
      <div class="day-section">
        <div class="day-header">
          <span class="day-date">${formatDateKorean(date)}</span>
          <span class="day-rate ${dayRate >= 80 ? 'rate-good' : dayRate >= 50 ? 'rate-warning' : 'rate-bad'}">${dayRate}%</span>
        </div>
        <table class="log-table">
          <thead>
            <tr>
              <th>약 이름</th>
              <th>복용량</th>
              <th>예정 시간</th>
              <th>복용 여부</th>
              <th>복용 시간</th>
            </tr>
          </thead>
          <tbody>
            ${dayRows
              .map(
                (row) => `
              <tr class="${row.status === 'missed' ? 'missed-row' : ''}">
                <td>${row.medicationName}</td>
                <td>${row.dosage}</td>
                <td>${row.scheduledTime}</td>
                <td class="${row.status === 'taken' ? 'status-taken' : 'status-missed'}">
                  ${row.status === 'taken' ? 'O' : 'X'}
                </td>
                <td>${row.takenTime || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PillCare 복약 리포트</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1a1a1a;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3B82F6;
        }
        .header h1 {
          font-size: 24px;
          color: #3B82F6;
          margin-bottom: 8px;
        }
        .header .subtitle {
          font-size: 14px;
          color: #666;
        }
        .info-section {
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 600;
          color: #666;
        }
        .info-value {
          font-weight: 500;
        }
        .summary-section {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
        }
        .rate-good { color: #22c55e; }
        .rate-warning { color: #f59e0b; }
        .rate-bad { color: #ef4444; }
        .day-section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background-color: #f3f4f6;
          border-radius: 6px 6px 0 0;
          border: 1px solid #e5e7eb;
          border-bottom: none;
        }
        .day-date {
          font-weight: 600;
          font-size: 13px;
        }
        .day-rate {
          font-weight: 700;
          font-size: 14px;
        }
        .log-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .log-table th,
        .log-table td {
          padding: 8px 10px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .log-table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .log-table td:first-child {
          text-align: left;
          font-weight: 500;
        }
        .missed-row {
          background-color: #fef2f2;
        }
        .status-taken {
          color: #22c55e;
          font-weight: 700;
        }
        .status-missed {
          color: #ef4444;
          font-weight: 700;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
        }
        @media print {
          body {
            padding: 10px;
          }
          .day-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PillCare 복약 리포트</h1>
        <p class="subtitle">Medication Adherence Report</p>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">환자명:</span>
          <span class="info-value">${parentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">기간:</span>
          <span class="info-value">${formatDateKorean(summary.dateRange.startDate)} ~ ${formatDateKorean(summary.dateRange.endDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">생성일:</span>
          <span class="info-value">${formatDateKorean(new Date().toISOString().split('T')[0])}</span>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-item">
          <div class="summary-value ${summary.adherenceRate >= 80 ? 'rate-good' : summary.adherenceRate >= 50 ? 'rate-warning' : 'rate-bad'}">${summary.adherenceRate}%</div>
          <div class="summary-label">총 복약률</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #22c55e;">${summary.totalTaken}</div>
          <div class="summary-label">복용 완료</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #ef4444;">${summary.totalMissed}</div>
          <div class="summary-label">미복용</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #3B82F6;">${summary.totalScheduled}</div>
          <div class="summary-label">총 예정</div>
        </div>
      </div>

      <h2 style="font-size: 16px; margin-bottom: 16px; color: #374151;">일별 복약 기록</h2>

      ${dailyBreakdownHtml}

      <div class="footer">
        <p>이 리포트는 PillCare 앱에서 자동 생성되었습니다.</p>
        <p>Generated by PillCare - Medication Management for Elderly Parents</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Export medication data to CSV file and share
 */
export const exportToCSV = async (options: ExportOptions): Promise<string> => {
  try {
    const { rows } = await fetchExportData(options);

    if (rows.length === 0) {
      throw new Error('내보낼 데이터가 없습니다.');
    }

    const csvContent = generateCSV(rows);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `PillCare_복약기록_${options.parentName}_${dateStr}.csv`;

    // Create file in cache directory using new expo-file-system API
    const csvFile = new File(Paths.cache, filename);
    csvFile.create();
    csvFile.write(csvContent);

    return csvFile.uri;
  } catch (error) {
    console.error('CSV 내보내기 실패:', error);
    throw error;
  }
};

/**
 * Export medication data to PDF file and share
 */
export const exportToPDF = async (options: ExportOptions): Promise<string> => {
  try {
    const { rows, summary } = await fetchExportData(options);

    if (rows.length === 0) {
      throw new Error('내보낼 데이터가 없습니다.');
    }

    const htmlContent = generatePDFHtml(rows, summary, options.parentName);

    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Generate new filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `PillCare_복약리포트_${options.parentName}_${dateStr}.pdf`;

    // Create source file reference and move to cache with new name
    const sourceFile = new File(uri);
    const destFile = new File(Paths.cache, filename);

    // Move/copy the PDF file
    sourceFile.move(destFile);

    return destFile.uri;
  } catch (error) {
    console.error('PDF 내보내기 실패:', error);
    throw error;
  }
};

/**
 * Export and share medication data
 */
export const exportAndShare = async (options: ExportOptions): Promise<void> => {
  try {
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('이 기기에서는 파일 공유를 지원하지 않습니다.');
    }

    // Generate file based on format
    const fileUri =
      options.format === 'csv' ? await exportToCSV(options) : await exportToPDF(options);

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: options.format === 'csv' ? 'text/csv' : 'application/pdf',
      dialogTitle: 'PillCare 복약 리포트 내보내기',
      UTI: options.format === 'csv' ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
    });
  } catch (error) {
    console.error('내보내기 및 공유 실패:', error);
    throw error;
  }
};

/**
 * Get date range label in Korean
 */
export const getDateRangeLabel = (preset: DateRangePreset): string => {
  switch (preset) {
    case '7days':
      return '최근 7일';
    case '30days':
      return '최근 30일';
    case '90days':
      return '최근 90일';
    case 'all':
      return '전체';
    default:
      return '';
  }
};

/**
 * Get format label in Korean
 */
export const getFormatLabel = (format: ExportFormat): string => {
  switch (format) {
    case 'csv':
      return 'CSV (스프레드시트)';
    case 'pdf':
      return 'PDF (문서)';
    default:
      return '';
  }
};
