
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  DollarSign,
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentService } from "@/lib/services/shipment-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default async function AdminPage() {
  const shipmentService = new ShipmentService();
  
  // Parallel Fetching
  const [stats, recentShipmentsRes] = await Promise.all([
    shipmentService.getStats(),
    shipmentService.getShipments({ pageSize: 5, sortBy: { field: 'updated_at', direction: 'desc' } })
  ]);

  const recentShipments = recentShipmentsRes.data || [];

  const statCards = [
    {
      title: "Active Shipments",
      value: stats.in_transit.toString(),
      icon: Truck,
      description: "In Transit",
      color: "text-blue-500"
    },
    {
      title: "Pending Orders",
      value: stats.pending.toString(),
      icon: Clock,
      description: "Awaiting Update",
      color: "text-orange-500"
    },
    {
      title: "Exceptions",
      value: stats.exception.toString(),
      icon: AlertTriangle,
      description: "Attention Needed",
      color: "text-red-500"
    },
    {
      title: "Delivered",
      value: stats.delivered.toString(),
      icon: CheckCircle2,
      description: "Total Completed",
      color: "text-green-500"
    },
    {
      title: "Avg Delivery",
      value: stats.avgDeliveryDays ? `${stats.avgDeliveryDays} Days` : "N/A",
      icon: TrendingUp,
      description: "Performance",
      color: "text-purple-500"
    },
    {
      title: "Total Tracked",
      value: stats.total.toString(),
      icon: Package,
      description: "All Time",
      color: "text-muted-foreground"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your logistics operations.
          </p>
        </div>
        <Link href="/shipments">
             <Button>
                <Plus className="mr-2 h-4 w-4" /> New Shipment
             </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest shipment updates and status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentShipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                  recentShipments.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 border-b last:border-0 pb-3 last:pb-0">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                        <Truck className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Link href={`/shipments/${s.id}`} className="hover:underline">
                            <p className="text-sm font-medium leading-none">
                            {s.carrier_tracking_code}
                            </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {s.latest_location || 'Location unknown'} • <span className="capitalize">{s.status.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                         {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))
              )}
            </div>
            {recentShipments.length > 0 && (
                <div className="mt-4 pt-2 border-t flex justify-end">
                    <Link href="/shipments" className="text-sm text-primary flex items-center hover:underline">
                        View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/shipments">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Package className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-semibold">Manage Shipments</span>
                        <span className="text-xs text-muted-foreground font-normal">Track, update and delete</span>
                    </div>
                </Button>
            </Link>
            
            <Link href="/leads">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                         <span className="font-semibold">Manage Leads</span>
                         <span className="text-xs text-muted-foreground font-normal">View potential customers</span>
                    </div>
                </Button>
            </Link>

            <Link href="/settings">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-semibold">Configuration</span>
                        <span className="text-xs text-muted-foreground font-normal">Update app settings</span>
                    </div>
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}