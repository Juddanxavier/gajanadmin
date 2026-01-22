/** @format */

'use client';

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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { getEmailTemplates, updateEmailTemplate } from './actions';

interface EmailTemplate {
  id: string;
  type: string;
  subject_template: string;
  heading_template: string;
  body_template: string;
  is_active: boolean;
}

const TEMPLATE_Types = [
  { value: 'shipment_status', label: 'Shipment Status Update' },
  { value: 'shipment_delivered', label: 'Shipment Delivered' },
  { value: 'shipment_exception', label: 'Shipment Exception' },
];

export function EmailTemplatesSettings({ tenantId }: { tenantId?: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState('shipment_status');
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(
    null,
  );

  useEffect(() => {
    loadTemplates();
  }, [tenantId]);

  useEffect(() => {
    // If templates have loaded (or even if empty), try to find selected
    const found = templates.find((t) => t.type === selectedType);
    if (found) {
      setCurrentTemplate(found);
    } else {
      // Reset to defaults or empty if not found, allowing creation
      setCurrentTemplate({
        id: 'new',
        type: selectedType,
        subject_template: '',
        heading_template: '',
        body_template: '',
        is_active: true,
      });
    }
  }, [selectedType, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    const result = await getEmailTemplates(tenantId);
    if (result.success) {
      setTemplates(result.data || []);

      // Initialize selected
      const found = (result.data || []).find(
        (t: any) => t.type === selectedType,
      );
      if (found) setCurrentTemplate(found);
      else {
        // If switching tenants and template type exists but not created yet, reset
        setCurrentTemplate({
          id: 'new',
          type: selectedType,
          subject_template: '',
          heading_template: '',
          body_template: '',
          is_active: true,
        });
      }
    } else {
      toast.error('Failed to load email templates');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    setSaving(true);

    // ... logic ...
    const result = await updateEmailTemplate(
      currentTemplate.id,
      {
        // ... fields ...
        type: currentTemplate.type,
        subject_template: currentTemplate.subject_template,
        heading_template: currentTemplate.heading_template,
        body_template: currentTemplate.body_template,
        is_active: currentTemplate.is_active,
      },
      tenantId,
    ); // Pass tenantId here

    if (result.success) {
      // ... success logic ...
      toast.success('Template saved successfully');
      // Update local state
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.type === currentTemplate.type);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = result.data;
          return newArr;
        } else {
          return [...prev, result.data];
        }
      });
      setCurrentTemplate(result.data);
    } else {
      toast.error(result.error || 'Failed to save template');
    }
    setSaving(false);
  };
  // ... rest of component ...

  const handleChange = (field: keyof EmailTemplate, value: any) => {
    if (!currentTemplate) return;
    setCurrentTemplate({ ...currentTemplate, [field]: value });
  };

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize the content of your automated emails.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0'>
            <div className='w-full md:w-1/3'>
              <Label htmlFor='template-type'>Select Template</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id='template-type'>
                  <SelectValue placeholder='Select template' />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_Types.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-4 pt-4 border-t'>
            {currentTemplate && (
              <>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='is_active'>Enable this notification</Label>
                  <Switch
                    id='is_active'
                    checked={currentTemplate.is_active}
                    onCheckedChange={(checked) =>
                      handleChange('is_active', checked)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='subject'>Subject Line</Label>
                  <Input
                    id='subject'
                    value={currentTemplate.subject_template}
                    onChange={(e) =>
                      handleChange('subject_template', e.target.value)
                    }
                    placeholder='e.g. Shipment Update: {{tracking_number}}'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Available variables:{' '}
                    {
                      '{{recipient_name}}, {{tracking_number}}, {{status}}, {{company_name}}'
                    }
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='heading'>Heading</Label>
                  <Input
                    id='heading'
                    value={currentTemplate.heading_template || ''}
                    onChange={(e) =>
                      handleChange('heading_template', e.target.value)
                    }
                    placeholder='e.g. Your shipment is on the way!'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='body'>Message Body</Label>
                  <Textarea
                    id='body'
                    value={currentTemplate.body_template || ''}
                    onChange={(e) =>
                      handleChange('body_template', e.target.value)
                    }
                    placeholder='Enter your custom message here...'
                    className='min-h-[150px]'
                  />
                  <p className='text-xs text-muted-foreground'>
                    This content replaces the default message paragraph.
                  </p>
                </div>

                <div className='flex justify-end space-x-2 pt-4'>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Save className='mr-2 h-4 w-4' />
                    )}
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
