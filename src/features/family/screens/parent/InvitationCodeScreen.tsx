/**
 * InvitationCodeScreen - Parent invitation code generation screen
 *
 * Elderly-friendly design with:
 * - Large code display (48pt+)
 * - High contrast colors
 * - Big buttons (72px height)
 * - Simple instructions in Korean
 * - Copy to clipboard and share functionality
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ParentScreenProps } from '../../../../shared/types/navigation.types';
import { generateInvitationCode, getConnectedChildren } from '../../../../shared/services/api';
import { User } from '../../../../shared/types/database.types';

type Props = ParentScreenProps<'InvitationCode'>;

const InvitationCodeScreen = (_props: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [connectedChildren, setConnectedChildren] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load connected children
      const children = await getConnectedChildren();
      setConnectedChildren(children);

      // Generate invitation code
      const code = await generateInvitationCode();
      setInvitationCode(code);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('코드를 생성할 수 없습니다.\n다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!invitationCode) return;

    try {
      await Clipboard.setStringAsync(invitationCode);
      setCopied(true);
      Alert.alert('복사 완료', '초대 코드가 복사되었습니다.');

      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error copying code:', err);
      Alert.alert('오류', '코드를 복사할 수 없습니다.');
    }
  };

  const handleShareCode = async () => {
    if (!invitationCode) return;

    try {
      const message = `PillCare 가족 연결 초대 코드: ${invitationCode}\n\n이 코드를 PillCare 앱에 입력하여 가족으로 연결하세요.\n\n유효기간: 24시간`;

      await Share.share({
        message,
        title: 'PillCare 초대 코드',
      });
    } catch (err) {
      console.error('Error sharing code:', err);
    }
  };

  // Format code with spaces for readability (123 456)
  const formatCode = (code: string): string => {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-xl text-gray-900 mt-4">코드 생성 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-6xl text-error mb-4">!</Text>
        <Text className="text-xl text-gray-900 text-center mb-6 leading-7">{error}</Text>
        <TouchableOpacity
          className="bg-success px-8 py-4 rounded-xl"
          onPress={loadData}
          activeOpacity={0.7}
        >
          <Text className="text-xl font-semibold text-white">다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="flex-1 p-6">
        {/* Instructions */}
        <View className="bg-white p-6 rounded-2xl mb-6 border-2 border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-3">가족 연결 방법</Text>
          <Text className="text-lg text-gray-600 leading-7">
            1. 아래 코드를 자녀분께 알려주세요{'\n'}
            2. 자녀분이 앱에서 코드를 입력하면{'\n'}
            3. 가족으로 연결됩니다
          </Text>
        </View>

        {/* Code Display */}
        <View className="bg-white p-8 rounded-3xl items-center mb-6 border-[3px] border-success shadow-lg">
          <Text className="text-lg font-semibold text-gray-500 mb-4">초대 코드</Text>
          <Text
            className="text-5xl font-bold text-gray-900 tracking-[8px] mb-4"
            accessibilityLabel={`초대 코드 ${invitationCode?.split('').join(' ')}`}
          >
            {invitationCode ? formatCode(invitationCode) : '------'}
          </Text>
          <View className="flex-row items-center gap-2">
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text className="text-base text-gray-500">24시간 후 만료됩니다</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity
            className="flex-1 h-[72px] flex-row items-center justify-center bg-success rounded-2xl gap-3 shadow-md"
            onPress={handleCopyCode}
            activeOpacity={0.7}
            accessibilityLabel="코드 복사하기"
            accessibilityRole="button"
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={32} color="#FFFFFF" />
            <Text className="text-xl font-bold text-white">{copied ? '복사됨' : '코드 복사'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 h-[72px] flex-row items-center justify-center bg-primary rounded-2xl gap-3 shadow-md"
            onPress={handleShareCode}
            activeOpacity={0.7}
            accessibilityLabel="코드 공유하기"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={32} color="#FFFFFF" />
            <Text className="text-xl font-bold text-white">공유하기</Text>
          </TouchableOpacity>
        </View>

        {/* Connected Children List */}
        {connectedChildren.length > 0 && (
          <View className="bg-white p-5 rounded-2xl border-2 border-gray-200">
            <Text className="text-xl font-bold text-gray-900 mb-4">연결된 자녀</Text>
            {connectedChildren.map((child) => (
              <View key={child.id} className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center">
                  <Text className="text-xl font-bold text-primary">
                    {child.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold text-gray-900">{child.name}</Text>
                  <Text className="text-sm text-gray-500 mt-0.5">{child.email}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default InvitationCodeScreen;
