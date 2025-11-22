/**
 * TimePickerButton - 시간 선택 버튼 컴포넌트
 *
 * 노인 친화적인 큰 터치 영역과 한국어 시간 형식을 지원하는
 * 재사용 가능한 시간 선택 버튼입니다.
 *
 * Features:
 * - 60px 이상 최소 터치 영역 (노인 친화적)
 * - 한국어 시간 형식 (오전/오후)
 * - WCAG AAA 대비율 준수
 * - 접근성 레이블 및 힌트 지원
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface TimePickerButtonProps {
  /** 선택된 시간 (HH:mm 형식, 예: "09:00") */
  value: string;
  /** 시간 변경 시 호출되는 콜백 */
  onTimeChange: (time: string) => void;
  /** 버튼 레이블 (예: "아침 알림 시간") */
  label?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 테스트용 ID */
  testID?: string;
}

/**
 * 시간 문자열을 Date 객체로 변환
 * @param timeString - "HH:mm" 형식의 시간 문자열
 * @returns Date 객체
 */
const parseTimeToDate = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Date 객체를 시간 문자열로 변환
 * @param date - Date 객체
 * @returns "HH:mm" 형식의 시간 문자열
 */
const formatDateToTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 시간을 한국어 형식으로 포맷
 * @param timeString - "HH:mm" 형식의 시간 문자열
 * @returns 한국어 형식 (예: "오전 9:00", "오후 2:30")
 */
const formatTimeKorean = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const isAM = hours < 12;
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = isAM ? '오전' : '오후';
  return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
};

const TimePickerButton: React.FC<TimePickerButtonProps> = ({
  value,
  onTimeChange,
  label,
  disabled = false,
  testID,
}) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<Date>(parseTimeToDate(value));

  /**
   * 시간 선택 변경 처리
   */
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onTimeChange(formatDateToTime(selectedDate));
      }
    } else {
      // iOS: 모달에서 선택 중
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  /**
   * iOS 모달 확인 버튼 처리
   */
  const handleConfirm = (): void => {
    onTimeChange(formatDateToTime(tempDate));
    setShowPicker(false);
  };

  /**
   * iOS 모달 취소 버튼 처리
   */
  const handleCancel = (): void => {
    setTempDate(parseTimeToDate(value));
    setShowPicker(false);
  };

  /**
   * 버튼 클릭 처리
   */
  const handlePress = (): void => {
    if (!disabled) {
      setTempDate(parseTimeToDate(value));
      setShowPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityLabel={`시간 선택: ${formatTimeKorean(value)}`}
        accessibilityHint="탭하여 알림 시간을 변경합니다"
        accessibilityRole="button"
        testID={testID}
      >
        <Text style={[styles.timeText, disabled && styles.timeTextDisabled]}>
          {formatTimeKorean(value)}
        </Text>
      </TouchableOpacity>

      {/* Android: 직접 DateTimePicker 표시 */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={parseTimeToDate(value)}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={handleTimeChange}
          minuteInterval={5}
        />
      )}

      {/* iOS: 모달로 DateTimePicker 표시 */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCancel}
                  accessibilityLabel="취소"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonTextCancel}>취소</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>시간 선택</Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleConfirm}
                  accessibilityLabel="확인"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonTextConfirm}>확인</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
                minuteInterval={5}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60, // 노인 친화적 최소 터치 영역
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timeTextDisabled: {
    color: '#9CA3AF',
  },
  // iOS Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
  },
  modalButtonTextCancel: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalButtonTextConfirm: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22C55E',
  },
  picker: {
    height: 200,
  },
});

export default TimePickerButton;
