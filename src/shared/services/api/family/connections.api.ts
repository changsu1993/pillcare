/**
 * Family Connections API
 *
 * CRUD operations for family connections between parents and children.
 */

import { supabase, getCurrentUserId } from '../common';
import type { FamilyConnection, User } from '../../../types/database.types';

/**
 * Get all family connections for current user
 * Returns connections where user is either parent or child
 */
export const getFamilyConnections = async (): Promise<FamilyConnection[]> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      *,
      parent:parent_id(id, name, email, phone_number),
      child:child_id(id, name, email, phone_number)
    `
    )
    .eq('status', 'active')
    .or(`parent_id.eq.${userId},child_id.eq.${userId}`);

  if (error) throw error;
  return data || [];
};

/**
 * Check if current user has any active family connections
 */
export const hasActiveConnection = async (): Promise<boolean> => {
  const connections = await getFamilyConnections();
  return connections.length > 0;
};

/**
 * Remove a family connection
 */
export const removeFamilyConnection = async (connectionId: string): Promise<void> => {
  const { error } = await supabase
    .from('family_connections')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId);

  if (error) throw error;
};

/**
 * Get connected children for parent user
 */
export const getConnectedChildren = async (): Promise<User[]> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      child:child_id(id, name, email, phone_number, role, created_at, updated_at)
    `
    )
    .eq('parent_id', userId)
    .eq('status', 'active');

  if (error) throw error;

  // Extract child users from result
  const children: User[] = [];
  data?.forEach((item) => {
    const child = item.child;
    if (child) {
      if (Array.isArray(child)) {
        children.push(...(child as User[]));
      } else {
        children.push(child as unknown as User);
      }
    }
  });

  return children;
};

/**
 * Get connected parent's info for child user
 * @returns Parent user info or null if not connected
 */
export const getConnectedParent = async (): Promise<User | null> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('family_connections')
    .select(
      `
      parent:parent_id(id, name, email, phone_number, role, created_at, updated_at)
    `
    )
    .eq('child_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw error;
  }

  // Supabase relational query result processing
  const parent = data?.parent;
  if (!parent) return null;

  // Return first element if array
  if (Array.isArray(parent)) {
    return (parent[0] as User) || null;
  }

  return parent as unknown as User;
};
