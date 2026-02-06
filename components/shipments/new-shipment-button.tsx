/** @format */

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewShipmentDialog } from './new-shipment-dialog';

export function NewShipmentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className='mr-2 h-4 w-4' />
        New Shipment
      </Button>

      <NewShipmentDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
