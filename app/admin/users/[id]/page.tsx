import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UserDetailsClient } from "@/components/users/user-details-client";

async function getUserDetails(userId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get user from auth
  const { data: { user: authUser }, error: authError } = await adminClient.auth.admin.getUserById(userId);
  
  if (authError || !authUser) {
    return null;
  }

  // Get user roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles!inner(id, name, description)")
    .eq("user_id", userId);

  // Get user tenants
  const { data: userTenants } = await supabase
    .from("user_tenants")
    .select("tenants!inner(id, name, code), is_default")
    .eq("user_id", userId);

  return {
    id: userId,
    email: authUser.email || "",
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
    phone: authUser.phone || authUser.user_metadata?.phone || null,
    created_at: authUser.created_at,
    last_sign_in_at: authUser.last_sign_in_at || null,
    email_confirmed_at: authUser.email_confirmed_at || null,
    roles: userRoles?.map(ur => Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as any[] || [],
    tenants: userTenants?.map(ut => ({ ...(Array.isArray(ut.tenants) ? ut.tenants[0] : ut.tenants), is_default: ut.is_default })) as any[] || [],
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
