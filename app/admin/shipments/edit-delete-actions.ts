'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { isAdmin, hasRole } from '@/lib/utils/permissions';

// Helper to check permission
async function checkAdminOrStaff() {
  const isUserAdmin = await isAdmin();
  const isUserStaff = await hasRole('staff');
  return isUserAdmin || isUserStaff;
}

export async function updateShipmentAction(
  id: string,
  data: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    carrier_id?: string;
    amount?: number;
  }
) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) return { success: false, error: 'Permission denied' };

    const supabase = createAdminClient();

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.carrier_id !== undefined) updates.carrier_id = data.carrier_id;

    // Update customer_details
    if (data.customer_name || data.customer_email || data.customer_phone) {
      const { data: current } = await supabase
        .from('shipments')
        .select('customer_details')
        .eq('id', id)
        .single();

      updates.customer_details = {
        ...(current?.customer_details || {}),
        ...(data.customer_name && { name: data.customer_name }),
        ...(data.customer_email && { email: data.customer_email }),
        ...(data.customer_phone && { phone: data.customer_phone }),
      };
    }

    // Update invoice_details
    if (data.amount !== undefined) {
      const { data: current } = await supabase
        .from('shipments')
        .select('invoice_details')
        .eq('id', id)
        .single();

      updates.invoice_details = {
        ...(current?.invoice_details || {}),
        amount: data.amount,
      };
    }

    const { error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/shipments');
    revalidatePath(`/admin/shipments/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error('Update Shipment Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteShipmentAction(id: string) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) return { success: false, error: 'Permission denied' };

    const supabase = createAdminClient();

    // Soft delete
    const { error } = await supabase
      .from('shipments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/shipments');

    return { success: true };
  } catch (error: any) {
    console.error('Delete Shipment Error:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteShipmentsAction(ids: string[]) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) return { success: false, error: 'Permission denied' };

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('shipments')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;

    revalidatePath('/admin/shipments');

    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error('Bulk Delete Error:', error);
    return { success: false, error: error.message };
  }
}
