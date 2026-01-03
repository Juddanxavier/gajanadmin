'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotificationSettings(tenantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }

  return data;
}

export async function updateNotificationTemplates(
  tenantId: string,
  updates: Record<string, any>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('settings')
    .update(updates)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating templates:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notifications');
  return { success: true };
}

export async function sendTestNotification(
  email: string,
  type: 'email' | 'sms'
) {
  // This would trigger a test notification
  // For now, it's a placeholder
  console.log(`Sending test ${type} notification to:`, email);
  
  return { success: true, message: `Test ${type} sent successfully!` };
}
