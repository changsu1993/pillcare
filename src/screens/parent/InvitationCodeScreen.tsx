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
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ParentScreenProps } from '../../types/navigation.types';
import { generateInvitationCode, getConnectedChildren } from '../../services/api';
import { User } from '../../types/database.types';

type Props = ParentScreenProps<'InvitationCode'>;

const InvitationCodeScreen: React.FC<Props> = ({ navigation }) => {
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

  const handleRefreshCode = () => {
    Alert.alert(
      '새 코드 생성',
      '기존 코드는 무효화됩니다.\n새로운 코드를 생성하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '생성',
          onPress: loadData,
        },
      ]
    );
  };

  // Format code with spaces for readability (123 456)
  const formatCode = (code: string): string => {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>코드 생성 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadData}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>가족 연결 방법</Text>
          <Text style={styles.instructionText}>
            1. 아래 코드를 자녀분께 알려주세요{'\n'}
            2. 자녀분이 앱에서 코드를 입력하면{'\n'}
            3. 가족으로 연결됩니다
          </Text>
        </View>

        {/* Code Display */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>초대 코드</Text>
          <Text
            style={styles.codeText}
            accessibilityLabel={`초대 코드 ${invitationCode?.split('').join(' ')}`}
          >
            {invitationCode ? formatCode(invitationCode) : '------'}
          </Text>
          <View style={styles.expiryContainer}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.expiryText}>24시간 후 만료됩니다</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.copyButton]}
            onPress={handleCopyCode}
            activeOpacity={0.7}
            accessibilityLabel="코드 복사하기"
            accessibilityRole="button"
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.buttonText}>
              {copied ? '복사됨' : '코드 복사'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={handleShareCode}
            activeOpacity={0.7}
            accessibilityLabel="코드 공유하기"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>공유하기</Text>
          </TouchableOpacity>
        </View>

        {/* Connected Children List */}
        {connectedChildren.length > 0 && (
          <View style={styles.connectedSection}>
            <Text style={styles.connectedTitle}>연결된 자녀</Text>
            {connectedChildren.map((child) => (
              <View key={child.id} style={styles.childItem}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>
                    {child.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childEmail}>{child.email}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingText: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 64,
    color: '#EF4444',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 20,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  retryButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 18,
    color: '#4B5563',
    lineHeight: 28,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  codeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 8,
    marginBottom: 16,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryText: {
    fontSize: 16,
    color: '#6B7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyButton: {
    backgroundColor: '#22C55E',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connectedSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  connectedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  childInfo: {
    flex: 1,
    marginLeft: 16,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  childEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default InvitationCodeScreen;
