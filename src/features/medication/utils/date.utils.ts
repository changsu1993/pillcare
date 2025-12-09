/**
 * Date Utilities for Medication Forms
 *
 * Shared date formatting and parsing functions.
 */

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 한국어 형식으로 포맷
 */
export const formatDateKorean = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
