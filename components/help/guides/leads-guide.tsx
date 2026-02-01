/** @format */

import { TutorialCard } from '../tutorial-card';
import { CodeSnippet } from '../code-snippet';
import { UserPlus, Target, TrendingUp, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function LeadsGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <UserPlus className='h-8 w-8' />
          Leads Management
        </h2>
        <p className='text-muted-foreground mt-2'>
          Manage your sales pipeline and convert leads into shipments.
        </p>
      </div>

      <TutorialCard
        title='Creating & Importing Leads'
        description='Add potential customers to your pipeline'
        defaultExpanded>
        <div className='space-y-4'>
          <h4 className='font-semibold'>Creating a Single Lead:</h4>
          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Navigate to <strong>Leads</strong> page
            </li>
            <li>
              Click <strong>"Create Lead"</strong>
            </li>
            <li>Fill in customer information (name, email, phone)</li>
            <li>Set lead status and priority</li>
            <li>Assign to a team member</li>
            <li>
              Click <strong>"Create"</strong>
            </li>
          </ol>

          <h4 className='font-semibold mt-4'>Importing Multiple Leads:</h4>
          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Click <strong>"Import"</strong> button
            </li>
            <li>Download the CSV template</li>
            <li>Fill in lead data</li>
            <li>Upload and confirm</li>
          </ol>

          <div className='mt-4'>
            <h4 className='font-semibold mb-2'>CSV Template:</h4>
            <CodeSnippet
              code={`name,email,phone,company,status,priority
John Doe,john@example.com,+1234567890,Acme Corp,new,high
Jane Smith,jane@example.com,+0987654321,Tech Inc,contacted,medium`}
              language='csv'
            />
          </div>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Lead Qualification Workflow'
        description='Move leads through your sales pipeline'
        icon={<Target className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Leads progress through different stages:</p>

          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Badge>New</Badge>
              <span className='text-sm'>
                → Initial contact, needs qualification
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge className='bg-blue-500'>Contacted</Badge>
              <span className='text-sm'>
                → First contact made, gathering requirements
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge className='bg-purple-500'>Qualified</Badge>
              <span className='text-sm'>
                → Meets criteria, ready for proposal
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge className='bg-green-500'>Converted</Badge>
              <span className='text-sm'>→ Converted to shipment/customer</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>Lost</Badge>
              <span className='text-sm'>
                → Not interested or went with competitor
              </span>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Tip:</strong> Use the Kanban board view to drag and drop
              leads between stages.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Converting Leads to Shipments'
        description='Turn qualified leads into customers'>
        <div className='space-y-4'>
          <p>When a lead is ready to ship:</p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>Open the lead details</li>
            <li>
              Click <strong>"Convert to Shipment"</strong>
            </li>
            <li>Lead information auto-fills the shipment form</li>
            <li>Add tracking number and carrier</li>
            <li>
              Click <strong>"Create Shipment"</strong>
            </li>
            <li>Lead status automatically updates to "Converted"</li>
          </ol>

          <Alert>
            <AlertDescription>
              The converted shipment will be linked to the original lead for
              tracking conversion metrics.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Lead Analytics'
        description='Track conversion rates and performance'
        icon={<TrendingUp className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Monitor your sales pipeline performance:</p>

          <div className='grid gap-3 md:grid-cols-2'>
            <div className='p-3 border rounded-lg'>
              <h4 className='font-semibold text-sm'>Conversion Rate</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                Percentage of leads converted to shipments
              </p>
            </div>
            <div className='p-3 border rounded-lg'>
              <h4 className='font-semibold text-sm'>Average Time to Convert</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                How long it takes from lead creation to conversion
              </p>
            </div>
            <div className='p-3 border rounded-lg'>
              <h4 className='font-semibold text-sm'>Lead Source Performance</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                Which sources generate the best leads
              </p>
            </div>
            <div className='p-3 border rounded-lg'>
              <h4 className='font-semibold text-sm'>Team Performance</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                Individual team member conversion rates
              </p>
            </div>
          </div>
        </div>
      </TutorialCard>
    </div>
  );
}
