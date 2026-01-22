/** @format */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Globe,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getUserGradient } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/country-flag';
import { useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ProfileHeaderProps {
  data: {
    userId: string;
    displayName: string;
    email: string;
    isEmailVerified?: boolean;
    phone?: string;
    company?: string;
    city?: string;
    country?: string;
    avatarUrl?: string;
    roles: string[];
    tenants: { name: string; countryCode?: string }[];
    isGlobalAdmin: boolean;
    joinedAt?: string;
    lastLogin?: string;
  };
  onAvatarUpload: (file: File) => void;
  uploading: boolean;
  editable: boolean;
}

export function ProfileHeader({
  data,
  onAvatarUpload,
  uploading,
  editable,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gradient = getUserGradient(data.userId);

  const handleAvatarClick = () => {
    if (editable && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarUpload(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='relative mb-8 rounded-xl overflow-hidden bg-card border shadow-sm'>
      {/* Cover Image - Gradient */}
      <div
        className='h-32 w-full absolute top-0 left-0 z-0'
        style={{ background: gradient }}
      />

      <div className='pt-20 px-6 pb-6 relative z-10'>
        <div className='flex flex-col md:flex-row gap-6 items-start'>
          {/* Avatar Section */}
          <div className='relative group'>
            <div
              className={`h-28 w-28 rounded-full border-4 border-card shadow-lg overflow-hidden bg-muted flex items-center justify-center relative ${editable ? 'cursor-pointer' : ''}`}
              onClick={handleAvatarClick}>
              <Avatar className='h-full w-full'>
                <AvatarImage src={data.avatarUrl} className='object-cover' />
                <AvatarFallback className='text-2xl font-bold bg-muted'>
                  {getInitials(data.displayName)}
                </AvatarFallback>
              </Avatar>

              {/* Upload Overlay */}
              {editable && (
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]'>
                  {uploading ? (
                    <Loader2 className='h-6 w-6 text-white animate-spin' />
                  ) : (
                    <Camera className='h-6 w-6 text-white' />
                  )}
                </div>
              )}
            </div>
            <input
              type='file'
              ref={fileInputRef}
              className='hidden'
              accept='image/*'
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {/* User Info Section */}
          <div className='flex-1 mt-2 space-y-2'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
                  {data.displayName}
                  {data.isGlobalAdmin && (
                    <ShieldCheck className='h-5 w-5 text-blue-500' /> // Using standard color for now
                  )}
                </h1>
                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                  @{data.email.split('@')[0]}
                  <span className='text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium'>
                    {data.roles.join(', ') || 'User'}
                  </span>
                </p>
              </div>

              {/* Stats/Badges Row */}
              <div className='flex flex-wrap gap-2'>
                {data.tenants.length > 0 && (
                  <div className='flex items-center -space-x-2 mr-2'>
                    {data.tenants.slice(0, 3).map((t, i) => (
                      <div
                        key={i}
                        className='h-8 w-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-bold'
                        title={t.name}>
                        {t.countryCode ? (
                          <CountryFlag
                            countryCode={t.countryCode}
                            className='h-4 w-4'
                          />
                        ) : (
                          t.name[0] || '?'
                        )}
                      </div>
                    ))}
                    {data.tenants.length > 3 && (
                      <div className='h-8 w-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs text-muted-foreground'>
                        +{data.tenants.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-muted-foreground mt-4'>
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4 opacity-70' />
                <span>{data.email}</span>
                {data.isEmailVerified && (
                  <CheckIcon className='h-3 w-3 text-green-500' />
                )}
              </div>
              {data.phone && (
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4 opacity-70' />
                  <span>{data.phone}</span>
                </div>
              )}
              {(data.city || data.country) && (
                <div className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4 opacity-70' />
                  <span>
                    {[data.city, data.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {data.company && (
                <div className='flex items-center gap-2'>
                  <Building2 className='h-4 w-4 opacity-70' />
                  <span>{data.company}</span>
                </div>
              )}
              {data.joinedAt && (
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 opacity-70' />
                  <span>
                    Joined {new Date(data.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}>
      <polyline points='20 6 9 17 4 12' />
    </svg>
  );
}
