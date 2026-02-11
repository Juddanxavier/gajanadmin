/** @format */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { updateShipment } from '@/app/(dashboard)/shipments/actions';
import { Shipment } from './columns';

// Schema for editing - Removed destinationCountry
const editSchema = z.object({
  customerName: z.string().min(1, 'Customer Name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount is required'),
});

type FormData = z.infer<typeof editSchema>;

interface EditShipmentDialogProps {
  shipment: Shipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditShipmentDialog({
  shipment,
  open,
  onOpenChange,
}: EditShipmentDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      customerName: shipment.customer_details?.name || '',
      customerEmail: shipment.customer_details?.email || '',
      customerPhone: shipment.customer_details?.phone || '',
      notes: (shipment as any).notes || '', // Cast as any if notes missing from type
      amount: shipment.amount || 0,
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const result = await updateShipment(shipment.id, data);

      if (result.success) {
        toast.success('Shipment updated successfully');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update shipment');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Edit Shipment</DialogTitle>
          <DialogDescription>Update shipment details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              {/* Read-only info */}
              <div className='col-span-2 p-4 bg-muted rounded-lg text-sm mb-4'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <span className='font-semibold'>Tracking Code:</span>{' '}
                    {shipment.carrier_tracking_code}
                  </div>
                  <div>
                    <span className='font-semibold'>Carrier:</span>{' '}
                    {shipment.carrier_id}
                  </div>
                  <div>
                    <span className='font-semibold'>White Label Code:</span>{' '}
                    {shipment.white_label_code}
                  </div>
                  <div>
                    <span className='font-semibold'>Status:</span>{' '}
                    {shipment.status}
                  </div>
                </div>
              </div>

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
                    <FormLabel>Customer Email</FormLabel>
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
                      <Input type='tel' placeholder='+123...' {...field} />
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
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Remark</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Internal notes or remarks for Track123...'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
