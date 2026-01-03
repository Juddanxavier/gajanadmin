"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { searchCarriers, updateShipmentCarrierAction } from "@/app/(dashboard)/shipments/actions"
import { toast } from "sonner"
import { useState } from "react"

interface EditCarrierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipmentId: string
  currentCarrierCode?: string
}

export function EditShipmentCarrierDialog({
  open,
  onOpenChange,
  shipmentId,
  currentCarrierCode,
}: EditCarrierDialogProps) {
  const [openCombobox, setOpenCombobox] = useState(false)
  const [value, setValue] = useState(currentCarrierCode || "")
  const [carriers, setCarriers] = useState<{ code: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Initial load or search
  const handleSearch = async (query: string) => {
      // Create a simple debounced effect or just basic search for now
      if (!query) return;
      setLoading(true);
      const res = await searchCarriers(query);
      if (res.success && res.data) {
          setCarriers(res.data);
      }
      setLoading(false);
  }

  // Effect to load initial list (optional, maybe top 10)
  React.useEffect(() => {
     if (open) {
         handleSearch('p'); // Default search to show some options? 'p' is common
         setValue(currentCarrierCode || "");
     }
  }, [open, currentCarrierCode]);

  const handleSave = async () => {
      setSaving(true);
      const res = await updateShipmentCarrierAction(shipmentId, value);
      setSaving(false);
      
      if (res.success) {
          toast.success("Carrier updated and shipment synced");
          onOpenChange(false);
      } else {
          toast.error(`Failed to update: ${res.error}`);
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Carrier</DialogTitle>
          <DialogDescription>
            Select the correct carrier for this shipment. This will force a re-sync.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between"
              >
                {value
                  ? carriers.find((c) => c.code === value)?.name || value
                  : "Select carrier..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search carrier..." onValueChange={handleSearch} />
                <CommandList>
                   <CommandEmpty>No carrier found.</CommandEmpty>
                   <CommandGroup>
                    {carriers.map((carrier) => (
                        <CommandItem
                        key={carrier.code}
                        value={carrier.code}
                        onSelect={(currentValue) => {
                            setValue(carrier.code) // Use code not name
                            setOpenCombobox(false)
                        }}
                        >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            value === carrier.code ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {carrier.name}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
