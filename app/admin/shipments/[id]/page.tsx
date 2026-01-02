import { getShipmentDetails } from './actions';
import { notFound } from 'next/navigation';
import { ShipmentDetailsClient } from './shipment-details-client';

export default async function ShipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('[ShipmentDetailsPage] Requested ID:', id);
  
  const data = await getShipmentDetails(id);
  console.log('[ShipmentDetailsPage] Data returned:', data ? 'Found' : 'Not found');
  
  if (!data) {
    console.log('[ShipmentDetailsPage] Calling notFound()');
    // notFound(); // Commented out for debugging
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Debug: Shipment Not Found</h1>
        <div className="p-4 border rounded bg-muted/50 font-mono text-sm space-y-2">
            <p><strong>Requested ID:</strong> {id}</p>
            <p><strong>Environment Check (Server Side):</strong></p>
            <ul className="list-disc list-inside">
                <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing'}</li>
                <li>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing'} 
                    {process.env.SUPABASE_SERVICE_ROLE_KEY ? `(${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0,5)}...)` : ''}
                </li>
            </ul>
            <p className="text-muted-foreground mt-4">If Environmental Variables are missing, please restart the server.</p>
        </div>
      </div>
    );
  }
  
  return <ShipmentDetailsClient shipment={data.shipment} events={data.events} logs={data.logs} />;
}
