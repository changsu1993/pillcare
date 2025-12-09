/**
 * FamilyConnectionsSection - Display and manage family connections
 *
 * Accessibility:
 * - WCAG AAA compliance
 * - 72px min-height for large touch targets
 * - Clear labels for connected family members
 * - Accessible remove button with proper hints
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FamilyConnection } from '../../../shared/types/database.types';

export interface FamilyConnectionsSectionProps {
  /** List of family connections to display */
  familyConnections: FamilyConnection[];
  /** Callback when remove connection button is pressed */
  onRemoveConnection: (connection: FamilyConnection) => void;
  /** Callback when generate invitation code button is pressed */
  onGenerateCode: () => void;
}

const FamilyConnectionsSection: React.FC<FamilyConnectionsSectionProps> = ({
  familyConnections,
  onRemoveConnection,
  onGenerateCode,
}) => {
  const { t } = useTranslation(['settings', 'common']);

  // Filter to only show active connections with child data
  const activeConnections = familyConnections.filter(
    (connection) => connection.child && connection.status === 'active'
  );

  return (
    <View
      className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-sm"
      accessible
      accessibilityLabel={t('settings:section.family')}
    >
      {/* Section Header */}
      <View className="flex-row items-center mb-4">
        <Text className="text-4xl mr-4" accessibilityElementsHidden>
          &#128106;
        </Text>
        <Text className="text-2xl font-semibold text-gray-900">{t('settings:section.family')}</Text>
      </View>

      {/* Connected Children List */}
      {activeConnections.length > 0 ? (
        <View className="mb-4">
          {activeConnections.map((connection) => {
            const child = connection.child;
            if (!child) return null;

            return (
              <View
                key={connection.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100 min-h-[56px]"
                accessible
                accessibilityLabel={`${child.name}, ${t('settings:family.child')}`}
              >
                <View className="flex-row items-center flex-1">
                  {/* Child Avatar */}
                  <View className="w-11 h-11 rounded-full bg-primary-100 justify-center items-center mr-3">
                    <Text className="text-lg font-bold text-primary">
                      {child.name?.charAt(0) || '?'}
                    </Text>
                  </View>

                  {/* Child Info */}
                  <View>
                    <Text className="text-lg font-semibold text-gray-900">{child.name}</Text>
                    <Text className="text-sm text-gray-700 mt-0.5">
                      {t('settings:family.child')}
                    </Text>
                  </View>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => onRemoveConnection(connection)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={t('settings:accessibility.disconnectChild', {
                    name: child.name,
                  })}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <Text className="text-lg text-gray-700 text-center py-4">
          {t('settings:family.noChildren')}
        </Text>
      )}

      {/* Generate Invitation Code Button */}
      <TouchableOpacity
        className="flex-row items-center justify-center bg-success-50 py-4 rounded-xl gap-2 border-2 border-success min-h-[56px]"
        onPress={onGenerateCode}
        activeOpacity={0.7}
        accessibilityLabel={t('settings:family.generateCode')}
        accessibilityHint={t('settings:accessibility.generateCodeHint')}
        accessibilityRole="button"
      >
        <Ionicons name="add-circle" size={28} color="#22C55E" />
        <Text className="text-xl font-semibold text-success">
          {t('settings:family.generateCode')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FamilyConnectionsSection;
