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
import { TouchableOpacity, Text, View, Modal, Platform } from 'react-native';
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

const TimePickerButton = ({
  value,
  onTimeChange,
  label,
  disabled = false,
  testID,
}: TimePickerButtonProps) => {
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
    <View className="mb-4">
      {label && <Text className="text-xl font-semibold text-gray-900 mb-2">{label}</Text>}

      <TouchableOpacity
        className={`bg-white border-2 rounded-xl px-5 py-4 min-h-[60px] justify-center items-center ${
          disabled ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
        }`}
        onPress={handlePress}
        disabled={disabled}
        accessibilityLabel={`시간 선택: ${formatTimeKorean(value)}`}
        accessibilityHint="탭하여 알림 시간을 변경합니다"
        accessibilityRole="button"
        testID={testID}
      >
        <Text className={`text-2xl font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
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
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl pb-8">
              <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={handleCancel}
                  accessibilityLabel="취소"
                  accessibilityRole="button"
                >
                  <Text className="text-lg text-gray-500">취소</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900">시간 선택</Text>

                <TouchableOpacity
                  className="px-4 py-2 min-w-[60px]"
                  onPress={handleConfirm}
                  accessibilityLabel="확인"
                  accessibilityRole="button"
                >
                  <Text className="text-lg font-semibold text-success">확인</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
                minuteInterval={5}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default TimePickerButton;
