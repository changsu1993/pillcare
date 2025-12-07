/**
 * Common API Client Utilities
 *
 * Shared authentication and client helpers for API modules.
 */

import { supabase } from '../../supabase';

/**
 * Get current authenticated user ID
 * @throws Error if not authenticated
 */
export const getCurrentUserId = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
};

/**
 * Get current authenticated user
 * @throws Error if not authenticated
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
};

// Re-export supabase for use in API modules
export { supabase };
