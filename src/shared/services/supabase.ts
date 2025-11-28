/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client for PillCare app.
 * Make sure to set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * in your .env file (copy from .env.example)
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found. Please create .env file from .env.example');
}

/**
 * Supabase client instance
 *
 * Features:
 * - Automatic session persistence (AsyncStorage)
 * - Auto-refresh tokens
 * - Offline support (cached session)
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  metadata: Record<string, any> = {}
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Request password reset email
 * Supabase will send an email with a reset link
 */
export const resetPasswordForEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'pillcare://reset-password',
  });
  if (error) throw error;
};

/**
 * Update user password (after reset token verification)
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
};

/**
 * Mask email for privacy (e.g., "test@example.com" -> "t**t@example.com")
 */
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return '****@****.***';
  }

  const [localPart, domain] = email.split('@');

  if (!localPart || localPart.length === 0) {
    return `****@${domain || '****.***'}`;
  }

  const maskedLocal =
    localPart.length > 2
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : localPart.length === 2
        ? localPart[0] + '*'
        : '*';

  return `${maskedLocal}@${domain}`;
};

/**
 * Escape SQL wildcard characters to prevent injection
 */
const escapeSqlWildcards = (str: string): string => {
  return str.replace(/[%_\\]/g, '\\$&');
};

/**
 * Find email by phone number
 * Returns masked email for privacy (e.g., "t***@example.com")
 */
export const findEmailByPhone = async (
  phoneNumber: string
): Promise<{ found: boolean; maskedEmail?: string }> => {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('phone_number', phoneNumber)
    .single();

  if (error || !data) {
    return { found: false };
  }

  return { found: true, maskedEmail: maskEmail(data.email) };
};

/**
 * Find email by name
 * Returns list of masked emails matching the name
 */
export const findEmailByName = async (
  name: string
): Promise<{ found: boolean; maskedEmails?: string[] }> => {
  const escapedName = escapeSqlWildcards(name);
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .ilike('name', `%${escapedName}%`)
    .limit(5);

  if (error || !data || data.length === 0) {
    return { found: false };
  }

  const maskedEmails = data.map((user) => maskEmail(user.email));

  return { found: true, maskedEmails };
};

export default supabase;
