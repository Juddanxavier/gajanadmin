/** @format */

'use client';

import * as React from 'react';
import {
  useEffect,
  useState,
  Suspense,
  useCallback,
  useTransition,
} from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { columns } from '@/components/users/columns';
import { DataTable } from '@/components/users/data-table';
import { DataTableToolbar } from '@/components/users/data-table-toolbar';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { DeleteUserDialog } from '@/components/users/delete-user-dialog';
import { BulkAssignRoleDialog } from '@/components/users/bulk-assign-role-dialog';
import { InviteLinkDialog } from '@/components/users/invite-link-dialog';
import {
  getUsers,
  getRoles,
  getTenants,
  deleteUser,
  getCurrentUserId,
  getPermissions,
} from '@/app/(dashboard)/users/actions';
import type { UserDisplay, UserTableFilters, Role, Tenant } from '@/lib/types';
import { RowSelectionState, SortingState } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

function UsersPageContent() {
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined,
  );
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Pagination & Sorting state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState<UserTableFilters>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDisplay | null>(null);
  const [deletingUsers, setDeletingUsers] = useState<UserDisplay[]>([]);
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);

  // Load Reference Data
  const loadRefData = useCallback(async () => {
    try {
      const [rolesRes, tenantsRes, userIdRes, permsRes] = await Promise.all([
        getRoles(),
        getTenants(),
        getCurrentUserId(),
        getPermissions(),
      ]);
      // actions return raw arrays for these helpers (wait, check implementation)
      // Implementation: actions return raw arrays. Correct.
      setRoles(rolesRes || []);
      setTenants(tenantsRes || []);
      setCurrentUserId(userIdRes || undefined);
      setIsGlobalAdmin(permsRes?.isGlobalAdmin || false);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }, []);

  // Load Users Data
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const sortBy = sorting[0]
        ? { id: sorting[0].id, desc: sorting[0].desc }
        : undefined;
      const result = await getUsers(pageIndex, pageSize, filters, sortBy);

      if (result.success) {
        setUsers(result.data.data);
        setPageCount(result.data.pageCount);
      } else {
        toast.error('Failed to load users', { description: result.error });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Unexpected error loading users');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, filters, sorting]);

  // Initial Load
  useEffect(() => {
    loadRefData();
  }, [loadRefData]);

  // Data Refresh Trigger
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    loadRefData();
    loadUsers();
  };

  const handleTabChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      role: value === 'all' ? undefined : value,
    }));
    setPageIndex(0);
    setRowSelection({});
  };

  // --- Handlers ---

  const handleCreateSuccess = (savedUser?: UserDisplay) => {
    if (savedUser) {
      // Optimistic Update
      setUsers((prev) => {
        if (editingUser) {
          return prev.map((u) => (u.id === savedUser.id ? savedUser : u));
        } else {
          return [savedUser, ...prev];
        }
      });
      // Toast handled in dialog for create/update
    } else {
      // Fallback for bulk ops or if no user returned
      loadUsers();
    }

    setIsCreateDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteSuccess = () => {
    // Optimistic Delete
    const deletedIds = new Set(deletingUsers.map((u) => u.id));
    setUsers((prev) => prev.filter((u) => !deletedIds.has(u.id)));

    setDeletingUsers([]);
    setRowSelection({});
    toast.success('User(s) deleted successfully');
  };

  const handleBulkDelete = () => {
    const selected = users.filter((_, idx) => rowSelection[idx]);
    setDeletingUsers(selected);
  };

  const handleBulkAssign = () => {
    setIsBulkAssignDialogOpen(true);
  };

  const selectedCount = Object.keys(rowSelection).length;
  const selectedUserIds = users
    .filter((_, idx) => rowSelection[idx])
    .map((u) => u.id);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
          <p className='text-muted-foreground mt-1'>
            Manage team members, assign roles, and control access permissions
            across your organization.
          </p>
        </div>
      </div>

      <Tabs
        defaultValue='all'
        onValueChange={handleTabChange}
        className='w-full'>
        <TabsList className='mb-4'>
          <TabsTrigger value='all'>All Users</TabsTrigger>
          <TabsTrigger value='admin'>Admins</TabsTrigger>
          <TabsTrigger value='staff'>Staff</TabsTrigger>
          <TabsTrigger value='customer'>Customers</TabsTrigger>
        </TabsList>

        <DataTable
          columns={columns}
          data={users}
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={({ pageIndex: p, pageSize: s }) => {
            setPageIndex(p);
            setPageSize(s);
          }}
          onSortingChange={setSorting}
          onRowSelectionChange={setRowSelection}
          rowSelection={rowSelection}
          isLoading={isLoading}
          onAddNew={() => setIsCreateDialogOpen(true)}
          // Toolbar props
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={handleRefresh}
          onInvite={() => setIsInviteLinkDialogOpen(true)}
          onBulkDelete={selectedCount > 0 ? handleBulkDelete : undefined}
          onBulkAssignRole={selectedCount > 0 ? handleBulkAssign : undefined}
          roles={roles}
          tenants={tenants}
          isRefreshing={isLoading}
          meta={{
            onEdit: (user: UserDisplay) => setEditingUser(user),
            onDelete: (user: UserDisplay) => setDeletingUsers([user]),
            currentUserId: currentUserId,
          }}
        />
      </Tabs>

      {/* Dialogs */}
      <UserFormDialog
        open={isCreateDialogOpen || !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingUser(null);
          }
        }}
        user={editingUser}
        roles={roles}
        tenants={tenants}
        isGlobalAdmin={isGlobalAdmin}
        onSuccess={handleCreateSuccess}
      />

      <DeleteUserDialog
        open={deletingUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeletingUsers([]);
        }}
        users={deletingUsers}
        onSuccess={handleDeleteSuccess}
      />

      <BulkAssignRoleDialog
        open={isBulkAssignDialogOpen}
        onOpenChange={setIsBulkAssignDialogOpen}
        userIds={selectedUserIds}
        roles={roles}
        onSuccess={handleCreateSuccess} // Reusing success handler
      />

      <InviteLinkDialog
        open={isInviteLinkDialogOpen}
        onOpenChange={setIsInviteLinkDialogOpen}
        isGlobalAdmin={isGlobalAdmin}
        roles={roles}
        tenants={tenants}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className='p-8 text-center'>Loading User Management...</div>
      }>
      <UsersPageContent />
    </Suspense>
  );
}
