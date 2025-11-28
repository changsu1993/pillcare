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
  StyleSheet,
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
    <View style={styles.methodSelector}>
      <TouchableOpacity
        style={[styles.methodButton, searchMethod === 'phone' && styles.methodButtonActive]}
        onPress={() => {
          setSearchMethod('phone');
          resetSearch();
        }}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.methodButtonText,
            searchMethod === 'phone' && styles.methodButtonTextActive,
          ]}
        >
          휴대폰 번호
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.methodButton, searchMethod === 'name' && styles.methodButtonActive]}
        onPress={() => {
          setSearchMethod('name');
          resetSearch();
        }}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.methodButtonText,
            searchMethod === 'name' && styles.methodButtonTextActive,
          ]}
        >
          이름
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInputField = () => {
    if (searchMethod === 'phone') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>휴대폰 번호</Text>
          <TextInput
            style={styles.input}
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
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
        <View style={styles.resultContainer}>
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>검색 결과</Text>
            <Text style={styles.noResultText}>일치하는 아이디를 찾을 수 없습니다.</Text>
            <Text style={styles.noResultHint}>입력하신 정보를 다시 확인해주세요.</Text>
          </View>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetSearch}>
            <Text style={styles.secondaryButtonText}>다시 검색하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emails = Array.isArray(searchResult.result) ? searchResult.result : [searchResult.result];

    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>검색 결과</Text>
          <Text style={styles.resultDescription}>입력하신 정보와 일치하는 아이디입니다.</Text>
          {emails.map((email, index) => (
            <View key={index} style={styles.emailItem}>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleGoToSignIn}>
          <Text style={styles.primaryButtonText}>로그인하러 가기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetSearch}>
          <Text style={styles.secondaryButtonText}>다시 검색하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← 뒤로</Text>
            </TouchableOpacity>
            <Text style={styles.title}>아이디 찾기</Text>
            <Text style={styles.subtitle}>가입 시 등록한 정보로 아이디를 찾을 수 있습니다</Text>
          </View>

          {/* Search Form or Result */}
          {!searchResult ? (
            <View style={styles.form}>
              {/* Search method selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>검색 방법 선택</Text>
                {renderSearchMethodSelector()}
              </View>

              {/* Input field based on search method */}
              {renderInputField()}

              {/* Find email button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleFindEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>아이디 찾기</Text>
                )}
              </TouchableOpacity>

              {/* Sign in link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>아이디가 기억나셨나요? </Text>
                <TouchableOpacity onPress={handleGoToSignIn} disabled={isLoading}>
                  <Text style={styles.link}>로그인</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  methodButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodButtonTextActive: {
    color: '#3B82F6',
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  resultContainer: {
    flex: 1,
  },
  resultBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  emailItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  noResultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  noResultHint: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default FindEmailScreen;
