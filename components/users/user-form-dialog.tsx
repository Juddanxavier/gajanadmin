"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Lock, Shield } from "lucide-react";
import { createUser, updateUser, getUserDefaultTenant } from "@/app/(dashboard)/users/actions";
import type { Role, Tenant, UserDisplay } from "@/lib/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDisplay | null;
  roles: Role[];
  tenants: Tenant[];
  onSuccess: (user?: UserDisplay) => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  tenants,
  onSuccess,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultTenantId, setDefaultTenantId] = useState<string | null>(null);

  // Get customer role ID
  const customerRole = roles.find(r => r.name === "customer");
  
  const [formData, setFormData] = useState({
    email: user?.email || "",
    name: user?.name || "",
    phone: user?.phone || "",
    password: "",
    role: user?.roles[0]?.name || customerRole?.name || "",
    tenant: user?.tenants[0]?.id || "",
  });

  // Load default tenant for new users
  useEffect(() => {
    if (!isEdit && open) {
      getUserDefaultTenant().then(tenantId => {
        if (tenantId) {
          setDefaultTenantId(tenantId);
          setFormData(prev => ({ ...prev, tenant: tenantId }));
        }
      });
    }
  }, [isEdit, open, tenants]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          email: user.email,
          name: user.name || "",
          phone: user.phone || "",
          password: "",
          role: user.roles[0]?.name || customerRole?.name || "",
          tenant: user.tenants[0]?.id || "",
        });
      } else {
        setFormData({
          email: "",
          name: "",
          phone: "",
          password: "",
          role: customerRole?.name || "",
          tenant: defaultTenantId || tenants[0]?.id || "",
        });
      }
      setError(null);
    }
  }, [open, user, customerRole, defaultTenantId, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEdit && user) {
        const result = await updateUser(user.id, {
          email: formData.email !== user.email ? formData.email : undefined,
          name: formData.name || undefined,
          phone: formData.phone || undefined,
          roles: [formData.role],
          // tenants: [formData.tenant], // Don't update tenant
        });

        if (!result.success) {
          throw new Error(result.error);
        }
        
        onSuccess(result.data);
      } else {
        if (!formData.password) {
          throw new Error("Password is required");
        }

        const result = await createUser({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          phone: formData.phone || undefined,
          role: formData.role,
          tenant: formData.tenant,
        });

        if (!result.success) {
          throw new Error(result.error);
        }
        
        onSuccess(result.data);
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update user details, role, and tenant assignment."
              : "Add a new user to the system with a role and tenant access."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid gap-6 py-4">
            
            {/* Section: Personal Information */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <User className="h-4 w-4" />
                    Personal Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="John Doe"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+1 234 567 890"
                        disabled={isLoading}
                      />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
            </div>

            {/* Section: Account Security (Create Only) */}
            {!isEdit && (
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <Lock className="h-4 w-4" />
                        Account Security
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </div>
                </div>
            )}

            {/* Section: Access Control */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <Shield className="h-4 w-4" />
                    Access Control
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </div>
            </div>

          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
