import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/permissions';

export default async function TestInvitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let adminCheck = false;
  let adminClientTest = 'Not tested';
  
  if (user) {
    adminCheck = await isAdmin();
    
    try {
      const adminClient = createAdminClient();
      // Test if admin client works
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) {
        adminClientTest = `Error: ${error.message}`;
      } else {
        adminClientTest = 'Success - Admin client working';
      }
    } catch (error) {
      adminClientTest = `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Invite Link Debug Page</h1>
      
      <div className="space-y-2 bg-muted p-4 rounded">
        <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
        <p><strong>User Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Is Admin:</strong> {adminCheck ? 'Yes ✅' : 'No ❌'}</p>
        <p><strong>Admin Client Test:</strong> {adminClientTest}</p>
      </div>
      
      <div className="space-y-2 bg-muted p-4 rounded">
        <p><strong>Environment Variables:</strong></p>
        <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p>NEXT_PUBLIC_SITE_URL: {process.env.NEXT_PUBLIC_SITE_URL || 'Not set (will use localhost)'}</p>
      </div>
      
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
        <p className="font-bold">Next Steps:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make sure you're logged in as an admin</li>
          <li>Check that SUPABASE_SERVICE_ROLE_KEY is set in your .env.local</li>
          <li>Try the invite link feature and check browser console for detailed logs</li>
          <li>Check your server terminal for [inviteUserByEmailAction] logs</li>
        </ol>
      </div>
    </div>
  );
}
