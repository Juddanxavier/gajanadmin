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
import { getPhoneCode } from '@/lib/constants/countries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowRight,
  ArrowLeft,
  CircleUser,
  UserPlus,
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

// Schema definition (split for steps if needed, but single schema works for now)
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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [customerTab, setCustomerTab] = useState<'existing' | 'new'>(
    'existing',
  );

  // Fetch Tenants
  useEffect(() => {
    if (open) {
      setStep(1); // Reset to step 1 on open
      getAllTenants().then((res) => {
        if (res.success && res.data) {
          setTenants(res.data);
        }
      });
    }
  }, [open]);

  // User Search State
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Carrier Search State
  const [openCarrierCombobox, setOpenCarrierCombobox] = useState(false);
  const [carrierSearchResults, setCarrierSearchResults] = useState<any[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [isSearchingCarrier, setIsSearchingCarrier] = useState(false);

  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tracking_number: '',
      carrier_code: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      amount: 0,
      tenant_id: '',
    },
  });

  // Handle Tenant Change -> Auto-set Phone Code
  const handleTenantChange = (tenantId: string) => {
    form.setValue('tenant_id', tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      const phoneCode = getPhoneCode(tenant.country_code);
      const currentPhone = form.getValues('customer_phone');
      // Only set if phone is empty or previously just a code
      if (!currentPhone || currentPhone.length < 5) {
        form.setValue('customer_phone', phoneCode);
      }
    }
  };

  // Auto-detect carrier
  const handleTrackingChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    const value = e.target.value;
    onChange(value);

    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    detectionTimeoutRef.current = setTimeout(() => {
      if (value.length > 5) {
        const detected = detectCarrier(value);
        if (detected.length > 0) {
          const bestMatch = detected[0];
          if (selectedCarrier?.code !== bestMatch.code) {
            setSelectedCarrier({ code: bestMatch.code, name: bestMatch.name });
            form.setValue('carrier_code', bestMatch.code);
            toast.info(`Detected Carrier: ${bestMatch.name}`);
          }
        }
      }
    }, 500);
  };

  // User Search Logic
  const handleUserSearchInput = (value: string) => {
    setUserSearchQuery(value);

    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (value.length < 2) {
      setUserSearchResults([]);
      return;
    }

    userSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingUser(true);
      const res = await searchUsers(value);
      if (res.success && res.data) {
        setUserSearchResults(res.data);
      }
      setIsSearchingUser(false);
    }, 300);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUserId(user.id);
    form.setValue('customer_name', user.name || '');
    form.setValue('customer_email', user.email || '');
    form.setValue('customer_phone', user.phone || '');
    setCustomerTab('new'); // Switch to form view to verify details
    toast.success(`Selected user: ${user.name}`);
  };

  const handleCarrierSearch = async (value: string) => {
    setIsSearchingCarrier(true);
    const res = await searchCarriers(value);
    if (res.success && res.data) {
      setCarrierSearchResults(res.data);
    }
    setIsSearchingCarrier(false);
  };

  const nextStep = async () => {
    // Validate Step 1 fields
    const valid = await form.trigger([
      'tenant_id',
      'tracking_number',
      'carrier_code',
    ]);
    if (valid) {
      setStep(2);
    }
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
        setStep(1);
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
        <DialogHeader className='space-y-1 mb-2'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <Package className='h-5 w-5 text-primary' />
              Create New Shipment
            </DialogTitle>
            <div className='flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full'>
              Step {step} of 2
            </div>
          </div>
          <DialogDescription className='text-sm'>
            {step === 1
              ? 'Enter shipment tracking details.'
              : 'Assign to a customer.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* STEP 1: Shipment Details */}
            {step === 1 && (
              <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
                <div className='space-y-4'>
                  {tenants.length > 0 && (
                    <FormField
                      control={form.control}
                      name='tenant_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                            Organization
                          </FormLabel>
                          <Select
                            onValueChange={handleTenantChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className='h-11'>
                                <SelectValue placeholder='Select Tenant' />
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
                          {field.value && (
                            <p className='text-[10px] text-muted-foreground flex items-center gap-1 mt-1'>
                              <Phone className='h-3 w-3' />
                              Phone code will auto-set to{' '}
                              {getPhoneCode(
                                tenants.find((t) => t.id === field.value)
                                  ?.country_code,
                              )}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name='tracking_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                          Tracking Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., 1Z999AA10123456784'
                            {...field}
                            onChange={(e) =>
                              handleTrackingChange(e, field.onChange)
                            }
                            className='font-mono h-11 text-lg tracking-wide'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Courier Selection */}
                  <div className='space-y-2'>
                    <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      Courier Service
                    </FormLabel>
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
                          className='w-full justify-between h-11'
                          type='button'>
                          <div className='flex items-center gap-2 truncate'>
                            {selectedCarrier ? (
                              <span className='font-medium'>
                                {selectedCarrier.name}
                              </span>
                            ) : (
                              <span className='text-muted-foreground'>
                                Select or auto-detect...
                              </span>
                            )}
                          </div>
                          {selectedCarrier && (
                            <Badge variant='secondary' className='ml-2 text-xs'>
                              {selectedCarrier.code}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-[400px] p-0' align='start'>
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
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Customer Details */}
            {step === 2 && (
              <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
                <Tabs
                  value={customerTab}
                  onValueChange={(v) => setCustomerTab(v as any)}
                  className='w-full'>
                  <TabsList className='grid w-full grid-cols-2 h-11'>
                    <TabsTrigger value='existing' className='gap-2'>
                      <CircleUser className='h-4 w-4' />
                      Existing User
                    </TabsTrigger>
                    <TabsTrigger value='new' className='gap-2'>
                      <UserPlus className='h-4 w-4' />
                      New Customer
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='existing' className='mt-4 space-y-4'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search by name, email, or phone...'
                        className='pl-9 h-11'
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearchInput(e.target.value)}
                      />
                    </div>

                    <div className='max-h-[300px] overflow-y-auto border rounded-md'>
                      {isSearchingUser ? (
                        <div className='flex justify-center p-8'>
                          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                        </div>
                      ) : userSearchResults.length > 0 ? (
                        <div className='divide-y'>
                          {userSearchResults.map((user) => (
                            <div
                              key={user.id}
                              className='p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors'
                              onClick={() => handleSelectUser(user)}>
                              <div className='flex flex-col'>
                                <span className='font-medium'>{user.name}</span>
                                <span className='text-sm text-muted-foreground'>
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                    <Phone className='h-3 w-3' /> {user.phone}
                                  </span>
                                )}
                              </div>
                              <ArrowRight className='h-4 w-4 text-muted-foreground' />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='p-8 text-center text-muted-foreground text-sm'>
                          {userSearchQuery.length < 2
                            ? 'Type to search users...'
                            : 'No users found matching your search.'}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value='new' className='mt-4 space-y-4'>
                    <div className='grid grid-cols-1 gap-4'>
                      <FormField
                        control={form.control}
                        name='customer_name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                              Full Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Recipient Name'
                                className='h-10'
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
                            <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='recipient@email.com'
                                className='h-10'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='customer_phone'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='+...'
                                className='h-10'
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
                            <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                              Charges
                            </FormLabel>
                            <div className='relative'>
                              <div className='absolute left-3 top-2.5 text-muted-foreground font-medium text-sm'>
                                ₹
                              </div>
                              {/* <DollarSign className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' /> */}
                              <Input
                                type='number'
                                placeholder='0.00'
                                className='pl-8 h-10'
                                step='0.01'
                                {...field}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DialogFooter className='pt-6 mt-4 flex items-center justify-between border-t'>
              {step === 1 ? (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => onOpenChange(false)}
                  className='h-10 text-muted-foreground'>
                  Cancel
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setStep(1)}
                  className='h-10 gap-2'>
                  <ArrowLeft className='h-4 w-4' />
                  Back
                </Button>
              )}

              {step === 1 ? (
                <Button
                  type='button'
                  onClick={nextStep}
                  className='h-10 px-6 gap-2'>
                  Next Step
                  <ArrowRight className='h-4 w-4' />
                </Button>
              ) : (
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='h-10 px-8'>
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>Create Shipment</>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
