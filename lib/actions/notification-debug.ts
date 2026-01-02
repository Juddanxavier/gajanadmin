"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function sendTestNotification() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();
  
  const payload = {
    user_id: user.id,
    title: "Test Notification",
    message: `Test notification sent at ${new Date().toLocaleTimeString()}`,
    type: "info",
    is_read: false,
    metadata: { test: true }
  };

  const { data, error } = await adminClient
    .from("in_app_notifications")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Test notification error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
