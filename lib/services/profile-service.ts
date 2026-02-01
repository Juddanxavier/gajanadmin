/** @format */

import { createClient } from '@/lib/supabase/server';
import type {
  UserProfile,
  UpdateProfileInput,
  ProfileStats,
} from '@/lib/types';

export class ProfileService {
  /**
   * Get user profile from profiles table
   */
  static async getCurrentProfile(): Promise<UserProfile | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name || null,
      bio: null, // Not in schema, can add if needed
      phone: profile.phone || null,
      avatar_url: profile.avatar_url || null,
      company: profile.company || null,
      address: profile.address || null,
      city: profile.city || null,
      country: profile.country || null,
      timezone: 'Asia/Kolkata', // Not in schema
      theme: 'system', // Not in schema
      created_at: profile.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: UpdateProfileInput,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.display_name,
        phone: updates.phone,
        company: updates.company,
        address: updates.address,
        city: updates.city,
        country: updates.country,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    // Sync display_name to auth.users metadata for global access (e.g. Navbar)
    if (updates.display_name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: updates.display_name },
      });

      if (authError) {
        console.warn('Failed to sync auth metadata:', authError);
        // We don't fail the whole operation if metadata sync fails, but we log it.
      }
    }

    return { success: true };
  }

  /**
   * Upload avatar to Supabase Storage
   */
  static async uploadAvatar(
    userId: string,
    file: File,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = await createClient();

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Only JPEG, PNG, and WebP images are allowed',
      };
    }

    // Upload to storage
    const fileName = `${userId}/${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(data.path);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with avatar URL:', updateError);
      return { success: false, error: updateError.message };
    }

    // Sync to auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (authError) {
      console.warn('Failed to sync avatar to auth metadata:', authError);
    }

    return { success: true, url: publicUrl };
  }

  /**
   * Get profile statistics
   */
  static async getProfileStats(userId: string): Promise<ProfileStats> {
    const supabase = await createClient();

    // Get user creation date
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    // Get counts
    const [shipmentsCount, leadsCount] = await Promise.all([
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId),
    ]);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      total_shipments: shipmentsCount.count || 0,
      total_leads: leadsCount.count || 0,
      member_since: profile?.created_at || new Date().toISOString(),
      last_active: user?.last_sign_in_at || null,
    };
  }

  /**
   * Change password
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Verify current password by attempting to sign in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return { success: false, error: 'User not found' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  }
}
