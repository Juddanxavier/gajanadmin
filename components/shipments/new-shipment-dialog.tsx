/** @format */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Package,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  createShipment,
  getTenantsForSelection,
  getUsersForSelectionAction,
} from '@/app/(dashboard)/shipments/actions';
import { detectCarrierLocal } from '@/lib/detection/carrier-matcher';
import { getCarriers } from '@/app/(dashboard)/shipments/carrier-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Step 1: Tracking & Carrier
const step1Schema = z.object({
  carrierTrackingCode: z.string().min(1, 'Tracking code is required'),
  carrierId: z.string().min(1, 'Carrier is required'),
  tenantId: z.string().optional(),
});

// Step 2: Details Checks (Manual validation helper)
const step2NewUserSchema = z.object({
  customerName: z.string().min(1, 'Customer Name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  assignmentMode: z.literal('new'),
});

const step2ExistingUserSchema = z.object({
  assignedUserId: z.string().min(1, 'Please select a user'),
  notes: z.string().optional(),
  assignmentMode: z.literal('user'),
});

// Step 3: Amount
const step3Schema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount is required'),
});

// Full Schema for final submission
const formSchema = step1Schema
  .extend({
    // Step 2
    assignedUserId: z.string().optional(),
    assignmentMode: z.enum(['new', 'user']).default('new'),
    customerName: z.string().optional(),
    customerEmail: z.string().optional(),
    customerPhone: z.string().optional(),
    notes: z.string().optional(),

    // Step 3
    amount: z.coerce.number().min(0.01, 'Amount is required'),
  })
  .superRefine((data, ctx) => {
    if (data.assignmentMode === 'new') {
      if (!data.customerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Customer Name is required',
          path: ['customerName'],
        });
      }
      if (!data.customerEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Customer Email is required',
          path: ['customerEmail'],
        });
      } else if (!z.string().email().safeParse(data.customerEmail).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid email',
          path: ['customerEmail'],
        });
      }
    } else {
      if (!data.assignedUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a user',
          path: ['assignedUserId'],
        });
      }
    }
  });

type FormData = z.infer<typeof formSchema>;

interface NewShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticUpdate?: (data: any) => void;
}

