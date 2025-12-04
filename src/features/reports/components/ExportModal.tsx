/**
 * ExportModal - Data Export Modal Component
 *
 * Modal for exporting medication history to CSV or PDF format.
 * Features:
 * - Format selection (CSV/PDF)
 * - Date range selection (7 days, 30 days, 90 days, all)
 * - Medication filter selection
 * - Preview of export data
 * - Share functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ExportFormat,
  DateRangePreset,
  ExportOptions,
  ExportDataRow,
  ExportSummary,
  fetchExportData,
  exportAndShare,
  getDateRangeLabel,
  getFormatLabel,
} from '../services/exportService';
import { Medication, User } from '../../../shared/types/database.types';
import { getParentMedications } from '../../../shared/services/api';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  parentInfo: User;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose, parentInfo }) => {
  // State
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [dateRange, setDateRange] = useState<DateRangePreset>('30days');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Preview state
  const [previewData, setPreviewData] = useState<ExportDataRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<ExportSummary | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Load medications callback
  const loadMedications = useCallback(async () => {
    try {
      const meds = await getParentMedications(parentInfo.id);
      setMedications(meds);
      setSelectedMedicationIds(meds.map((m) => m.id));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load medications:', error);
      }
    }
  }, [parentInfo.id]);

  // Load preview callback
  const loadPreview = useCallback(async () => {
    if (!parentInfo) return;

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const options: ExportOptions = {
        parentId: parentInfo.id,
        parentName: parentInfo.name,
        format,
        dateRange,
        medicationIds: selectAll ? undefined : selectedMedicationIds,
      };

      const { rows, summary } = await fetchExportData(options);
      setPreviewData(rows.slice(0, 10)); // Preview first 10 rows
      setPreviewSummary(summary);
    } catch (error) {
      if (__DEV__) {
        console.error('Preview load failed:', error);
      }
      setPreviewError('미리보기 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [parentInfo, format, dateRange, selectedMedicationIds, selectAll]);

  // Load medications on mount
  useEffect(() => {
    if (visible && parentInfo) {
      loadMedications();
    }
  }, [visible, parentInfo, loadMedications]);

  // Load preview when options change
  useEffect(() => {
    if (visible && parentInfo && medications.length > 0) {
      loadPreview();
    }
  }, [visible, parentInfo, medications.length, loadPreview]);

  const handleExport = async () => {
    if (!parentInfo) return;

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        parentId: parentInfo.id,
        parentName: parentInfo.name,
        format,
        dateRange,
        medicationIds: selectAll ? undefined : selectedMedicationIds,
      };

      await exportAndShare(options);
      onClose();
    } catch (error) {
      if (__DEV__) {
        console.error('Export failed:', error);
      }
      Alert.alert(
        '내보내기 실패',
        error instanceof Error ? error.message : '파일 내보내기 중 오류가 발생했습니다.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const toggleMedicationSelection = (medId: string) => {
    setSelectAll(false);
    setSelectedMedicationIds((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const handleSelectAll = () => {
    setSelectAll(true);
    setSelectedMedicationIds(medications.map((m) => m.id));
  };

  const dateRangeOptions: DateRangePreset[] = ['7days', '30days', '90days', 'all'];
  const formatOptions: ExportFormat[] = ['pdf', 'csv'];

  const isExportDisabled =
    isExporting || isLoadingPreview || (previewSummary?.totalScheduled ?? 0) === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">데이터 내보내기</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          {/* Format Selection */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">파일 형식</Text>
            <View className="flex-row gap-3">
              {formatOptions.map((f) => (
                <TouchableOpacity
                  key={f}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    format === f ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setFormat(f)}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons
                      name={f === 'pdf' ? 'document-text' : 'grid'}
                      size={20}
                      color={format === f ? '#3B82F6' : '#9CA3AF'}
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        format === f ? 'text-primary' : 'text-gray-500'
                      }`}
                    >
                      {f.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-xs text-gray-500 mt-2">{getFormatLabel(format)}</Text>
          </View>

          {/* Date Range Selection */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">기간 선택</Text>
            <View className="flex-row flex-wrap gap-2">
              {dateRangeOptions.map((range) => (
                <TouchableOpacity
                  key={range}
                  className={`py-2 px-4 rounded-full ${
                    dateRange === range ? 'bg-primary' : 'bg-gray-100'
                  }`}
                  onPress={() => setDateRange(range)}
                >
                  <Text
                    className={`font-medium ${
                      dateRange === range ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {getDateRangeLabel(range)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medication Selection */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">약 선택</Text>
            <TouchableOpacity
              className={`flex-row items-center py-3 px-4 rounded-lg mb-2 ${
                selectAll
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-gray-50 border border-gray-200'
              }`}
              onPress={handleSelectAll}
            >
              <Ionicons
                name={selectAll ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={selectAll ? '#3B82F6' : '#9CA3AF'}
              />
              <Text className={`ml-3 font-medium ${selectAll ? 'text-primary' : 'text-gray-600'}`}>
                전체 선택
              </Text>
            </TouchableOpacity>

            {medications.map((med) => {
              const isSelected = selectAll || selectedMedicationIds.includes(med.id);
              return (
                <TouchableOpacity
                  key={med.id}
                  className={`flex-row items-center py-3 px-4 rounded-lg mb-2 ${
                    isSelected && !selectAll
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                  onPress={() => toggleMedicationSelection(med.id)}
                  disabled={selectAll}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? '#3B82F6' : '#9CA3AF'}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                      {med.name}
                    </Text>
                    <Text className="text-xs text-gray-500">{med.dosage}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview Section */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">미리보기</Text>

            {isLoadingPreview ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-sm text-gray-500 mt-2">로딩 중...</Text>
              </View>
            ) : previewError ? (
              <View className="py-4 items-center">
                <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
                <Text className="text-sm text-error mt-2">{previewError}</Text>
              </View>
            ) : previewSummary ? (
              <>
                {/* Summary Stats */}
                <View className="flex-row justify-around mb-4 py-3 bg-gray-50 rounded-lg">
                  <View className="items-center">
                    <Text className="text-xl font-bold text-primary">
                      {previewSummary.adherenceRate}%
                    </Text>
                    <Text className="text-xs text-gray-500">복약률</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xl font-bold text-success">
                      {previewSummary.totalTaken}
                    </Text>
                    <Text className="text-xs text-gray-500">복용</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xl font-bold text-error">
                      {previewSummary.totalMissed}
                    </Text>
                    <Text className="text-xs text-gray-500">미복용</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xl font-bold text-gray-700">
                      {previewSummary.totalScheduled}
                    </Text>
                    <Text className="text-xs text-gray-500">총계</Text>
                  </View>
                </View>

                {/* Preview Table */}
                {previewData.length > 0 ? (
                  <View>
                    <View className="flex-row py-2 px-2 bg-gray-100 rounded-t-lg">
                      <Text className="flex-1 text-xs font-semibold text-gray-600">날짜</Text>
                      <Text className="flex-1 text-xs font-semibold text-gray-600">약 이름</Text>
                      <Text className="w-16 text-xs font-semibold text-gray-600 text-center">
                        상태
                      </Text>
                    </View>
                    {previewData.map((row, index) => (
                      <View
                        key={index}
                        className={`flex-row py-2 px-2 border-b border-gray-100 ${
                          row.status === 'missed' ? 'bg-error/5' : ''
                        }`}
                      >
                        <Text className="flex-1 text-xs text-gray-700">{row.date}</Text>
                        <Text className="flex-1 text-xs text-gray-700" numberOfLines={1}>
                          {row.medicationName}
                        </Text>
                        <View className="w-16 items-center">
                          <Ionicons
                            name={row.status === 'taken' ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={row.status === 'taken' ? '#22C55E' : '#EF4444'}
                          />
                        </View>
                      </View>
                    ))}
                    {previewSummary.totalScheduled > 10 && (
                      <Text className="text-xs text-gray-400 text-center mt-2">
                        외 {previewSummary.totalScheduled - 10}건의 기록
                      </Text>
                    )}
                  </View>
                ) : (
                  <View className="py-4 items-center">
                    <Ionicons name="document-outline" size={32} color="#9CA3AF" />
                    <Text className="text-sm text-gray-500 mt-2">내보낼 데이터가 없습니다</Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        </ScrollView>

        {/* Export Button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            className={`py-4 rounded-xl flex-row items-center justify-center ${
              isExportDisabled ? 'bg-gray-300' : 'bg-primary'
            }`}
            onPress={handleExport}
            disabled={isExportDisabled}
          >
            {isExporting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">내보내는 중...</Text>
              </>
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  {format.toUpperCase()} 파일로 내보내기
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ExportModal;
