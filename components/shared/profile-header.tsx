/** @format */

'use client';

import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Globe,
  ShieldCheck,
  User,
  BadgeCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { CountryFlag } from '@/components/ui/country-flag';
import { getUserGradient } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ProfileHeaderData {
  userId: string;
  displayName: string;
  email: string;
  isEmailVerified?: boolean;
  avatarUrl?: string | null;
  company?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  roles: string[];
  tenants: { name: string; countryCode?: string }[];
  isGlobalAdmin: boolean;
  joinedAt?: string | null;
  lastLogin?: string | null;
}

interface ProfileHeaderProps {
  data: ProfileHeaderData;
  onAvatarUpload?: (file: File) => Promise<void>;
  uploading?: boolean;
  editable?: boolean;
}

export function ProfileHeader({
  data,
  onAvatarUpload,
  uploading = false,
  editable = false,
}: ProfileHeaderProps) {
  const gradient = getUserGradient(data.userId);

  const getInitials = (name: string, email: string) => {
    if (name)
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return email.slice(0, 2).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  return (
    <Card className='overflow-hidden border-none shadow-md'>
      {/* Cover Photo with Animated Gradient */}
      <div
        className='h-48 relative animate-gradient'
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
        }}>
        <div className='absolute inset-0 bg-black/10' />
      </div>

      {/* Profile Section */}
      <div className='px-6 pb-6'>
        <div className='flex flex-col sm:flex-row gap-4 -mt-20 relative'>
          {/* Avatar */}
          <div className='relative group'>
            <Avatar className='h-32 w-32 border-4 border-background shadow-xl'>
              <AvatarImage src={data.avatarUrl || undefined} />
              <AvatarFallback
                className='text-3xl text-white'
                style={{ background: gradient }}>
                {getInitials(data.displayName || '', data.email)}
              </AvatarFallback>
            </Avatar>

            {editable && (
              <>
                <label
                  htmlFor='avatar-upload'
                  className='absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform'>
                  <Camera className='h-4 w-4' />
                  <input
                    id='avatar-upload'
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='hidden'
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/60 rounded-full'>
                    <Loader2 className='h-6 w-6 text-white animate-spin' />
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Info */}
          <div className='flex-1 pt-16 sm:pt-4'>
            <div className='space-y-2'>
              {/* Name & Role */}
              <div className='flex items-center gap-3 mb-0.5'>
                <h1 className='text-2xl font-bold leading-none'>
                  {data.displayName || 'User'}
                </h1>
                {/* Global Admin Badge */}
                {data.isGlobalAdmin && (
                  <Badge
                    variant='default'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground gap-1 px-2 h-6'>
                    <Globe className='h-3 w-3' />{' '}
                    <span className='text-[10px] uppercase font-bold tracking-wider'>
                      Global Admin
                    </span>
                  </Badge>
                )}

                {/* Role Badges */}
                {data.roles?.map((role) => (
                  <Badge
                    key={role}
                    variant='destructive'
                    className='gap-1 px-2 h-6 capitalize'>
                    {role === 'admin' ? (
                      <ShieldCheck className='h-3 w-3' />
                    ) : (
                      <User className='h-3 w-3' />
                    )}
                    <span className='text-[10px] uppercase font-bold tracking-wider'>
                      {role}
                    </span>
                  </Badge>
                ))}
              </div>

              {/* Email | Joined | Last Login */}
              <div className='flex flex-wrap items-center gap-2 text-foreground/90 font-medium mb-4 text-sm'>
                <div className='flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group/email'>
                  <Mail className='h-3.5 w-3.5' />
                  <span>{data.email}</span>
                  {data.isEmailVerified && (
                    <div title='Email Verified'>
                      <BadgeCheck className='h-4 w-4 text-green-500 fill-green-500/10' />
                    </div>
                  )}
                </div>

                {data.joinedAt && (
                  <>
                    <span className='text-muted-foreground/40 text-lg font-light hidden sm:inline'>
                      |
                    </span>
                    <div className='flex items-center gap-1.5 hover:text-primary transition-colors'>
                      <Calendar className='h-3.5 w-3.5' />
                      <span>
                        Joined{' '}
                        {formatDistanceToNow(new Date(data.joinedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </>
                )}

                {data.lastLogin && (
                  <>
                    <span className='text-muted-foreground/40 text-lg font-light hidden sm:inline'>
                      |
                    </span>
                    <div className='flex items-center gap-1.5 hover:text-primary transition-colors'>
                      <Calendar className='h-3.5 w-3.5' />
                      <span>
                        Last login{' '}
                        {formatDistanceToNow(new Date(data.lastLogin), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Badges Row (Tenant, Company, Phone, Location) */}
              <div className='flex flex-wrap gap-2'>
                {/* Tenant Badge */}
                {data.tenants && data.tenants.length > 0 && (
                  <Badge
                    variant='outline'
                    className='gap-1.5 px-1.5 h-5 text-[10px] bg-background hover:bg-muted/50 transition-colors'>
                    {data.tenants[0].countryCode && (
                      <CountryFlag
                        countryCode={data.tenants[0].countryCode}
                        className='h-2.5 w-3.5 rounded-[1px] shadow-sm'
                      />
                    )}
                    <span className='font-medium text-foreground'>
                      {data.tenants[0].name}
                    </span>
                  </Badge>
                )}

                {/* Company Badge */}
                {data.company && (
                  <Badge
                    variant='outline'
                    className='gap-1.5 px-1.5 h-5 text-[10px] bg-background text-foreground/80 font-normal hover:bg-muted/50 transition-colors'>
                    <Building2 className='h-3 w-3' />
                    <span>{data.company}</span>
                  </Badge>
                )}

                {/* Phone Badge */}
                {data.phone && (
                  <Badge
                    variant='outline'
                    className='gap-1.5 px-1.5 h-5 text-[10px] bg-background text-foreground/80 font-normal hover:bg-muted/50 transition-colors'>
                    <Phone className='h-3 w-3' />
                    <span>{data.phone}</span>
                  </Badge>
                )}

                {/* Location Badge */}
                {(data.city || data.country) && (
                  <Badge
                    variant='outline'
                    className='gap-1.5 px-1.5 h-5 text-[10px] bg-background text-foreground/80 font-normal hover:bg-muted/50 transition-colors'>
                    <MapPin className='h-3 w-3' />
                    <span>
                      {[
                        data.city,
                        <span
                          key='country'
                          className='inline-flex items-center gap-1'>
                          {data.country && data.country.length === 2 && (
                            <CountryFlag
                              countryCode={data.country}
                              className='h-2.5 w-4 rounded-[1px]'
                            />
                          )}
                          {data.country}
                        </span>,
                      ]
                        .filter(Boolean)
                        .reduce(
                          (prev, curr) =>
                            (prev ? [prev, ', ', curr] : [curr]) as any,
                          null
                        )}
                    </span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
