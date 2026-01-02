'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Mail, Calendar } from 'lucide-react';
import type { UserProfile, ProfileStats } from '@/lib/types';
import { uploadAvatarAction } from '@/app/admin/profile/actions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  stats: ProfileStats | null;
  userEmail: string;
  onProfileUpdate: (profile: UserProfile) => void;
}

export default function ProfileHeader({
  profile,
  stats,
  userEmail,
  onProfileUpdate,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatarAction(formData);

      if (result.success && profile) {
        onProfileUpdate({ ...profile, avatar_url: result.data.url });
        toast({
          title: 'Success',
          description: 'Avatar updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to upload avatar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />

      <div className="px-6 pb-6">
        {/* Avatar & Name */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-4">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile?.display_name || null, userEmail)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="mb-2">
              <h2 className="text-2xl font-bold">
                {profile?.display_name || 'User'}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{userEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-muted-foreground mb-6">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats?.total_shipments || 0}</div>
            <div className="text-sm text-muted-foreground">Shipments</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
            <div className="text-sm text-muted-foreground">Leads</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>Member</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats?.member_since
                  ? formatDistanceToNow(new Date(stats.member_since), {
                      addSuffix: true,
                    })
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
