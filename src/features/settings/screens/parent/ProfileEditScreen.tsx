/**
 * ProfileEditScreen - Parent Profile Edit
 *
 * Elderly-friendly profile editing screen with:
 * - Large text inputs (72px height)
 * - High contrast colors (WCAG AAA)
 * - Simple one-column layout
 * - Clear save/cancel buttons
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
import { User } from '../../../../shared/types/database.types';
import { ParentStackParamList } from '../../../../shared/types/navigation.types';

type NavigationProp = NativeStackNavigationProp<ParentStackParamList>;

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
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-600 mt-4">불러오는 중...</Text>
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
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View className="mb-8">
            <Text
              className="text-2xl font-bold text-gray-900 mb-3"
              accessibilityRole="text"
              accessibilityLabel="이름 입력란"
            >
              이름 <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl text-gray-900"
              style={{ minHeight: 72 }}
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
              autoCapitalize="words"
              accessibilityLabel="이름"
              accessibilityHint="이름을 입력해주세요"
            />
          </View>

          {/* Phone Number Input */}
          <View className="mb-8">
            <Text
              className="text-2xl font-bold text-gray-900 mb-3"
              accessibilityRole="text"
              accessibilityLabel="전화번호 입력란"
            >
              전화번호 <Text className="text-gray-400">(선택)</Text>
            </Text>
            <TextInput
              className="bg-white border-2 border-gray-300 rounded-2xl px-6 py-5 text-2xl text-gray-900"
              style={{ minHeight: 72 }}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="010-0000-0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={20}
              accessibilityLabel="전화번호"
              accessibilityHint="전화번호를 입력해주세요"
            />
          </View>

          {/* Email (Read-only) */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              이메일 <Text className="text-gray-400">(변경 불가)</Text>
            </Text>
            <View className="bg-gray-100 border-2 border-gray-200 rounded-2xl px-6 py-5">
              <Text className="text-2xl text-gray-500">{email}</Text>
            </View>
            <Text className="text-base text-gray-500 mt-2 ml-2">
              이메일은 보안상 변경할 수 없습니다
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View className="flex-row p-5 gap-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded-2xl justify-center items-center"
            style={{ minHeight: 72 }}
            onPress={handleCancel}
            disabled={isSaving}
            accessibilityLabel="취소"
            accessibilityRole="button"
          >
            <Text className="text-2xl font-bold text-gray-700">취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-[2] rounded-2xl justify-center items-center ${
              isSaving ? 'bg-gray-400' : 'bg-success'
            }`}
            style={{ minHeight: 72 }}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityLabel="저장"
            accessibilityRole="button"
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                <Text className="text-2xl font-bold text-white">저장</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileEditScreen;
