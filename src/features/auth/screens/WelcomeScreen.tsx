/**
 * WelcomeScreen - Landing Page
 *
 * First screen users see when not authenticated.
 * Shows app introduction and login/signup options.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenProps } from '../../../shared/types/navigation.types';

type Props = AuthScreenProps<'Welcome'>;

const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo/Icon */}
        <Text className="text-[80px] mb-6">💊</Text>

        {/* App Name */}
        <Text className="text-4xl font-bold text-gray-900 mb-3">PillCare</Text>

        {/* Tagline */}
        <Text className="text-lg text-gray-500 text-center leading-relaxed mb-12">
          부모님의 건강한 복약 습관,{'\n'}
          자녀가 함께 지킵니다
        </Text>

        {/* Feature highlights */}
        <View className="items-start mb-12">
          <Text className="text-base text-gray-900 mb-3 leading-6">✓ 알림 놓치지 않는 큰 화면</Text>
          <Text className="text-base text-gray-900 mb-3 leading-6">
            ✓ 음성으로 안내하는 복약 시간
          </Text>
          <Text className="text-base text-gray-900 leading-6">✓ 자녀에게 실시간 알림</Text>
        </View>

        {/* Action buttons */}
        <View className="w-full gap-3">
          <TouchableOpacity
            className="w-full h-14 rounded-xl items-center justify-center bg-primary"
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text className="text-lg font-semibold text-white">시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full h-14 rounded-xl items-center justify-center bg-white border-2 border-gray-200"
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text className="text-lg font-semibold text-gray-900">로그인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
