import { supabase } from '../common';
import type { User } from '../../../types/database.types';

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

  if (error) throw error;
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
