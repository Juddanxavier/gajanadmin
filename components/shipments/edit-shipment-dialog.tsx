/** @format */

'use client';

import { useState } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateShipmentAction } from '@/app/(dashboard)/shipments/edit-delete-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z
    .string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  customer_phone: z.string().optional(),
  carrier_id: z.string().optional(),
  amount: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shipment: {
    id: string;
    customer_details?: any;
    invoice_details?: any;
    carrier_id?: string;
  };
}

export function EditShipmentDialog({
  open,
  onOpenChange,
  onSuccess,
  shipment,
}: EditShipmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customer_name: shipment.customer_details?.name || '',
      customer_email: shipment.customer_details?.email || '',
      customer_phone: shipment.customer_details?.phone || '',
      carrier_id: shipment.carrier_id || '',
      amount: shipment.invoice_details?.amount || 0,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await updateShipmentAction(shipment.id, {
        customer_name: values.customer_name,
        customer_email: values.customer_email || undefined,
        customer_phone: values.customer_phone || undefined,
        carrier_id: values.carrier_id || undefined,
        amount: values.amount,
      });

      if (result.success) {
        toast.success('Shipment updated successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(`Failed to update shipment: ${result.error}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader className='mb-2'>
          <DialogTitle>Edit Shipment</DialogTitle>
          <DialogDescription>
            Update shipment details and customer information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {/* LEFT: Customer Details */}
              <div className='space-y-6'>
                <div>
                  <h3 className='text-sm font-semibold mb-3 text-foreground/90'>
                    Customer Information
                  </h3>
                  <div className='h-px bg-border mb-4' />
                </div>

                <FormField
                  control={form.control}
                  name='customer_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        Customer Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John Doe'
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
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='john@example.com'
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
                  name='customer_phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+1234567890'
                          className='h-10'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* RIGHT: Shipment Details */}
              <div className='space-y-6'>
                <div>
                  <h3 className='text-sm font-semibold mb-3 text-foreground/90'>
                    Shipment Details
                  </h3>
                  <div className='h-px bg-border mb-4' />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='carrier_id'
                    render={({ field }) => (
                      <FormItem className='col-span-2'>
                        <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                          Carrier Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='fedex'
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
                      <FormItem className='col-span-2'>
                        <FormLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                          Charges
                        </FormLabel>
                        <div className='relative'>
                          <div className='absolute left-3 top-2.5 text-muted-foreground font-medium text-sm'>
                            ₹
                          </div>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='0.00'
                              className='pl-8 h-10'
                              step='0.01'
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='pt-6 border-t mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                className='h-10'>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='h-10 px-8'>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
