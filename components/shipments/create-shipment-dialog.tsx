/** @format */

'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  createShipmentAction,
  searchUsers,
  searchCarriers,
} from '@/app/(dashboard)/shipments/actions';
import { getAllTenants } from '@/app/(dashboard)/settings/actions';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  X,
  Truck,
  User,
  Package,
  DollarSign,
  Mail,
  Phone,
  CheckCircle2,
  Building2,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { detectCarrier } from '@/lib/utils/carrier-detection';

// Schema definition
const formSchema = z.object({
  tracking_number: z
    .string()
    .min(3, 'Tracking number must be at least 3 characters'),
  carrier_code: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z
    .string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  customer_phone: z.string().optional(),
  amount: z.coerce.number().min(0, 'Amount must be positive').optional(),
  tenant_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateShipmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateShipmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);

  // Fetch Tenants (Only works for admins)
  useEffect(() => {
    if (open) {
      getAllTenants().then((res) => {
        if (res.success && res.data) {
          setTenants(res.data);
        }
      });
    }
  }, [open]);

  // User Search State
  const [openUserCombobox, setOpenUserCombobox] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchMessage, setUserSearchMessage] = useState('');

  // Carrier Search State
  const [openCarrierCombobox, setOpenCarrierCombobox] = useState(false);
  const [carrierSearchResults, setCarrierSearchResults] = useState<any[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<{
    code: string;
    name: string;
    label?: string;
  } | null>(null);
  const [isSearchingCarrier, setIsSearchingCarrier] = useState(false);

  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect carrier when tracking number changes
  const handleTrackingChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    const value = e.target.value;
    onChange(value);

    // Clear previous timeout
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    // Debounce detection (500ms)
    detectionTimeoutRef.current = setTimeout(() => {
      if (value.length > 5) {
        const detected = detectCarrier(value);
        if (detected.length > 0) {
          const bestMatch = detected[0];

          // Update if the detected carrier is different from current
          if (selectedCarrier?.code !== bestMatch.code) {
            setSelectedCarrier({ code: bestMatch.code, name: bestMatch.name });
            form.setValue('carrier_code', bestMatch.code);
            toast.info(`Detected Carrier: ${bestMatch.name}`);
          }
        }
      }
    }, 500);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tracking_number: '',
      carrier_code: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      amount: 0,
    },
  });

  const handleUserSearch = async (value: string) => {
    setUserSearchMessage('');
    if (value.length < 2) {
      setUserSearchResults([]);
      setUserSearchMessage('Type at least 2 characters to search');
      return;
    }
    setIsSearchingUser(true);
    const res = await searchUsers(value);
    if (res.success && res.data) {
      setUserSearchResults(res.data);
      if (res.data.length === 0) {
        setUserSearchMessage('No users found');
      }
    }
    setIsSearchingUser(false);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUserId(user.id);
    form.setValue('customer_name', user.name || '');
    form.setValue('customer_email', user.email || '');
    form.setValue('customer_phone', user.phone || '');
    setOpenUserCombobox(false);
    toast.success(`Selected: ${user.name}`);
  };

  const handleCarrierSearch = async (value: string) => {
    setIsSearchingCarrier(true);
    const res = await searchCarriers(value);
    if (res.success && res.data) {
      setCarrierSearchResults(res.data);
    }
    setIsSearchingCarrier(false);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createShipmentAction({
        ...values,
        userId: selectedUserId || undefined,
        tenantId: values.tenant_id,
      });

      if (result.success) {
        toast.success('Shipment created successfully!');
        form.reset();
        setSelectedUserId(null);
        setSelectedCarrier(null);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to create shipment');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='space-y-1'>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Package className='h-5 w-5 text-primary' />
            Create New Shipment
          </DialogTitle>
          <DialogDescription className='text-sm'>
            Add a new shipment to track. Fill in the tracking number and
            customer details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {tenants.length > 0 && (
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Building2 className='h-4 w-4 text-muted-foreground' />
                  <h3 className='text-sm font-semibold'>Organization</h3>
                </div>
                <FormField
                  control={form.control}
                  name='tenant_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Tenant</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a tenant for this shipment' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({t.country_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator className='my-3' />
              </div>
            )}

            {/* Tracking Information Section */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Package className='h-4 w-4 text-muted-foreground' />
                <h3 className='text-sm font-semibold'>Tracking Information</h3>
              </div>

              <FormField
                control={form.control}
                name='tracking_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Tracking Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., 1Z999AA10123456784'
                        {...field}
                        onChange={(e) =>
                          handleTrackingChange(e, field.onChange)
                        }
                        className='font-mono h-9'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Carrier Search - Compact */}
              <div className='space-y-1.5'>
                <FormLabel className='text-sm'>Courier</FormLabel>
                <div className='flex gap-2'>
                  <Popover
                    open={openCarrierCombobox}
                    onOpenChange={async (open) => {
                      setOpenCarrierCombobox(open);
                      if (open && carrierSearchResults.length === 0) {
                        const res = await searchCarriers('');
                        if (res.success && res.data)
                          setCarrierSearchResults(res.data);
                      }
                    }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={openCarrierCombobox}
                        className='flex-1 justify-between h-9'
                        type='button'>
                        <div className='flex items-center gap-2 truncate'>
                          <Truck className='h-4 w-4 shrink-0 opacity-50' />
                          <span className='truncate'>
                            {selectedCarrier
                              ? selectedCarrier.name
                              : 'Auto-detect...'}
                          </span>
                        </div>
                        {selectedCarrier && (
                          <Badge variant='secondary' className='ml-2 text-xs'>
                            Set
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-80 md:w-[30rem] p-0'
                      align='start'>
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder='Search courier...'
                          onValueChange={handleCarrierSearch}
                        />
                        <CommandList>
                          {isSearchingCarrier ? (
                            <div className='flex items-center justify-center py-4'>
                              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>No couriers found.</CommandEmpty>
                              <CommandGroup>
                                {carrierSearchResults.map((c: any) => (
                                  <CommandItem
                                    key={c.code}
                                    value={c.code}
                                    onSelect={() => {
                                      setSelectedCarrier(c);
                                      form.setValue('carrier_code', c.code);
                                      setOpenCarrierCombobox(false);
                                      toast.success(`Selected: ${c.name}`);
                                    }}
                                    className='flex items-center justify-between'>
                                    <div className='flex flex-col'>
                                      <span className='text-sm font-medium'>
                                        {c.name}
                                      </span>
                                      <span className='text-xs text-muted-foreground'>
                                        {c.code}
                                      </span>
                                    </div>
                                    {selectedCarrier?.code === c.code && (
                                      <CheckCircle2 className='h-4 w-4 text-primary' />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCarrier && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-9 w-9 shrink-0'
                      onClick={() => {
                        setSelectedCarrier(null);
                        form.setValue('carrier_code', '');
                        toast.info('Cleared');
                      }}>
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator className='my-3' />

            {/* Customer Information Section */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                <h3 className='text-sm font-semibold'>Customer Information</h3>
              </div>

              {/* User Search - Compact */}
              <div className='space-y-1.5'>
                <FormLabel className='text-sm'>Assign to User</FormLabel>
                <div className='flex gap-2'>
                  <Popover
                    open={openUserCombobox}
                    onOpenChange={setOpenUserCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={openUserCombobox}
                        className='flex-1 justify-between h-9'
                        type='button'>
                        <div className='flex items-center gap-2 truncate'>
                          <User className='h-4 w-4 shrink-0 opacity-50' />
                          <span className='truncate'>
                            {selectedUserId
                              ? form.getValues('customer_name')
                              : 'Search user...'}
                          </span>
                        </div>
                        {selectedUserId && (
                          <Badge variant='secondary' className='ml-2 text-xs'>
                            Set
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-80 md:w-[30rem] p-0'
                      align='start'>
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder='Search by name, email...'
                          onValueChange={handleUserSearch}
                        />
                        <CommandList>
                          {isSearchingUser ? (
                            <div className='flex items-center justify-center py-4'>
                              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                            </div>
                          ) : (
                            <>
                              {userSearchMessage && (
                                <div className='py-4 text-center text-sm text-muted-foreground'>
                                  {userSearchMessage}
                                </div>
                              )}
                              {userSearchResults.length > 0 && (
                                <CommandGroup>
                                  {userSearchResults.map((user: any) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.id}
                                      onSelect={() => handleSelectUser(user)}
                                      className='flex items-center justify-between'>
                                      <div className='flex flex-col'>
                                        <span className='text-sm font-medium'>
                                          {user.name}
                                        </span>
                                        <span className='text-xs text-muted-foreground truncate'>
                                          {user.email}
                                        </span>
                                      </div>
                                      {selectedUserId === user.id && (
                                        <CheckCircle2 className='h-4 w-4 text-primary' />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedUserId && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-9 w-9 shrink-0'
                      onClick={() => {
                        setSelectedUserId(null);
                        toast.info('Unassigned');
                      }}>
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='customer_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John Doe'
                          className='h-9'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='customer_email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='john@example.com'
                          className='h-9'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='customer_phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+1 234 567 8900'
                          className='h-9'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0.00'
                          className='h-9'
                          step='0.01'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className='h-9'>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting} className='h-9'>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className='mr-2 h-4 w-4' />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
