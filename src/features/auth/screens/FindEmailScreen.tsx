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
import { useTranslation } from 'react-i18next';
import { findEmailByPhone, findEmailByName } from '../../../shared/services/supabase';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'FindEmail'>;

type SearchMethod = 'phone' | 'name';

interface SearchResult {
  found: boolean;
  result?: string | string[];
}

const FindEmailScreen = ({ navigation }: Props) => {
  const { t } = useTranslation(['auth', 'common']);
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const handleFindEmail = async (): Promise<void> => {
    // Validation
    if (searchMethod === 'phone' && !phoneNumber.trim()) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.emptyPhone'));
      return;
    }

    if (searchMethod === 'name' && !name.trim()) {
      Alert.alert(t('auth:error.inputError'), t('auth:error.emptyName'));
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
      Alert.alert(t('common:error.generic'), t('auth:error.findEmailError'));
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
          {t('auth:findEmail.byPhone')}
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
          {t('auth:findEmail.byName')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInputField = () => {
    if (searchMethod === 'phone') {
      return (
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            {t('auth:label.phoneNumber')}
          </Text>
          <TextInput
            className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
            placeholder={t('auth:placeholder.phoneSearchExample')}
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
        <Text className="text-sm font-semibold text-gray-900 mb-2">{t('auth:label.name')}</Text>
        <TextInput
          className="h-[52px] border-2 border-gray-200 rounded-xl px-4 text-base text-gray-900 bg-white"
          placeholder={t('auth:placeholder.nameExample')}
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
            <Text className="text-xl font-bold text-gray-900 mb-2">
              {t('auth:findEmail.searchResult')}
            </Text>
            <Text className="text-base font-semibold text-error mb-2">
              {t('auth:findEmail.noResult')}
            </Text>
            <Text className="text-sm text-gray-500">{t('auth:findEmail.checkInfo')}</Text>
          </View>
          <TouchableOpacity
            className="h-14 rounded-xl items-center justify-center mt-2 bg-white border-2 border-primary"
            onPress={resetSearch}
          >
            <Text className="text-lg font-semibold text-primary">
              {t('auth:button.searchAgain')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emails = Array.isArray(searchResult.result) ? searchResult.result : [searchResult.result];

    return (
      <View className="flex-1">
        <View className="bg-gray-50 rounded-2xl p-6 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {t('auth:findEmail.searchResult')}
          </Text>
          <Text className="text-sm text-gray-500 mb-4">{t('auth:findEmail.matchingInfo')}</Text>
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
          <Text className="text-lg font-semibold text-white">{t('auth:button.goToSignIn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="h-14 rounded-xl items-center justify-center mt-2 bg-white border-2 border-primary"
          onPress={resetSearch}
        >
          <Text className="text-lg font-semibold text-primary">{t('auth:button.searchAgain')}</Text>
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
              <Text className="text-base text-primary">{`← ${t('auth:nav.back')}`}</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-gray-900 mb-2">
              {t('auth:title.findEmail')}
            </Text>
            <Text className="text-base text-gray-500">{t('auth:subtitle.findEmailDesc')}</Text>
          </View>

          {/* Search Form or Result */}
          {!searchResult ? (
            <View className="flex-1">
              {/* Search method selector */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  {t('auth:label.searchMethod')}
                </Text>
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
                  <Text className="text-lg font-semibold text-white">
                    {t('auth:button.findEmail')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign in link */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-sm text-gray-500">{t('auth:link.rememberEmail')} </Text>
                <TouchableOpacity onPress={handleGoToSignIn} disabled={isLoading}>
                  <Text className="text-sm font-semibold text-primary">
                    {t('auth:button.signIn')}
                  </Text>
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
