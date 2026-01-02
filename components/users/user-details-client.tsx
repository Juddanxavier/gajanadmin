"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Shield, 
  Clock,
  CheckCircle2,
  Package,
  Users
} from "lucide-react";
import Link from "next/link";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserActions } from "@/components/users/user-actions";
import type { UserDisplay, Role, Tenant } from "@/lib/types";

interface UserDetailsClientProps {
  user: UserDisplay;
  roles: Role[];
  tenants: Tenant[];
  isAdmin?: boolean;
}

export function UserDetailsClient({ user, roles, tenants, isAdmin = false }: UserDetailsClientProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSuccess = () => {
    setIsEditDialogOpen(false);
    // Use router.refresh for optimistic UI update instead of full reload
    router.refresh();
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
              <p className="text-muted-foreground">
                View and manage user information
              </p>
            </div>
          </div>
          <UserActions 
            userId={user.id} 
            userEmail={user.email}
            userName={user.name}
            onEdit={() => setIsEditDialogOpen(true)}
            isAdmin={isAdmin}
          />
        </div>

        <Separator />

        {/* User Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{user.email}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {user.email_confirmed_at ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="text-amber-600">Not verified</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phone</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* @ts-ignore */}
                {user.phone || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {/* @ts-ignore */}
                {user.phone ? "Contact number" : "Not provided"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sign In</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {user.last_sign_in_at
                  ? formatDate(user.last_sign_in_at)
                  : "No sign-in activity"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(user.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Roles and Tenants */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Roles</CardTitle>
              </div>
              <CardDescription>
                User permissions and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant={
                      role.name === "admin"
                        ? "destructive"
                        : role.name === "staff"
                        ? "default"
                        : "secondary"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </Badge>
                ))}
              </div>
              {user.roles.length === 0 && (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Tenants</CardTitle>
              </div>
              <CardDescription>
                Organization and workspace access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.tenants.map((tenant: any) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.code}</p>
                    </div>
                    {tenant.is_default && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {user.tenants.length === 0 && (
                <p className="text-sm text-muted-foreground">No tenants assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Related Data */}
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="shipments" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Shipments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Leads</CardTitle>
                <CardDescription>
                  Manage leads and prospects associated with this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Leads Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Lead management functionality will be added here. You'll be able to
                    view, create, and manage leads associated with this user.
                  </p>
                  <Button disabled>Add Lead (Coming Soon)</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipments</CardTitle>
                <CardDescription>
                  Track shipments and deliveries for this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Shipments Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Shipment tracking functionality will be added here. You'll be able to
                    view, create, and manage shipments associated with this user.
                  </p>
                  <Button disabled>Add Shipment (Coming Soon)</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        roles={roles}
        tenants={tenants}
        onSuccess={handleSuccess}
      />
    </>
  );
}
