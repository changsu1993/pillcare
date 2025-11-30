/**
 * FindEmailScreen - Find User Email (ID)
 *
 * Allows users to find their email by phone number or name.
 * Displays masked email result for privacy.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { findEmailByPhone, findEmailByName } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'FindEmail'>;

type SearchMethod = 'phone' | 'name';

interface SearchResult {
  found: boolean;
  result?: string | string[];
}

const FindEmailScreen = ({ navigation }: Props) => {
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const handleFindEmail = async (): Promise<void> => {
    // Validation
    if (searchMethod === 'phone' && !phoneNumber.trim()) {
      Alert.alert('입력 오류', '휴대폰 번호를 입력해주세요.');
      return;
    }

    if (searchMethod === 'name' && !name.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setSearchResult(null);

      if (searchMethod === 'phone') {
        const response = await findEmailByPhone(phoneNumber.trim());
        if (response.found && response.maskedEmail) {
          setSearchResult({
            found: true,
            result: response.maskedEmail,
          });
        } else {
          setSearchResult({ found: false });
        }
      } else {
        const response = await findEmailByName(name.trim());
        if (response.found && response.maskedEmails) {
          setSearchResult({
            found: true,
            result: response.maskedEmails,
          });
        } else {
          setSearchResult({ found: false });
        }
      }
    } catch (error) {
      console.error('Find email error:', error);
      Alert.alert('오류', '아이디 찾기 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSignIn = (): void => {
    navigation.navigate('SignIn');
  };

  const resetSearch = (): void => {
    setSearchResult(null);
    setPhoneNumber('');
    setName('');
  };

  const renderSearchMethodSelector = () => (
    <View className="flex-row gap-3">
      <TouchableOpacity
        className={`flex-1 h-[52px] border-2 rounded-xl items-center justify-center ${
          searchMethod === 'phone' ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => {
          setSearchMethod('phone');
          resetSearch();
        }}
        disabled={isLoading}
      >
        <Text
          className={`text-base font-semibold ${
            searchMethod === 'phone' ? 'text-primary' : 'text-gray-500'
          }`}
        >
          휴대폰 번호
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 h-[52px] border-2 rounded-xl items-center justify-center ${
          searchMethod === 'name' ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => {
          setSearchMethod('name');
          resetSearch();
        }}
        disabled={isLoading}
      >
        <Text
          className={`text-base font-semibold ${
            searchMethod === 'name' ? 'text-primary' : 'text-gray-500'
          }`}
        >
          이름
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInputField = () => {
    if (searchMethod === 'phone') {
      return (
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">휴대폰 번호</Text>
          <TextInput
            className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
            placeholder="010-0000-0000"
            placeholderTextColor="#9CA3AF"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      );
    }

    return (
      <View className="mb-5">
        <Text className="text-sm font-semibold text-gray-900 mb-2">이름</Text>
        <TextInput
          className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
          placeholder="홍길동"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>
    );
  };

  const renderResult = () => {
    if (!searchResult) return null;

    if (!searchResult.found) {
      return (
        <View className="flex-1">
          <View className="bg-gray-50 rounded-2xl p-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-2">검색 결과</Text>
            <Text className="text-base font-semibold text-error mb-2">
              일치하는 아이디를 찾을 수 없습니다.
            </Text>
            <Text className="text-sm text-gray-500">입력하신 정보를 다시 확인해주세요.</Text>
          </View>
          <TouchableOpacity
            className="h-14 rounded-xl items-center justify-center mt-2 bg-white border-2 border-primary"
            onPress={resetSearch}
          >
            <Text className="text-lg font-semibold text-primary">다시 검색하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emails = Array.isArray(searchResult.result) ? searchResult.result : [searchResult.result];

    return (
      <View className="flex-1">
        <View className="bg-gray-50 rounded-2xl p-6 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">검색 결과</Text>
          <Text className="text-sm text-gray-500 mb-4">입력하신 정보와 일치하는 아이디입니다.</Text>
          {emails.map((email, index) => (
            <View key={index} className="bg-white rounded-xl p-4 mt-2 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 text-center">{email}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          className="h-14 rounded-xl items-center justify-center mt-2 bg-primary"
          onPress={handleGoToSignIn}
        >
          <Text className="text-lg font-semibold text-white">로그인하러 가기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="h-14 rounded-xl items-center justify-center mt-2 bg-white border-2 border-primary"
          onPress={resetSearch}
        >
          <Text className="text-lg font-semibold text-primary">다시 검색하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
              <Text className="text-base text-primary">← 뒤로</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">아이디 찾기</Text>
            <Text className="text-base text-gray-500">
              가입 시 등록한 정보로 아이디를 찾을 수 있습니다
            </Text>
          </View>

          {/* Search Form or Result */}
          {!searchResult ? (
            <View className="flex-1">
              {/* Search method selector */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-900 mb-2">검색 방법 선택</Text>
                {renderSearchMethodSelector()}
              </View>

              {/* Input field based on search method */}
              {renderInputField()}

              {/* Find email button */}
              <TouchableOpacity
                className={`h-14 rounded-xl items-center justify-center mt-2 bg-primary ${isLoading ? 'opacity-60' : ''}`}
                onPress={handleFindEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-lg font-semibold text-white">아이디 찾기</Text>
                )}
              </TouchableOpacity>

              {/* Sign in link */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-sm text-gray-500">아이디가 기억나셨나요? </Text>
                <TouchableOpacity onPress={handleGoToSignIn} disabled={isLoading}>
                  <Text className="text-sm font-semibold text-primary">로그인</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            renderResult()
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FindEmailScreen;
