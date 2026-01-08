'use server';

import { revalidatePath } from 'next/cache';
import { ProfileService } from '@/lib/services/profile-service';
import type {
  ActionResponse,
  UpdateProfileInput,
  ChangePasswordInput,
  UserProfile,
  ProfileStats,
} from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

/**
 * Get current user's profile
 */
export async function getCurrentProfileAction(): Promise<ActionResponse<UserProfile>> {
  try {
    const profile = await ProfileService.getCurrentProfile();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error in getCurrentProfileAction:', error);
    return { success: false, error: 'Failed to fetch profile' };
  }
}

/**
 * Update user profile
 */
export async function updateProfileAction(
  updates: UpdateProfileInput
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await ProfileService.updateProfile(user.id, updates);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update profile' };
    }

    revalidatePath('/profile');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error in updateProfileAction:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Upload avatar
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResponse<{ url: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('avatar') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await ProfileService.uploadAvatar(user.id, file);

    if (!result.success || !result.url) {
      return { success: false, error: result.error || 'Failed to upload avatar' };
    }

    revalidatePath('/profile');
    return { success: true, data: { url: result.url } };
  } catch (error) {
    console.error('Error in uploadAvatarAction:', error);
    return { success: false, error: 'Failed to upload avatar' };
  }
}

/**
 * Get profile statistics
 */
export async function getProfileStatsAction(): Promise<ActionResponse<ProfileStats>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const stats = await ProfileService.getProfileStats(user.id);

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getProfileStatsAction:', error);
    return { success: false, error: 'Failed to fetch profile stats' };
  }
}

/**
 * Change password
 */
export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    if (input.new_password !== input.confirm_password) {
      return { success: false, error: 'Passwords do not match' };
    }

    if (input.new_password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const result = await ProfileService.changePassword(
      input.current_password,
      input.new_password
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to change password' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error in changePasswordAction:', error);
    return { success: false, error: 'Failed to change password' };
  }
}

/**
 * Get user roles and context
 */
export async function getUserRolesAndContext(): Promise<ActionResponse<{ isGlobalAdmin: boolean; roles: string[]; tenants: any[]; isEmailVerified: boolean }>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // 1. Check Global Admin
        const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id });
        const isGlobalAdmin = isAdmin === true;

        // 2. Get Roles
        const { data: roles } = await supabase.rpc('get_user_roles', { user_uuid: user.id });
        const roleNames = roles ? roles.map((r: any) => r.role_name) : [];

        // 3. Get Tenants
        const { data: tenants } = await supabase.rpc('get_user_tenants', { user_uuid: user.id });
        
        return {
            success: true,
            data: {
                isGlobalAdmin,
                roles: roleNames,
                tenants: tenants || [],
                isEmailVerified: !!user.email_confirmed_at
            }
        };
    } catch (error) {
        console.error('Error in getUserRolesAndContext:', error);
        return { success: false, error: 'Failed to fetch context' };
    }
}
