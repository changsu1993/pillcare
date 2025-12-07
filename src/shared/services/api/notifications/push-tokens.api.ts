/**
 * Push Tokens API
 *
 * Functions for managing push notification tokens.
 */

import { supabase, getCurrentUserId } from '../common';
import type { ChildPushTokenInfo } from '../../../types/database.types';

/**
 * Save push token for current user
 * @param token - Expo Push Token
 */
export const savePushToken = async (token: string): Promise<void> => {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('users')
    .update({
      push_token: token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
  if (__DEV__) {
    console.log('푸시 토큰 저장 완료');
  }
};

/**
 * Get push tokens for connected children of a parent
 * @param parentId - Parent user ID
 * @returns Array of child push token info
 */
export const getChildrenPushTokens = async (parentId: string): Promise<ChildPushTokenInfo[]> => {
  const { data, error } = await supabase.rpc('get_children_push_tokens', {
    parent_user_id: parentId,
  });

  if (error) {
    console.error('자녀 푸시 토큰 조회 실패:', error);
    return [];
  }

  return data || [];
};
