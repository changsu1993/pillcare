/**
 * Family Invitations API
 *
 * Invitation code generation and redemption for family connections.
 */

import { supabase, getCurrentUserId } from '../common';
import type { User } from '../../../types/database.types';

/**
 * Generate invitation code (Parent creates code for children to enter)
 * @returns Generated 6-digit invitation code
 */
export const generateInvitationCode = async (): Promise<string> => {
  const userId = await getCurrentUserId();

  // Check if there's already a pending invitation
  const { data: existingInvitation } = await supabase
    .from('family_connections')
    .select('invitation_code, invitation_expires_at')
    .eq('parent_id', userId)
    .eq('status', 'pending')
    .gt('invitation_expires_at', new Date().toISOString())
    .single();

  // If valid invitation exists, return existing code
  if (existingInvitation?.invitation_code) {
    return existingInvitation.invitation_code;
  }

  // Generate new 6-digit code
  const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure code is unique
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('family_connections')
      .select('id')
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .single();

    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique code');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

  const { error } = await supabase.from('family_connections').insert({
    parent_id: userId,
    child_id: null, // Will be filled when child enters code
    invitation_code: code,
    invitation_expires_at: expiresAt.toISOString(),
    status: 'pending',
  });

  if (error) throw error;
  return code;
};

/**
 * Connect with invitation code (Child enters code from parent)
 * @param code 6-digit invitation code
 * @returns Connection result with parent name if successful
 */
export const connectWithCode = async (
  code: string
): Promise<{
  success: boolean;
  parentName?: string;
  error?: string;
}> => {
  const userId = await getCurrentUserId();

  // Find pending invitation by code
  const { data: invitation, error: findError } = await supabase
    .from('family_connections')
    .select(
      `
      *,
      parent:parent_id(id, name, email)
    `
    )
    .eq('invitation_code', code.trim())
    .eq('status', 'pending')
    .gt('invitation_expires_at', new Date().toISOString())
    .single();

  if (findError || !invitation) {
    return {
      success: false,
      error: 'Invalid or expired invitation code',
    };
  }

  // Check if already connected to this parent
  const { data: existingConnection } = await supabase
    .from('family_connections')
    .select('id')
    .eq('parent_id', invitation.parent_id)
    .eq('child_id', userId)
    .eq('status', 'active')
    .single();

  if (existingConnection) {
    return {
      success: false,
      error: 'Already connected to this parent',
    };
  }

  // Update invitation with child ID and activate
  const { error: updateError } = await supabase
    .from('family_connections')
    .update({
      child_id: userId,
      status: 'active',
      invitation_code: null, // Clear code after use
    })
    .eq('id', invitation.id);

  if (updateError) {
    return { success: false, error: 'Failed to connect' };
  }

  // Extract parent name from joined data
  const parent = invitation.parent as unknown as User | null;
  const parentName = parent?.name || 'Unknown';

  return {
    success: true,
    parentName,
  };
};