export function NewShipmentDialog({
  open,
  onOpenChange,
  onOptimisticUpdate,
}: NewShipmentDialogProps) {
  const [step, setStep] = useState(1);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [debugError, setDebugError] = useState<string>('');

  // Combobox & Detect States
  const [openCarrier, setOpenCarrier] = useState(false);
  const [openUser, setOpenUser] = useState(false); // New state for User Combobox
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      carrierTrackingCode: '',
      carrierId: '',
      tenantId: '',
      assignedUserId: '',
      assignmentMode: 'new',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
      amount: 0,
    },
  });

  const tenantId = form.watch('tenantId');
  const assignmentMode = form.watch('assignmentMode');

  // Load data on open
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Watch tenant change to fetch users
  useEffect(() => {
    if (tenantId) {
      loadUsers(tenantId);
    }
  }, [tenantId]);

  function handleDetectCarrier() {
    const trackingCode = form.getValues('carrierTrackingCode');
    if (!trackingCode) {
      toast.error('Enter a tracking code first');
      return;
    }

    setIsDetecting(true);
    // Simulate short delay for UX
    setTimeout(() => {
      const detected = detectCarrierLocal(trackingCode);

      if (detected) {
        // Check if carrier exists in our list
        const exists = carriers.some((c) => c.code === detected.code);

        if (exists) {
          form.setValue('carrierId', detected.code, {
            shouldValidate: true,
            shouldDirty: true,
          });
          toast.success(`Detected: ${detected.name}`);
        } else {
          // Try loose matching by name if code differs (e.g. 'ups' vs 'dhl')
          // But our detector uses same codes as database hopefully.
          // If not found by code, we can't select it easily.
          toast.warning(
            `Detected ${detected.name} but it's not in the carrier list.`,
          );
        }
      } else {
        toast.warning('Could not auto-detect carrier. Please select properly.');
      }
      setIsDetecting(false);
    }, 500);
  }

  async function loadData() {
    // Load carriers
    const carriersResult = await getCarriers();
    if (carriersResult.success && carriersResult.data) {
      setCarriers(carriersResult.data);
    }

    // Load tenants (for global admins OR single tenant for regular admins)
    const result = await getTenantsForSelection();

    if (!result.success) {
      console.error('Tenant Load Error:', result.error);
      setDebugError(result.error || 'Unknown Error');
    } else {
      const tenantsList = result.tenants;
      // Always set tenants, even if empty (though actions.ts ensures non-empty)
      if (tenantsList) {
        setTenants(tenantsList);

        if (tenantsList.length === 1) {
          form.setValue('tenantId', tenantsList[0].id);
          loadUsers(tenantsList[0].id);
        }
      }
    }
  }

  async function loadUsers(tid: string) {
    const userList = await getUsersForSelectionAction(tid);
    setUsers(userList);
  }

  async function onSubmit(data: FormData) {
    // Final check for step 3 requirement if somehow bypassed
    if (!data.amount || data.amount <= 0) {
      form.setError('amount', { message: 'Amount is required' });
      return;
    }

    // Optimistic Update
    onOptimisticUpdate?.(data);
    if (tenants.length > 0 && !data.tenantId) {
      toast.error('Please select a tenant');
      return;
    }
    // Validation handled by zod superRefine

    setIsSubmitting(true);
    try {
      const result = await createShipment(data);
      if (result.success) {
        toast.success('Shipment created!');
        onOpenChange(false);
        router.refresh();
        form.reset();
        setStep(1);
      } else {
        toast.error(result.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleNext = async () => {
    const values = form.getValues();
    if (step === 1) {
      const result = step1Schema.safeParse(values);
      if (result.success) {
        setStep(2);
      } else {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as any;
          if (path) form.setError(path, { message: issue.message });
        });
      }
    } else if (step === 2) {
      const mode = form.getValues('assignmentMode');
      let result;

      if (mode === 'new') {
        result = step2NewUserSchema.safeParse({
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone,
          notes: values.notes,
          assignmentMode: 'new',
        });
      } else {
        result = step2ExistingUserSchema.safeParse({
          assignedUserId: values.assignedUserId,
          notes: values.notes,
          assignmentMode: 'user',
        });
      }

      if (result.success) {
        setStep(3);
      } else {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as any;
          if (path) form.setError(path, { message: issue.message });
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Prevent form submission on Enter key for steps 1 and 2
      if (step < 3) {
        e.preventDefault();
        handleNext();
      }
      // For step 3, let it submit
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>New Shipment</DialogTitle>
          <DialogDescription className='hidden'>
            Create a new shipment
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className='flex items-center space-x-2 mb-4'>
          <div
            className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}
          />
          <div
            className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}
          />
          <div
            className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}
          />
        </div>
        <div className='flex justify-between text-xs text-muted-foreground -mt-3 mb-4 px-1'>
          <span className={step >= 1 ? 'font-medium text-foreground' : ''}>
            Tracking
          </span>
          <span className={step >= 2 ? 'font-medium text-foreground' : ''}>
            Details
          </span>
          <span className={step >= 3 ? 'font-medium text-foreground' : ''}>
            Review
          </span>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
            onKeyDown={handleKeyDown}>
            {/* STEP 1: TRACKING */}
            {step === 1 && (
              <div className='space-y-4'>
                {/* Global Admin Tenant Selection */}
                {tenants.length > 0 && (
                  <FormField
                    control={form.control}
                    name='tenantId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            loadUsers(val); // Trigger load on change
                          }}
                          value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select Tenant' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='carrierTrackingCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Code</FormLabel>
                      <div className='flex gap-2'>
                        <FormControl>
                          <Input placeholder='1Z999...' {...field} />
                        </FormControl>
                        <Button
                          type='button'
                          variant='secondary'
                          disabled={
                            isDetecting || !field.value || carriers.length === 0
                          }
                          onClick={handleDetectCarrier}>
                          {isDetecting ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Sparkles className='h-4 w-4' />
                          )}
                          <span className='ml-2'>
                            {carriers.length === 0 ? 'Loading...' : 'Detect'}
                          </span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='carrierId'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Carrier</FormLabel>
                      <Popover open={openCarrier} onOpenChange={setOpenCarrier}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              role='combobox'
                              aria-expanded={openCarrier}
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground',
                              )}>
                              {field.value
                                ? carriers.find((c) => c.code === field.value)
                                    ?.name_en
                                : 'Select carrier...'}
                              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-[450px] p-0'>
                          <Command>
                            <CommandInput placeholder='Search carrier...' />
                            <CommandList>
                              <CommandEmpty>No carrier found.</CommandEmpty>
                              <CommandGroup>
                                {carriers.map((c) => (
                                  <CommandItem
                                    value={c.name_en}
                                    keywords={[c.code, c.name_en]}
                                    key={c.code}
                                    onSelect={() => {
                                      form.setValue('carrierId', c.code);
                                      setOpenCarrier(false);
                                    }}>
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        c.code === field.value
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {c.name_en}
                                    <span className='ml-auto text-xs text-muted-foreground'>
                                      {c.code}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='assignmentMode'
                  render={({ field }) => (
                    <FormItem className='space-y-3'>
                      <FormControl>
                        <Tabs
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className='w-full'>
                          <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='new'>New Customer</TabsTrigger>
                            <TabsTrigger value='user'>
                              Existing User
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {assignmentMode === 'user' ? (
                  <FormField
                    control={form.control}
                    name='assignedUserId'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>Select User</FormLabel>
                        <Popover open={openUser} onOpenChange={setOpenUser}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                aria-expanded={openUser}
                                className={cn(
                                  'w-full justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}>
                                {field.value
                                  ? users.find((u) => u.id === field.value)
                                      ?.full_name ||
                                    users.find((u) => u.id === field.value)
                                      ?.email
                                  : 'Select user...'}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-[450px] p-0'>
                            <Command>
                              <CommandInput placeholder='Search user...' />
                              <CommandList>
                                <CommandEmpty>No user found.</CommandEmpty>
                                <CommandGroup>
                                  {users.map((u) => (
                                    <CommandItem
                                      value={u.full_name || u.email}
                                      keywords={[u.email]}
                                      key={u.id}
                                      onSelect={() => {
                                        form.setValue('assignedUserId', u.id);
                                        setOpenUser(false);
                                      }}>
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          u.id === field.value
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                        )}
                                      />
                                      {u.full_name || u.email}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name='customerName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name</FormLabel>
                          <FormControl>
                            <Input placeholder='John Doe' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='customerEmail'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type='email'
                              placeholder='john@example.com'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='customerPhone'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type='tel'
                              placeholder='+123...'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder='Internal notes...' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* STEP 3: AMOUNT */}
            {step === 3 && (
              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Required)</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='p-4 bg-gray-50 rounded text-sm text-gray-600'>
                  <h4 className='font-bold mb-2'>Review</h4>
                  <p>
                    Carrier:{' '}
                    {
                      carriers.find(
                        (c) => c.code === form.getValues('carrierId'),
                      )?.name_en
                    }
                  </p>
                  <p>Tracking: {form.getValues('carrierTrackingCode')}</p>
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className='flex justify-between pt-4'>
              {step > 1 ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button type='button' onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Create Shipment
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
