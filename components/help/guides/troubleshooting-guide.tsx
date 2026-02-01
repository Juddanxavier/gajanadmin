/** @format */

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, MessageSquare, BookOpen, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductTour } from '@/components/help/product-tour';

export function TroubleshootingGuide() {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Troubleshooting</h2>
          <p className='text-muted-foreground mt-2'>
            Solutions for common issues and frequently asked questions.
          </p>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card className='border-orange-200 dark:border-orange-900'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-orange-500' />
              <CardTitle>Common Issues</CardTitle>
            </div>
            <CardDescription>Quick fixes for frequent problems</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4'>
              <div className='flex gap-4 items-start p-4 rounded-lg border bg-card'>
                <div className='h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold'>
                  1
                </div>
                <div>
                  <h4 className='font-semibold'>Emails not received</h4>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Check <strong>Notifications {'>'} Logs</strong>. If status
                    is 'Sent', check Spam folder. If 'Failed', verify API keys
                    in Settings.
                  </p>
                </div>
              </div>

              <div className='flex gap-4 items-start p-4 rounded-lg border bg-card'>
                <div className='h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold'>
                  2
                </div>
                <div>
                  <h4 className='font-semibold'>Shipment status stuck</h4>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Auto-sync runs every minute but relies on carrier updates.
                    Verify tracking number on carrier website directly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <MessageSquare className='h-5 w-5 text-blue-500' />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type='single' collapsible className='w-full'>
              <AccordionItem value='faq-1'>
                <AccordionTrigger>How many users can I add?</AccordionTrigger>
                <AccordionContent>
                  The current plan supports unlimited users. Go to the Users
                  page to invite more team members.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='faq-2'>
                <AccordionTrigger>Can I export my data?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can export shipments and leads to CSV/Excel format
                  from their respective pages using the "Export" button.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='faq-3'>
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent>
                  Yes, data is encrypted at rest and in transit. We use
                  role-based access control to ensure users only see what
                  they're authorized to see.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2 mt-8'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-md'>Contact Technical Support</CardTitle>
            <CardDescription>For system bugs or errors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' className='w-full sm:w-auto gap-2'>
              <MessageSquare className='h-4 w-4' /> Email Tech Support
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-md'>Developer Documentation</CardTitle>
            <CardDescription>API references and integrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' className='w-full sm:w-auto gap-2'>
              <Code className='h-4 w-4' /> View API Docs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
