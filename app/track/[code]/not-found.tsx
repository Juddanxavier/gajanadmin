import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function TrackingNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Tracking Number Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find a shipment with that tracking number. Please check the number and try again.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
