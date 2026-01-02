"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CarrierLogo } from "@/components/shipments/carrier-logo";
import { format } from "date-fns";
import { Package, MapPin, Calendar, Truck } from "lucide-react";

interface PublicTrackingClientProps {
  data: {
    shipment: any;
    events: any[];
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  in_transit: "bg-blue-500",
  delivered: "bg-green-500",
  exception: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_transit: "In Transit",
  delivered: "Delivered",
  exception: "Exception",
};

export default function PublicTrackingClient({ data }: PublicTrackingClientProps) {
  const { shipment, events } = data;
  const customer = shipment.customer_details || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Track Your Shipment</h1>
              <p className="text-sm text-muted-foreground">Real-time tracking information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {shipment.carrier_tracking_code}
                </CardTitle>
                <CardDescription className="mt-1">
                  Tracking Number
                </CardDescription>
              </div>
              <Badge
                className={`${statusColors[shipment.status]} text-white px-4 py-2 text-lg`}
              >
                {statusLabels[shipment.status] || shipment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CarrierLogo code={shipment.carrier_id} className="h-4 w-4" />
                    <p className="font-medium capitalize">{shipment.carrier_id}</p>
                  </div>
                </div>
              </div>

              {shipment.latest_location && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Latest Location</p>
                    <p className="font-medium mt-1">{shipment.latest_location}</p>
                  </div>
                </div>
              )}

              {shipment.estimated_delivery && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-medium mt-1">
                      {format(new Date(shipment.estimated_delivery), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        {customer.name && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recipient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{customer.name}</p>
              {customer.email && (
                <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
              )}
              {customer.phone && (
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Tracking History</CardTitle>
            <CardDescription>
              Latest updates for your shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      {index < events.length - 1 && (
                        <div className="w-0.5 h-full bg-muted mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{event.description}</p>
                          {event.location && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {format(new Date(event.occurred_at), "MMM dd, HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tracking events available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Last updated: {format(new Date(shipment.last_synced_at || shipment.created_at), "PPpp")}</p>
          <p className="mt-2">For questions, please contact the sender</p>
        </div>
      </div>
    </div>
  );
}
