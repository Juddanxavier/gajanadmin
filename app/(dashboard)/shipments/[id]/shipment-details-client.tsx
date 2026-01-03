"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, MapPin, User, FileText, RefreshCw, Truck, Calendar, DollarSign, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { syncShipmentAction } from "../actions";
import { toast } from "sonner";
import { NotificationLogs } from "@/components/shipments/notification-logs";
import { Separator } from "@/components/ui/separator";

interface ShipmentDetailsClientProps {
  shipment: any;
  events: any[];
  logs?: any[]; 
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered": return "default";
    case "in_transit": return "secondary";
    case "pending": return "outline";
    case "exception": return "destructive";
    case "invalid": return "destructive";
    default: return "secondary";
  }
};

export function ShipmentDetailsClient({ shipment, events, logs }: ShipmentDetailsClientProps) {
  const router = useRouter();
  
  const handleSync = async () => {
    const promise = syncShipmentAction(shipment.id);
    toast.promise(promise, {
      loading: 'Syncing shipment...',
      success: () => {
        router.refresh();
        return 'Shipment synced successfully';
      },
      error: (err) => `Sync failed: ${err.message}`
    });
  };
  
  const raw = shipment.raw_response || {};
  const customer = shipment.customer_details || {};
  const invoice = shipment.invoice_details || {};
  
  // Format helpers
  const origin = raw.shipFrom || raw.ship_from || 'Unknown';
  const destination = raw.shipTo || raw.ship_to || shipment.latest_location || 'Unknown';
  const originCode = origin.length > 3 ? origin.substring(0, 3).toUpperCase() : "ORG";
  const destCode = destination.length > 3 ? destination.substring(0, 3).toUpperCase() : "DST";

  const gradients = [
    "from-blue-500/5 via-cyan-500/5 to-teal-500/5",
    "from-purple-500/5 via-pink-500/5 to-rose-500/5",
    "from-amber-500/5 via-orange-500/5 to-red-500/5",
    "from-emerald-500/5 via-teal-500/5 to-cyan-500/5",
    "from-indigo-500/5 via-violet-500/5 to-purple-500/5",
    "from-rose-500/5 via-red-500/5 to-orange-500/5"
  ];

  // Use a stable random gradient based on shipment ID to avoid hydration mismatch/flashing
  // or just simple random on mount. User asked for "refresh/load" so random is fine, 
  // but to avoid hydration errors we'll default to one and change or use a deterministic one.
  // Using deterministic based on ID string length + char codes is nice.
  const gradientIndex = shipment.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % gradients.length;
  // Actually user asked "everytime we refresh/load", suggesting they WANT it to change.
  // But hydration mismatch is annoying. Let's use useEffect for true random.
  
  const [currentGradient, setCurrentGradient] = React.useState(gradients[0]);
  
  React.useEffect(() => {
     setCurrentGradient(gradients[Math.floor(Math.random() * gradients.length)]);
  }, []);

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-8">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="space-y-1">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground -ml-4 mb-2 hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shipments
                </Button>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Shipment Details</h1>
                    <div className="hidden md:flex h-6 w-px bg-border" />
                    <code className="hidden md:block text-sm bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                        {shipment.carrier_tracking_code}
                    </code>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                     <Badge variant={getStatusColor(shipment.status)} className="capitalize px-3 py-1 text-sm">
                        {shipment.status.replace('_', ' ')}
                     </Badge>
                     <Button variant="outline" size="sm" onClick={handleSync}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Status
                     </Button>
                 </div>
             </div>
        </div>

        {/* Hero Route Card */}
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${currentGradient} p-8 duration-500 transition-colors`}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Origin</p>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">{origin}</h2>
                    {/* <p className="text-sm font-medium text-foreground/80">{origin}</p> */}
                </div>

                <div className="flex-1 w-full flex flex-col items-center gap-2">
                    <div className="w-full flex items-center gap-4 text-muted-foreground/30">
                        <div className="h-2 w-2 rounded-full bg-primary/50" />
                        <div className="h-0.5 flex-1 bg-current" />
                        <Truck className="h-6 w-6 text-foreground/50" />
                        <div className="h-0.5 flex-1 bg-current" />
                        <div className="h-2 w-2 rounded-full bg-primary/50" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{shipment.carrier_id}</p>
                </div>

                <div className="text-center md:text-right space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Destination</p>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">{destination}</h2>
                    {/* <p className="text-sm font-medium text-foreground/80">{destination}</p> */}
                </div>
            </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Carrier */}
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Carrier</CardTitle>
                    <Truck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{shipment.carrier_id}</div>
                    <p className="text-xs text-muted-foreground mt-1">{shipment.provider}</p>
                </CardContent>
            </Card>

            {/* Provider/White Label */}
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Reference</CardTitle>
                    <Package className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold truncate" title={shipment.white_label_code}>{shipment.white_label_code}</div>
                    <p className="text-xs text-muted-foreground mt-1">Internal ID</p>
                </CardContent>
            </Card>

            {/* Invoice */}
            <Card className="hover:shadow-md transition-shadow border-green-500/20 bg-green-500/5">
               <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Invoice Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-green-700 dark:text-green-300">
                        {invoice.amount || invoice.total ? `₹${invoice.amount || invoice.total}` : 'N/A'}
                    </div>
                </CardContent>
            </Card>
            
            {/* Dates */}
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">ETA / Created</CardTitle>
                    <Calendar className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">
                        {shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), 'MMM d') : 'Pending'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Created: {format(new Date(shipment.created_at), 'MMM d, yyyy')}
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Customer & Timeline Section */}
        <div className="grid gap-6 md:grid-cols-3">
             {/* Left Column: Customer & Logs */}
             <div className="space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" /> Customer Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-6">
                             <div className="h-12 w-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold shadow-sm">
                                {customer.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{customer.name || "Unknown User"}</h3>
                                <p className="text-xs text-muted-foreground">Shipment Recipient</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 border-t pt-4 border-primary/10">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact Email</p>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <Mail className="h-3.5 w-3.5" />
                                    {customer.email || "N/A"}
                                </div>
                            </div>
                             <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number</p>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <Phone className="h-3.5 w-3.5" />
                                    {customer.phone || "N/A"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <NotificationLogs logs={logs || []} />
             </div>

             {/* Right Column: Timeline */}
             <div className="md:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" /> Tracking History
                    </CardTitle>
                    <CardDescription>
                        {events.length} tracking event{events.length !== 1 ? 's' : ''} recorded
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    {events.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No tracking events available yet
                        </div>
                    ) : (
                        <div className="relative space-y-8">
                        {/* Timeline line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-border" />
                        
                        {events.map((event, index) => (
                            <div key={event.id} className="relative flex gap-6">
                            {/* Timeline dot */}
                            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {index === 0 ? <Truck className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                            </div>
                            
                            {/* Event content */}
                            <div className="flex-1 space-y-1 pt-1.5 bg-muted/10 p-4 rounded-lg border hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <p className="font-semibold capitalize text-base">{event.status.replace('_', ' ')}</p>
                                    <Badge variant="outline" className="w-fit font-mono text-xs">
                                        {format(new Date(event.occurred_at), 'PPP p')}
                                    </Badge>
                                </div>
                                {event.description && (
                                <p className="text-sm text-foreground/80 mt-1">{event.description}</p>
                                )}
                                {event.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                </p>
                                )}
                            </div>
                            </div>
                        ))}
                        </div>
                    )}
                    </CardContent>
                </Card>
             </div>
        </div>
      </div>
    </div>
  );
}
