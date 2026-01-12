/** @format */

'use client';

import * as React from 'react';
import {
  useEffect,
  useState,
  useOptimistic,
  Suspense,
  startTransition,
  useCallback,
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
  getAvailableRoles,
  getAvailableTenants,
  getUserDefaultTenant,
} from '@/app/(dashboard)/users/actions';
import type { UserDisplay, UserTableFilters, Role, Tenant } from '@/lib/types';
import { RowSelectionState, SortingState } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';

function UsersPageContent() {
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [optimisticUsers, setOptimisticUsers] = useOptimistic(
    users,
    (state, newUsers: UserDisplay[]) => newUsers
  );
  // Removed stats
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const [isPending, startTransition] = React.useTransition();

  // Load users when filters, pagination, or sorting changes
  useEffect(() => {
    startTransition(() => {
      loadUsers();
    });
  }, [loadUsers]);

  const loadData = async () => {
    try {
      const [rolesData, tenantsData] = await Promise.all([
        getAvailableRoles(),
        getAvailableTenants(),
      ]);

      setRoles(rolesData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadUsers = useCallback(
    async (silent = false) => {
      const isInitial = users.length === 0;
      if (isInitial && !silent) setIsLoading(true);

      try {
        const sortBy = sorting[0]
          ? { id: sorting[0].id, desc: sorting[0].desc }
          : undefined;

        const result = await getUsers(pageIndex, pageSize, filters, sortBy);

        if (result.success) {
          setUsers(result.data.data);
          setPageCount(result.data.pageCount);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [users.length, pageIndex, pageSize, filters, sorting]
  );

  const handleRefresh = () => {
    loadData();
    loadUsers(false);
  };

  const handleTabChange = (value: string) => {
    // If 'all', clear role filter. Else set role filter.
    // Note: backend expects role name in filters.role
    setFilters((prev) => ({
      ...prev,
      role: value === 'all' ? undefined : value,
    }));
    setPageIndex(0);
  };

  // ... (Keep existing Success handlers: handleSuccess, handleSuccessOptimistic, handleEditSuccess, etc.)
  const handleSuccess = (user?: UserDisplay) => {
    setRowSelection({});
    if (user) {
      if (editingUser) {
        handleEditSuccess(user);
      } else {
        startTransition(() => {
          setOptimisticUsers([user, ...optimisticUsers]);
        });
        setTimeout(() => {
          loadData();
          loadUsers(true);
        }, 100);
      }
    } else {
      loadData();
      loadUsers(true);
    }
  };

  const handleEdit = (user: UserDisplay) => {
    setEditingUser(user);
  };

  const handleEditSuccess = (updatedUser: UserDisplay) => {
    const updatedUsers = optimisticUsers.map((u) =>
      u.id === updatedUser.id ? updatedUser : u
    );
    startTransition(() => {
      setOptimisticUsers(updatedUsers);
    });
    setEditingUser(null);
    setTimeout(() => {
      loadUsers(true);
    }, 100);
  };

  const handleDelete = (user: UserDisplay) => {
    setDeletingUsers([user]);
  };

  const handleDeleteSuccess = () => {
    const deletedIds = deletingUsers.map((u) => u.id);
    const updatedUsers = optimisticUsers.filter(
      (u) => !deletedIds.includes(u.id)
    );
    startTransition(() => {
      setOptimisticUsers(updatedUsers);
    });
    setDeletingUsers([]);
    setRowSelection({});
    setTimeout(() => {
      loadData();
      loadUsers(true);
    }, 100);
  };

  const handleBulkDelete = () => {
    const selectedUsers = optimisticUsers.filter(
      (_, index) => rowSelection[index]
    );
    setDeletingUsers(selectedUsers);
  };

  const handleBulkAssignRole = () => {
    setIsBulkAssignDialogOpen(true);
  };

  const selectedUserIds = optimisticUsers
    .filter((_, index) => rowSelection[index])
    .map((u) => u.id);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
          <p className='text-muted-foreground'>
            Manage users, roles, and tenant assignments
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='icon' onClick={handleRefresh}>
            <RefreshCw className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            onClick={() => setIsInviteLinkDialogOpen(true)}>
            <LinkIcon className='mr-2 h-4 w-4' />
            Invite Link
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Add User
          </Button>
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

        <Card className='p-4'>
          <DataTableToolbar
            filters={filters}
            onFiltersChange={setFilters}
            selectedCount={selectedCount}
            onBulkDelete={selectedCount > 0 ? handleBulkDelete : undefined}
            onBulkAssignRole={
              selectedCount > 0 ? handleBulkAssignRole : undefined
            }
            roles={roles}
            tenants={tenants}
          />

          <DataTable
            columns={columns}
            data={optimisticUsers}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPaginationChange={({ pageIndex, pageSize }) => {
              setPageIndex(pageIndex);
              setPageSize(pageSize);
            }}
            onSortingChange={setSorting}
            onRowSelectionChange={setRowSelection}
            rowSelection={rowSelection}
            isLoading={isLoading || isPending}
            onAddNew={() => setIsCreateDialogOpen(true)}
            meta={{
              onEdit: handleEdit,
              onDelete: handleDelete,
            }}
          />
        </Card>
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
        onSuccess={handleSuccess}
      />

      <DeleteUserDialog
        open={deletingUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeletingUsers([]);
        }}
        users={deletingUsers}
        onSuccess={handleDeleteSuccess} // Fixed: uses proper success handler
      />

      <BulkAssignRoleDialog
        open={isBulkAssignDialogOpen}
        onOpenChange={setIsBulkAssignDialogOpen}
        userIds={selectedUserIds}
        roles={roles}
        onSuccess={handleSuccess}
      />

      <InviteLinkDialog
        open={isInviteLinkDialogOpen}
        onOpenChange={setIsInviteLinkDialogOpen}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen'>
          Loading...
        </div>
      }>
      <UsersPageContent />
    </Suspense>
  );
}
