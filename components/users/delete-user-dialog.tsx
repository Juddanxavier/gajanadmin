"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { deleteUser, bulkDeleteUsers } from "@/app/admin/users/actions";
import type { UserDisplay } from "@/lib/types";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserDisplay[];
  onSuccess: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  users,
  onSuccess,
}: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isBulk = users.length > 1;

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      if (isBulk) {
        const result = await bulkDeleteUsers(users.map((u) => u.id));
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await deleteUser(users[0].id);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting user(s):", error);
      alert(error instanceof Error ? error.message : "Failed to delete user(s)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk ? (
              <>
                This action cannot be undone. This will permanently delete{" "}
                <strong>{users.length} users</strong> and remove their data from
                the system.
              </>
            ) : (
              <>
                This action cannot be undone. This will permanently delete the
                user <strong>{users[0]?.email}</strong> and remove their data
                from the system.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
