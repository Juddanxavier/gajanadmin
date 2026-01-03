"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { bulkAssignRole } from "@/app/(dashboard)/users/actions";
import type { Role } from "@/lib/types";

interface BulkAssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: string[];
  roles: Role[];
  onSuccess: () => void;
}

export function BulkAssignRoleDialog({
  open,
  onOpenChange,
  userIds,
  roles,
  onSuccess,
}: BulkAssignRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const handleAssign = async () => {
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      const result = await bulkAssignRole(userIds, selectedRole);
      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess();
      onOpenChange(false);
      setSelectedRole("");
    } catch (error) {
      console.error("Error assigning role:", error);
      alert(error instanceof Error ? error.message : "Failed to assign role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role to Users</DialogTitle>
          <DialogDescription>
            Assign a role to {userIds.length} selected user(s). This will add the
            role to their existing roles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={isLoading || !selectedRole}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
