/**
 * WelcomeScreen - Landing Page
 *
 * First screen users see when not authenticated.
 * Shows app introduction and login/signup options.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenProps } from '../../types/navigation.types';

type Props = AuthScreenProps<'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <Text style={styles.logo}>💊</Text>

        {/* App Name */}
        <Text style={styles.title}>PillCare</Text>

        {/* Tagline */}
        <Text style={styles.subtitle}>
          부모님의 건강한 복약 습관,{'\n'}
          자녀가 함께 지킵니다
        </Text>

        {/* Feature highlights */}
        <View style={styles.features}>
          <Text style={styles.feature}>✓ 알림 놓치지 않는 큰 화면</Text>
          <Text style={styles.feature}>✓ 음성으로 안내하는 복약 시간</Text>
          <Text style={styles.feature}>✓ 자녀에게 실시간 알림</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.primaryButtonText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.secondaryButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
  },
  features: {
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  feature: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});

export default WelcomeScreen;
