'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/permissions';
import type { ActionResponse } from '@/lib/types';

/**
 * Invite a new user via email (admin only)
 * This will send an invite email using Supabase Auth with your configured email provider
 */
export async function inviteUserByEmailAction(
  email: string,
  redirectTo?: string
): Promise<ActionResponse<{ message: string }>> {
  console.log('[inviteUserByEmailAction] Starting with email:', email);
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[inviteUserByEmailAction] No authenticated user');
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    console.log('[inviteUserByEmailAction] Current user:', user.id);

    // Check if current user is admin
    const userIsAdmin = await isAdmin();
    console.log('[inviteUserByEmailAction] Is admin:', userIsAdmin);
    
    if (!userIsAdmin) {
      console.error('[inviteUserByEmailAction] User is not admin');
      return { success: false, error: 'Only admins can invite users' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('[inviteUserByEmailAction] Invalid email:', email);
      return { success: false, error: 'Invalid email address' };
    }

    const redirectUrl = redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/dashboard`;
    console.log('[inviteUserByEmailAction] Redirect URL:', redirectUrl);

    // Invite user using admin client - this will send an email
    const adminClient = createAdminClient();
    console.log('[inviteUserByEmailAction] Calling inviteUserByEmail...');
    
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('[inviteUserByEmailAction] Supabase error:', error);
      return { success: false, error: `Failed to send invite: ${error.message}` };
    }

    console.log('[inviteUserByEmailAction] Success! User invited:', data?.user?.id);

    return { 
      success: true, 
      data: { 
        message: `Invitation email sent to ${email}. The user will receive an email with a link to set up their account.` 
      } 
    };
  } catch (error) {
    console.error('[inviteUserByEmailAction] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to invite user' 
    };
  }
}

/**
 * Generate a manual invite link (for copying/sharing manually)
 */
export async function generateInviteLinkAction(
  email: string,
  redirectTo?: string
): Promise<ActionResponse<{ link: string }>> {
  console.log('[generateInviteLinkAction] Starting with email:', email);
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[generateInviteLinkAction] No authenticated user');
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    console.log('[generateInviteLinkAction] Current user:', user.id);

    // Check if current user is admin
    const userIsAdmin = await isAdmin();
    console.log('[generateInviteLinkAction] Is admin:', userIsAdmin);
    
    if (!userIsAdmin) {
      console.error('[generateInviteLinkAction] User is not admin');
      return { success: false, error: 'Only admins can generate invite links' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('[generateInviteLinkAction] Invalid email:', email);
      return { success: false, error: 'Invalid email address' };
    }

    const redirectUrl = redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/dashboard`;
    console.log('[generateInviteLinkAction] Redirect URL:', redirectUrl);

    // Generate invite link using admin client
    const adminClient = createAdminClient();
    console.log('[generateInviteLinkAction] Calling generateLink...');
    
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('[generateInviteLinkAction] Supabase error:', error);
      return { success: false, error: `Failed to generate link: ${error.message}` };
    }

    if (!data.properties?.action_link) {
      console.error('[generateInviteLinkAction] No action_link in response');
      return { success: false, error: 'Failed to generate invite link - no link returned' };
    }

    console.log('[generateInviteLinkAction] Success! Link generated');

    return { 
      success: true, 
      data: { link: data.properties.action_link } 
    };
  } catch (error) {
    console.error('[generateInviteLinkAction] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate invite link' 
    };
  }
}
