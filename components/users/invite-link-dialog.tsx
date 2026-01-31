/** @format */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  Mail,
  UserPlus,
  Send,
} from 'lucide-react';
import {
  inviteUserByEmailAction,
  generateInviteLinkAction,
  getUserDefaultTenant,
} from '@/app/(dashboard)/users/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role, Tenant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGlobalAdmin?: boolean;
  roles?: Role[];
  tenants?: Tenant[];
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  isGlobalAdmin = false,
  roles = [],
  tenants = [],
}: InviteLinkDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('customer');
  const [tenant, setTenant] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set defaults when opening

  // Reset/Init defaults
  const resetDefaults = () => {
    setEmail('');
    setInviteLink(null);
    setEmailSent(false);
    setCopied(false);

    if (!isGlobalAdmin) {
      setRole('customer');
      getUserDefaultTenant().then((tid) => setTenant(tid || null));
    } else {
      setRole('customer'); // Default for admin too?
      setTenant(null); // Global default
    }
  };

  // React to open change to reset
  // Using useEffect to handle open prop changes if needed, or just onOpenChange wrapper
  // But since we have internal state, better to reset on open.
  // We'll trust the user resets via handleClose/handleReset for now or add effect.

  // Effect to set defaults on load/prop change

  useEffect(() => {
    if (open) {
      if (!isGlobalAdmin) {
        setRole('customer');
        getUserDefaultTenant().then((tid) => setTenant(tid || null));
      }
    }
  }, [open, isGlobalAdmin]);

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await inviteUserByEmailAction(
        email,
        role,
        tenant || undefined,
      );

      if (result.success) {
        setEmailSent(true);
        toast({
          title: 'Success',
          description: 'Invitation sent successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send invite email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invite email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateInviteLinkAction(
        email,
        role,
        tenant || undefined,
      );

      if (result.success && result.data) {
        setInviteLink(result.data);
        toast({
          title: 'Success',
          description: 'Invite link generated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate invite link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invite link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Invite link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    resetDefaults();
    onOpenChange(false);
  };

  const handleReset = () => {
    resetDefaults();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5' />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invite email or generate a link to share manually
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {!inviteLink && !emailSent ? (
            <div className='space-y-4'>
              <div className='rounded-lg border p-4 bg-muted/50'>
                <div className='flex items-start gap-3'>
                  <Mail className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>
                      Two ways to invite users:
                    </p>
                    <ul className='text-sm text-muted-foreground space-y-1 list-disc list-inside'>
                      <li>
                        <strong>Send Email:</strong> Automatically sends an
                        invite email via ZeptoMail
                      </li>
                      <li>
                        <strong>Generate Link:</strong> Creates a link you can
                        copy and share manually
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>User Email Address</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='user@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendEmail();
                    }
                  }}
                />
              </div>

              {isGlobalAdmin && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='admin'>Admin</SelectItem>
                        <SelectItem value='staff'>Staff</SelectItem>
                        <SelectItem value='customer'>Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Tenant</Label>
                    <Select
                      value={tenant || 'none'}
                      onValueChange={(v) => setTenant(v === 'none' ? null : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select tenant' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>None (Global)</SelectItem>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.code} {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-2 gap-2'>
                <Button
                  onClick={handleSendEmail}
                  disabled={loading || !email}
                  className='w-full'>
                  {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  <Send className='mr-2 h-4 w-4' />
                  Send Email
                </Button>
                <Button
                  variant='outline'
                  onClick={handleGenerateLink}
                  disabled={loading || !email}
                  className='w-full'>
                  {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  <LinkIcon className='mr-2 h-4 w-4' />
                  Generate Link
                </Button>
              </div>
            </div>
          ) : emailSent ? (
            <div className='space-y-4'>
              <div className='rounded-lg border border-green-500/20 bg-green-500/10 p-4'>
                <div className='flex items-start gap-3'>
                  <Check className='h-5 w-5 text-green-600 mt-0.5' />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium text-green-600'>
                      Invitation email sent!
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      An invite email has been sent to <strong>{email}</strong>.
                      They will receive an email with a link to set up their
                      account.
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={handleReset}
                  className='flex-1'>
                  Invite Another User
                </Button>
                <Button onClick={handleClose} className='flex-1'>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-lg border border-green-500/20 bg-green-500/10 p-4'>
                <div className='flex items-start gap-3'>
                  <Check className='h-5 w-5 text-green-600 mt-0.5' />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium text-green-600'>
                      Invite link generated!
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Share this link with <strong>{email}</strong>. They can
                      use it to create their account.
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Invite Link</Label>
                <div className='flex gap-2'>
                  <Input
                    value={inviteLink || ''}
                    readOnly
                    className='font-mono text-xs'
                  />
                  <Button variant='outline' size='icon' onClick={handleCopy}>
                    {copied ? (
                      <Check className='h-4 w-4 text-green-600' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  This link can only be used once and will expire after 24
                  hours.
                </p>
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={handleReset}
                  className='flex-1'>
                  Invite Another User
                </Button>
                <Button onClick={handleClose} className='flex-1'>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
