/**
 * ProfileEditScreen - Child Profile Edit
 *
 * Standard profile editing screen for adult users with:
 * - Standard form layout
 * - Validation and error handling
 * - Loading states
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUserProfile, updateUserProfile } from '../../../../shared/services/api';
import { ChildStackParamList } from '../../../../shared/types/navigation.types';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;

const ProfileEditScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  // Form state
  const [name, setName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<{ name: string; phoneNumber: string }>({
    name: '',
    phoneNumber: '',
  });

  /**
   * Load user profile
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        setName(profile.name);
        setPhoneNumber(profile.phone_number || '');
        setEmail(profile.email);
        setOriginalData({
          name: profile.name,
          phoneNumber: profile.phone_number || '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('오류', '프로필을 불러올 수 없습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigation]);

  /**
   * Check if there are unsaved changes
   */
  const hasChanges = (): boolean => {
    return name !== originalData.name || phoneNumber !== originalData.phoneNumber;
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    if (name.trim().length > 50) {
      Alert.alert('입력 오류', '이름은 50자 이하로 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    // Phone number validation (optional)
    if (phoneNumber && !/^[0-9-+\s()]*$/.test(phoneNumber)) {
      Alert.alert('입력 오류', '올바른 전화번호 형식을 입력해주세요.', [{ text: '확인' }]);
      return false;
    }

    return true;
  };

  /**
   * Save profile
   */
  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      await updateUserProfile({
        name: name.trim(),
        phone_number: phoneNumber.trim() || undefined,
      });

      Alert.alert('저장 완료', '프로필이 수정되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('저장 실패', '프로필을 저장하는 중 오류가 발생했습니다.\n다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel with confirmation if there are unsaved changes
   */
  const handleCancel = (): void => {
    if (hasChanges()) {
      Alert.alert('변경 사항 취소', '변경한 내용을 저장하지 않고 나가시겠습니까?', [
        { text: '계속 수정', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-base text-gray-600 mt-3">불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Avatar */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-3">
              <Text className="text-4xl font-bold text-white">
                {name.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text className="text-sm text-gray-500">프로필 사진은 추후 지원 예정입니다</Text>
          </View>

          {/* Name Input */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              이름 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number Input */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              전화번호 <Text className="text-gray-400">(선택)</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="010-0000-0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          {/* Email (Read-only) */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              이메일 <Text className="text-gray-400">(변경 불가)</Text>
            </Text>
            <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
              <Text className="text-base text-gray-500">{email}</Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1.5">이메일은 보안상 변경할 수 없습니다</Text>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View className="flex-row p-4 gap-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-4 items-center justify-center"
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text className="text-base font-semibold text-gray-600">취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-[2] rounded-xl py-4 items-center justify-center ${
              isSaving ? 'bg-gray-400' : 'bg-primary'
            }`}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-base font-semibold text-white">저장</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileEditScreen;
