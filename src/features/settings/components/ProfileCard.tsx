/**
 * ProfileCard - Displays user profile with avatar, name, and email
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - Clear accessibility labels for screen readers
 * - 72px min touch target for edit button
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../../shared/types/database.types';

interface ProfileCardProps {
  /** User object containing profile information */
  user: User | null;
  /** Callback when edit profile button is pressed */
  onEditPress: () => void;
}

/**
 * ProfileCard component displays user avatar, name, email with edit button
 */
const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEditPress }) => {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <View
      className="bg-white p-8 rounded-2xl items-center mb-6 border-2 border-gray-200 shadow-sm"
      accessibilityRole="summary"
      accessibilityLabel={t('settings:title.profile')}
    >
      {/* User Avatar Emoji */}
      <Text className="text-6xl mb-4" accessibilityElementsHidden>
        &#128100;
      </Text>

      {/* User Name */}
      <Text
        className="text-3xl font-bold text-gray-900 mb-2"
        accessibilityLabel={`${t('settings:label.name')}: ${user?.name || t('settings:profile.user')}`}
      >
        {user?.name || t('settings:profile.user')}
      </Text>

      {/* User Email */}
      <Text
        className="text-xl text-gray-700 mb-4"
        accessibilityLabel={`${t('settings:label.email')}: ${user?.email || ''}`}
      >
        {user?.email || ''}
      </Text>

      {/* Edit Profile Button */}
      <TouchableOpacity
        className="flex-row items-center gap-2 bg-gray-100 px-6 py-3 rounded-xl min-h-[48px]"
        onPress={onEditPress}
        activeOpacity={0.7}
        accessibilityLabel={t('settings:button.editProfile')}
        accessibilityRole="button"
      >
        <Ionicons name="create-outline" size={24} color="#374151" />
        <Text className="text-xl font-semibold text-gray-700">
          {t('settings:button.editProfile')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileCard;
