/** @format */

'use client';

import { useState } from 'react';
import { CreateShipmentDialog } from '@/components/shipments/create-shipment-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateShipmentDialogWrapper() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className='mr-2 h-4 w-4' />
        Add Shipment
      </Button>
      <CreateShipmentDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          // Refresh server data
          router.refresh();
        }}
      />
    </>
  );
}
