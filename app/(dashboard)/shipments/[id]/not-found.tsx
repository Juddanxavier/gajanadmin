import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function ShipmentNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Package className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Shipment Not Found</h2>
      <p className="text-muted-foreground">
        The shipment you're looking for doesn't exist or has been deleted.
      </p>
      <Link href="/shipments">
        <Button>Back to Shipments</Button>
      </Link>
    </div>
  );
}
