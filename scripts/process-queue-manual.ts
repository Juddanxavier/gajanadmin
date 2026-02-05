/** @format */

import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '../lib/services/notification-service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function processPendingItems() {
  console.log('⚙️ Manually Processing Pending Queue Items...');

  const service = new NotificationService(supabase);

  // 1. Fetch Pending
  const { data: items, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  if (!items || items.length === 0) {
    console.log('No pending items to process.');
    return;
  }

  console.log(`Found ${items.length} pending items.`);

  // 2. Process Loop
  for (const item of items) {
    console.log(`Processing ${item.id} (${item.channel})...`);

    try {
      // Mark processing
      await supabase
        .from('notification_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      const result = await service.processQueueItem(item);

      if (result.success) {
        console.log('   ✅ Success');
        await supabase
          .from('notification_queue')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', item.id);
      } else {
        console.error('   ❌ Failed:', result.error);
        await supabase
          .from('notification_queue')
          .update({
            status: 'failed',
            error_message: result.error,
            retry_count: (item.retry_count || 0) + 1,
          })
          .eq('id', item.id);
      }
    } catch (err: any) {
      console.error('   ❌ Critical Error:', err.message);
    }
  }
  console.log('Done.');
}

processPendingItems().catch(console.error);
