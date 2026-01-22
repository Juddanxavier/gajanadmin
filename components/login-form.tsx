/** @format */

'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2 } from 'lucide-react';
import {
  signInWithMagicLinkAction,
  loginWithPassword,
} from '@/app/login/actions';

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  error?: string;
}

export function LoginForm({
  className,
  error: initialError,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);

  // Rate Limiting / Countdown
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();

  // Timer Effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const result = await loginWithPassword(formData);

      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      // Success! Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Magic Link Handler
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithMagicLinkAction(email);

      if (!result.success) {
        if (result.error?.includes('Rate limit')) {
          setCountdown(60);
        }
        throw new Error(result.error || 'Failed to send login link');
      }

      setIsLinkSent(true);
      setCountdown(60); // Start cooldown
    } catch (error: any) {
      setError(error.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='border-none shadow-xl bg-background/60 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-2xl'>Login</CardTitle>
          <CardDescription>Access your admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue='password'
            onValueChange={() => {
              setError(null);
              setIsLinkSent(false);
            }}>
            <TabsList className='grid w-full grid-cols-2 mb-6'>
              <TabsTrigger value='password'>Password</TabsTrigger>
              <TabsTrigger value='magic-link'>Magic Link</TabsTrigger>
            </TabsList>

            {/* PASSWORD TAB */}
            <TabsContent value='password'>
              <form onSubmit={handlePasswordLogin}>
                <div className='flex flex-col gap-6'>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='m@example.com'
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <div className='flex items-center'>
                      <Label htmlFor='password'>Password</Label>
                      <Link
                        href='/auth/forgot-password'
                        className='ml-auto inline-block text-sm underline-offset-4 hover:underline'>
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id='password'
                      type='password'
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <p className='text-sm text-red-500 font-medium'>{error}</p>
                  )}
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* MAGIC LINK TAB */}
            <TabsContent value='magic-link'>
              {!isLinkSent ? (
                <form onSubmit={handleMagicLink}>
                  <div className='flex flex-col gap-6'>
                    <div className='grid gap-2'>
                      <Label htmlFor='link-email'>Email</Label>
                      <Input
                        id='link-email'
                        type='email'
                        placeholder='m@example.com'
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {error && (
                      <p className='text-sm text-red-500 font-medium'>
                        {error}
                      </p>
                    )}
                    <Button
                      type='submit'
                      className='w-full'
                      disabled={isLoading || countdown > 0}>
                      {countdown > 0
                        ? `Resend in ${countdown}s`
                        : isLoading
                          ? 'Sending...'
                          : 'Send Login Link'}
                      {!isLoading && countdown === 0 && (
                        <Mail className='ml-2 h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className='flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-300'>
                  <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                    <CheckCircle2 className='h-6 w-6 text-green-600' />
                  </div>
                  <h3 className='text-lg font-semibold mb-2'>
                    Check your email
                  </h3>
                  <p className='text-muted-foreground text-sm mb-6 max-w-[250px]'>
                    We've sent a magic link to <strong>{email}</strong>. Click
                    the link to log in.
                  </p>

                  <Button
                    variant='outline'
                    onClick={() => setIsLinkSent(false)}
                    className='w-full'>
                    Use valid email
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
