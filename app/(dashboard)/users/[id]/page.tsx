import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UserDetailsClient } from "@/components/users/user-details-client";
import { UserService } from "@/lib/services/user-service";

async function getUserDetails(userId: string) {
  const supabase = await createClient();
  const service = new UserService(supabase);
  const userDisplay = await service.getUserDisplay(userId);

  if (!userDisplay) return null;

  // Fetch true auth status for verification badge
  const adminClient = createAdminClient();
  const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);

  return {
    ...userDisplay,
    name: userDisplay.name || "",
    email_confirmed_at: authUser?.email_confirmed_at || null,
  };
}

async function getAllRolesAndTenants() {
  const supabase = await createClient();
  
  const [rolesData, tenantsData] = await Promise.all([
    supabase.from("roles").select("*").order("name"),
    supabase.from("tenants").select("*").eq("is_active", true).order("name"),
  ]);

  return {
    roles: rolesData.data || [],
    tenants: tenantsData.data || [],
  };
}

async function UserDetailsContent({ userId }: { userId: string }) {
  const supabase = await createClient();
  
  // Check if current user is admin
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  let isAdmin = false;
  
  if (currentUser) {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', currentUser.id);
    
    isAdmin = userRoles?.some(ur => {
      const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
      return role?.name === 'admin';
    }) || false;
  }
  
  const [user, { roles, tenants }] = await Promise.all([
    getUserDetails(userId),
    getAllRolesAndTenants(),
  ]);

  if (!user) {
    notFound();
  }

  return <UserDetailsClient user={user} roles={roles} tenants={tenants} isAdmin={isAdmin} />;
}

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <UserDetailsContent userId={id} />
    </Suspense>
  );
}
