import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface EmptyStateProps {
  onAddUser?: () => void;
}

export function EmptyState({ onAddUser }: EmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>No users found</EmptyTitle>
        <EmptyDescription>
          You haven't added any users yet. Get started by creating your first
          user.
        </EmptyDescription>
      </EmptyHeader>
      {onAddUser && (
        <EmptyContent>
          <Button onClick={onAddUser}>Add User</Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
