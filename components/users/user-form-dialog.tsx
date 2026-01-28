/** @format */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  createUser,
  updateUser,
  getUserDefaultTenant,
} from '@/app/(dashboard)/users/actions';
import type { Role, Tenant, UserDisplay, RoleName } from '@/lib/types';
import { toast } from 'sonner';
import {
  parsePhoneNumberFromString,
  CountryCode,
  getCountryCallingCode,
} from 'libphonenumber-js';

// Helper to get country code from tenant
const getTenantCountry = (
  tenantId: string | null | undefined,
  tenants: Tenant[],
): CountryCode => {
  if (!tenantId || tenantId === 'none') return 'US';
  const tenant = tenants.find((t) => t.id === tenantId);
  // Assuming tenant.code is ISO 2 char code (e.g. IN, US)
  return (tenant?.code?.toUpperCase() as CountryCode) || 'US';
};

// Schema Definition with Refinement
const createFormSchema = (tenants: Tenant[]) =>
  z
    .object({
      email: z.string().email('Invalid email address'),
      name: z.string().optional(),
      phone: z.string().optional(),
      password: z.string().optional(),
      role: z.enum(['admin', 'staff', 'customer']),
      tenant: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.phone) {
        const countryCode = getTenantCountry(data.tenant, tenants);
        const phoneNumber = parsePhoneNumberFromString(data.phone, countryCode);
        if (!phoneNumber || !phoneNumber.isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid phone number for ${countryCode}`,
            path: ['phone'],
          });
        }
      }
    });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDisplay | null;
  roles: Role[];
  tenants: Tenant[];
  onSuccess: (user?: UserDisplay) => void;
  isGlobalAdmin?: boolean;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  tenants,
  onSuccess,
  isGlobalAdmin = false,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const [isLoading, setIsLoading] = useState(false);

  // Memoize schema to depend on tenants
  const formSchema = createFormSchema(tenants);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      password: '',
      role: 'customer',
      tenant: null,
    },
  });

  // Calculate default values based on props
  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          email: user.email,
          name: user.name || '',
          phone: user.phone || '',
          password: '',
          role: (user.roles[0]?.name as RoleName) || 'customer',
          tenant: user.tenants[0]?.id || null, // Assuming single tenant for simplicty in UI
        });
      } else {
        // Validation: New User
        // Fetch default tenant
        getUserDefaultTenant().then((tid) => {
          form.reset({
            email: '',
            name: '',
            phone: '',
            password: '',
            role: !isGlobalAdmin ? 'customer' : 'customer',
            tenant: tid || null,
          });
        });
      }
    }
  }, [open, user, form, isGlobalAdmin]);

  // Auto-fill phone prefix based on tenant
  const selectedTenantId = form.watch('tenant');

  useEffect(() => {
    // Only auto-fill for new users or if phone is empty
    const currentPhone = form.getValues('phone');
    if (open && !user && (!currentPhone || currentPhone === '+')) {
      const countryCode = getTenantCountry(selectedTenantId, tenants);
      try {
        const callingCode = getCountryCallingCode(countryCode);
        if (callingCode) {
          form.setValue('phone', `+${callingCode}`);
        }
      } catch (err) {
        // Fallback or ignore invalid country code from tenant
      }
    }
  }, [selectedTenantId, open, user, form, tenants]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Format phone to E.164 before sending
      let formattedPhone = values.phone;
      if (values.phone) {
        const countryCode = getTenantCountry(values.tenant, tenants);
        const phoneNumber = parsePhoneNumberFromString(
          values.phone,
          countryCode,
        );
        if (phoneNumber) {
          formattedPhone = phoneNumber.format('E.164');
        }
      }

      if (isEdit && user) {
        // Update
        const valuesToUpdate = {
          email: values.email !== user.email ? values.email : undefined,
          name: values.name || undefined,
          phone: formattedPhone || undefined,
          roles: [values.role],
          tenants: values.tenant ? [values.tenant] : undefined,
        };

        const res = await updateUser(user.id, valuesToUpdate);

        if (!res.success) throw new Error(res.error);
        toast.success('User updated successfully');

        // Construct optimistic user for update
        const roleObj = roles.find((r) => r.name === values.role) || {
          id: values.role,
          name: values.role,
          description: null,
          created_at: '',
          updated_at: '',
        };
        const tenantObj = values.tenant
          ? tenants.find((t) => t.id === values.tenant)
          : null;

        const optimisticUser: UserDisplay = {
          ...user,
          email: values.email, // If changed
          name: values.name || user.name,
          phone: formattedPhone || user.phone,
          roles: [roleObj],
          tenants: tenantObj ? [tenantObj] : [],
        };
        onSuccess(optimisticUser);
      } else {
        // Create
        if (!values.password) {
          form.setError('password', { message: 'Password is required' });
          setIsLoading(false);
          return;
        }

        const res = await createUser({
          email: values.email,
          password: values.password,
          name: values.name || undefined,
          phone: formattedPhone || undefined,
          role: values.role,
          tenant: values.tenant || null,
        });

        if (!res.success) throw new Error(res.error);
        toast.success('User created successfully');
        onSuccess(res.data);
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user's details and permissions."
              : 'Add a new user to the system.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='email@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder='+1234567890' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEdit && (
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••••'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isGlobalAdmin && (
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='admin'>Admin</SelectItem>
                          <SelectItem value='staff'>Staff</SelectItem>
                          <SelectItem value='customer'>Customer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='tenant'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || 'none'}
                        defaultValue={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select tenant' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>None (Global)</SelectItem>
                          {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.code} {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isLoading}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEdit ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
