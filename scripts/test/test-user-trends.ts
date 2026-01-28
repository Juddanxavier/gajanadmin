/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserTrends() {
  console.log('Testing user trends data...\n');

  const days = 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  console.log('Fetching users created after:', startDate.toISOString());

  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`\nFound ${data?.length || 0} users in the last ${days} days`);

  if (data && data.length > 0) {
    console.log('\nSample data:');
    data.slice(0, 5).forEach((p) => {
      console.log('  -', p.created_at);
    });
  }

  // Group by date
  const trends: Record<string, { total: number }> = {};

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    trends[dateStr] = { total: 0 };
  }

  data?.forEach((p) => {
    const dateStr = p.created_at.split('T')[0];
    if (trends[dateStr]) {
      trends[dateStr].total++;
    }
  });

  // Convert to array and sort
  const result = Object.entries(trends)
    .map(([date, stats]) => ({
      date,
      ...stats,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log('\nTrends data (first 10 days):');
  result.slice(0, 10).forEach((item) => {
    console.log(`  ${item.date}: ${item.total} users`);
  });

  console.log('\nTotal data points:', result.length);
  console.log('Non-zero days:', result.filter((r) => r.total > 0).length);
}

testUserTrends().catch(console.error);
