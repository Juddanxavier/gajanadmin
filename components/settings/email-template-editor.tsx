/** @format */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Undo, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  getEmailTemplates,
  updateEmailTemplate,
} from '@/app/(dashboard)/settings/actions';

const TEMPLATE_TYPES = [
  {
    id: 'shipment_status',
    label: 'Status Update',
    description: 'Sent when shipment status changes',
  },
  {
    id: 'shipment_delivered',
    label: 'Delivered',
    description: 'Sent when shipment is delivered',
  },
  {
    id: 'shipment_exception',
    label: 'Exception',
    description: 'Sent when an exception occurs',
  },
];

const VARIABLES = [
  { key: '{{customer_name}}', label: 'Customer Name' },
  { key: '{{tracking_code}}', label: 'Tracking Number' },
  { key: '{{status}}', label: 'Status' },
  { key: '{{company_name}}', label: 'Company Name' },
  { key: '{{tracking_url}}', label: 'Tracking Link' },
];

export function EmailTemplateEditor({ tenantId }: { tenantId?: string }) {
  const [activeType, setActiveType] = useState('shipment_status');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>({
    subject_template: '',
    heading_template: '',
    body_template: '',
  });

  useEffect(() => {
    loadTemplates();
  }, [tenantId]);

  useEffect(() => {
    // Find template for active type or use default empty
    const found = templates.find((t) => t.type === activeType);
    if (found) {
      setCurrentTemplate({ ...found });
    } else {
      // Defaults if not found based on seed
      setCurrentTemplate({
        subject_template: 'Shipment Update: {{tracking_code}}',
        heading_template: 'Update for {{tracking_code}}',
        body_template: 'Your shipment status has updated to {{status}}.',
        type: activeType,
        is_new: true,
      });
    }
  }, [activeType, templates]);

  async function loadTemplates() {
    setLoading(true);
    const result = await getEmailTemplates(tenantId);
    if (result.success && result.data) {
      setTemplates(result.data);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const isNew = currentTemplate.is_new;
      const updates = {
        type: activeType,
        subject_template: currentTemplate.subject_template,
        heading_template: currentTemplate.heading_template,
        body_template: currentTemplate.body_template,
      };

      const result = await updateEmailTemplate(
        isNew ? 'new' : currentTemplate.id,
        updates,
        tenantId,
      );

      if (result.success) {
        toast.success(`Template for ${activeType} saved!`);
        // Reload to get IDs
        loadTemplates();
      } else {
        toast.error('Failed to save template');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  }

  const insertVariable = (variable: string) => {
    // Simple append for now, or copy to clipboard
    // In a real rich text editor we would insert at cursor
    navigator.clipboard.writeText(variable);
    toast.info(`Copied ${variable} to clipboard`);
  };

  if (loading && templates.length === 0) {
    return (
      <div className='p-8 flex justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-1 space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Template Type</CardTitle>
            <CardDescription>Select which email to edit</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {TEMPLATE_TYPES.map((type) => (
              <Button
                key={type.id}
                variant={activeType === type.id ? 'default' : 'outline'}
                className='w-full justify-start'
                onClick={() => setActiveType(type.id)}>
                <div className='flex flex-col items-start text-left'>
                  <span className='font-semibold'>{type.label}</span>
                  <span className='text-xs opacity-70'>{type.description}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>Click to copy</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            {VARIABLES.map((v) => (
              <BadgeButton
                key={v.key}
                label={v.key}
                onClick={() => insertVariable(v.key)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className='lg:col-span-2'>
        <Card>
          <CardHeader>
            <CardTitle>
              Editor: {TEMPLATE_TYPES.find((t) => t.id === activeType)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Subject Line</Label>
              <Input
                value={currentTemplate.subject_template || ''}
                onChange={(e) =>
                  setCurrentTemplate({
                    ...currentTemplate,
                    subject_template: e.target.value,
                  })
                }
                placeholder='Shipment Update: {{tracking_code}}'
              />
            </div>
            <div className='space-y-2'>
              <Label>Heading (Optional)</Label>
              <Input
                value={currentTemplate.heading_template || ''}
                onChange={(e) =>
                  setCurrentTemplate({
                    ...currentTemplate,
                    heading_template: e.target.value,
                  })
                }
                placeholder='Your package is on the way'
              />
            </div>
            <div className='space-y-2'>
              <Label>Body Content</Label>
              <Textarea
                className='min-h-[200px] font-mono text-sm'
                value={currentTemplate.body_template || ''}
                onChange={(e) =>
                  setCurrentTemplate({
                    ...currentTemplate,
                    body_template: e.target.value,
                  })
                }
              />
              <p className='text-xs text-muted-foreground'>
                HTML and basic styling is supported.
              </p>
            </div>

            <div className='flex justify-end pt-4'>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                <Save className='mr-2 h-4 w-4' />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BadgeButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className='inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'>
      {label}
    </button>
  );
}
