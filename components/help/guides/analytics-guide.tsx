/** @format */

import { TutorialCard } from '../tutorial-card';
import { BarChart3, LineChart, PieChart, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AnalyticsGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <BarChart3 className='h-8 w-8' />
          Analytics & Reporting
        </h2>
        <p className='text-muted-foreground mt-2'>
          Gain insights into your logistics operations and team performance.
        </p>
      </div>

      <TutorialCard
        title='Dashboard Metrics'
        description='Understanding your key performance indicators'
        defaultExpanded>
        <div className='space-y-4'>
          <p>The main dashboard provides real-time metrics:</p>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Badge variant='outline'>Total Shipments</Badge>
              </h4>
              <p className='text-sm text-muted-foreground mt-2'>
                Total number of shipments created within the selected date
                range. Includes all statuses.
              </p>
            </div>
            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-green-100 text-green-800 border-green-200'>
                  Delivered
                </Badge>
              </h4>
              <p className='text-sm text-muted-foreground mt-2'>
                Shipments successfully delivered to the destination.
              </p>
            </div>
            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-blue-100 text-blue-800 border-blue-200'>
                  In Transit
                </Badge>
              </h4>
              <p className='text-sm text-muted-foreground mt-2'>
                Shipments currently moving through the carrier network.
              </p>
            </div>
            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-red-100 text-red-800 border-red-200'>
                  Exceptions
                </Badge>
              </h4>
              <p className='text-sm text-muted-foreground mt-2'>
                Shipments requiring attention due to delays or issues.
              </p>
            </div>
          </div>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Shipment Analytics'
        description='Deep dive into shipping trends'
        icon={<LineChart className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Analyze your shipping patterns over time:</p>

          <ul className='list-disc list-inside space-y-2 ml-4 text-sm'>
            <li>
              <strong>Volume Trends:</strong> See which days of the week are
              busiest
            </li>
            <li>
              <strong>Carrier Distribution:</strong> Compare usage across
              different carriers (FedEx vs UPS vs DHL)
            </li>
            <li>
              <strong>Delivery Performance:</strong> Average time to delivery
              per carrier
            </li>
            <li>
              <strong>Geographic Distribution:</strong> Where are you shipping
              to most frequently
            </li>
          </ul>

          <Alert>
            <AlertDescription>
              Use the date range picker in the top right to filter data by Day,
              Week, Month, or Year.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='User Performance'
        description='Track team productivity'
        icon={<Users className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Monitor individual team member contributions:</p>

          <div className='space-y-3'>
            <h4 className='font-semibold text-sm'>Key Metrics Tracked:</h4>
            <ul className='list-disc list-inside space-y-1 ml-4 text-sm'>
              <li>Shipments created</li>
              <li>Leads generated and converted</li>
              <li>Response time to assignments</li>
              <li>Overall activity log</li>
            </ul>
          </div>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Custom Reports'
        description='Export data for external analysis'
        icon={<Calendar className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Export your data to CSV/Excel:</p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>Go to the relevant page (Shipments, Leads, etc.)</li>
            <li>Apply any desired filters (Status, Date, Carrier)</li>
            <li>
              Click the <strong>"Export"</strong> button
            </li>
            <li>
              Choose <strong>"Export All"</strong> or{' '}
              <strong>"Export Selected"</strong>
            </li>
          </ol>
        </div>
      </TutorialCard>
    </div>
  );
}
