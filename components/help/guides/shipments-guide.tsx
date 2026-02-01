/** @format */

import { TutorialCard } from '../tutorial-card';
import { CodeSnippet } from '../code-snippet';
import { Truck, Upload, Archive, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function ShipmentsGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Truck className='h-8 w-8' />
          Shipments Management
        </h2>
        <p className='text-muted-foreground mt-2'>
          Complete guide to creating, tracking, and managing shipments in GT
          Express.
        </p>
      </div>

      <TutorialCard
        title='Creating Single Shipments'
        description='Add shipments one at a time'
        defaultExpanded>
        <div className='space-y-4'>
          <p>To create a single shipment:</p>

          <ol className='list-decimal list-inside space-y-3 ml-4'>
            <li>
              Navigate to <strong>Shipments</strong> page
            </li>
            <li>
              Click <strong>"Create Shipment"</strong> button
            </li>
            <li>
              Fill in the required fields:
              <div className='ml-6 mt-2 space-y-2'>
                <div className='flex items-start gap-2'>
                  <Badge>Required</Badge>
                  <div>
                    <p className='font-medium'>Tracking Number</p>
                    <p className='text-sm text-muted-foreground'>
                      The unique identifier from your carrier
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <Badge>Required</Badge>
                  <div>
                    <p className='font-medium'>Carrier</p>
                    <p className='text-sm text-muted-foreground'>
                      Select from supported carriers (FedEx, UPS, DHL, USPS,
                      etc.)
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <Badge variant='secondary'>Optional</Badge>
                  <div>
                    <p className='font-medium'>Customer Information</p>
                    <p className='text-sm text-muted-foreground'>
                      Name and email for notifications
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <li>
              Click <strong>"Create"</strong> to save
            </li>
          </ol>

          <Alert>
            <AlertDescription>
              The system will immediately start tracking the shipment and check
              for updates every minute.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Bulk Operations & Import'
        description='Manage multiple shipments at once'
        icon={<Upload className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Import multiple shipments using a CSV file:</p>

          <ol className='list-decimal list-inside space-y-3 ml-4'>
            <li>
              Click <strong>"Import"</strong> button on the Shipments page
            </li>
            <li>Download the CSV template</li>
            <li>Fill in your shipment data following the template format</li>
            <li>Upload the completed CSV file</li>
            <li>Review and confirm the import</li>
          </ol>

          <div className='mt-4'>
            <h4 className='font-semibold mb-2'>CSV Template Format:</h4>
            <CodeSnippet
              code={`tracking_number,carrier,customer_name,customer_email,description
123456789012,FedEx,John Doe,john@example.com,Electronics shipment
1Z999AA10123456784,UPS,Jane Smith,jane@example.com,Documents
1234567890,DHL,Bob Johnson,bob@example.com,Clothing order`}
              language='csv'
            />
          </div>

          <Alert>
            <AlertTitle>Bulk Actions</AlertTitle>
            <AlertDescription>
              Select multiple shipments using checkboxes to perform bulk actions
              like archiving, exporting, or updating status.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Understanding Tracking & Auto-Sync'
        description='How automatic updates work'>
        <div className='space-y-4'>
          <p>
            GT Express automatically tracks your shipments using integrated
            carrier APIs:
          </p>

          <div className='space-y-3'>
            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold mb-2'>🔄 Auto-Sync Process</h4>
              <ol className='list-decimal list-inside space-y-2 text-sm ml-4'>
                <li>
                  System checks for updates every <strong>1 minute</strong> for
                  active shipments
                </li>
                <li>
                  Fetches latest data from Track123 or direct carrier APIs
                </li>
                <li>Compares new status with existing status</li>
                <li>
                  If changed, updates the shipment and triggers notifications
                </li>
              </ol>
            </div>

            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold mb-2'>📊 Shipment Statuses</h4>
              <div className='grid gap-2 mt-2'>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>Pending</Badge>
                  <span className='text-sm'>Awaiting carrier pickup</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-blue-500'>In Transit</Badge>
                  <span className='text-sm'>Package is moving</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-yellow-500'>Out for Delivery</Badge>
                  <span className='text-sm'>Final delivery in progress</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-green-500'>Delivered</Badge>
                  <span className='text-sm'>Successfully delivered</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='destructive'>Exception</Badge>
                  <span className='text-sm'>
                    Issue detected (delayed, lost, etc.)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Only active shipments (Pending, In Transit,
              Out for Delivery) are auto-synced. Delivered and Archived
              shipments are not checked.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Managing Exceptions'
        description='Handle shipment issues and delays'
        icon={<AlertCircle className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>
            When a shipment encounters an issue, it's marked as an{' '}
            <strong>Exception</strong>:
          </p>

          <div className='space-y-3'>
            <h4 className='font-semibold'>Common Exception Types:</h4>
            <ul className='list-disc list-inside space-y-2 ml-4 text-sm'>
              <li>
                <strong>Delivery Attempted:</strong> Customer not available
              </li>
              <li>
                <strong>Delayed:</strong> Weather, customs, or carrier issues
              </li>
              <li>
                <strong>Invalid Address:</strong> Address verification failed
              </li>
              <li>
                <strong>Lost/Damaged:</strong> Package lost or damaged in
                transit
              </li>
              <li>
                <strong>Invalid Tracking:</strong> Tracking number not found
              </li>
            </ul>

            <h4 className='font-semibold mt-4'>Resolving Exceptions:</h4>
            <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
              <li>Review the exception details in the shipment view</li>
              <li>Contact the carrier if needed</li>
              <li>Update customer with status</li>
              <li>If resolved, status will auto-update on next sync</li>
              <li>If unresolvable, manually archive the shipment</li>
            </ol>
          </div>

          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Automatic Notifications</AlertTitle>
            <AlertDescription>
              Customers are automatically notified via email when an exception
              occurs, if their email is on file.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Archiving & Data Management'
        description='Keep your shipment list organized'
        icon={<Archive className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>
            Archive old shipments to improve performance and keep your active
            list clean:
          </p>

          <div className='space-y-3'>
            <h4 className='font-semibold'>Manual Archiving:</h4>
            <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
              <li>Select shipments using checkboxes</li>
              <li>Click "Archive" from the bulk actions menu</li>
              <li>Confirm the action</li>
            </ol>

            <h4 className='font-semibold mt-4'>Automatic Archiving:</h4>
            <p className='text-sm text-muted-foreground'>
              The system automatically archives shipments that meet these
              criteria:
            </p>
            <ul className='list-disc list-inside space-y-1 ml-4 text-sm'>
              <li>
                Status: <strong>Pending</strong>
              </li>
              <li>
                Age: <strong>More than 30 days old</strong>
              </li>
              <li>No recent updates</li>
            </ul>

            <h4 className='font-semibold mt-4'>Viewing Archived Shipments:</h4>
            <p className='text-sm text-muted-foreground'>
              Use the status filter and select "Archived" to view archived
              shipments. You can restore them if needed.
            </p>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Performance Tip:</strong> Archiving old shipments
              significantly improves dashboard load times and query performance.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>
    </div>
  );
}
