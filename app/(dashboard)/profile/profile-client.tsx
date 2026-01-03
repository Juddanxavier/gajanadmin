'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Mail, Phone, MapPin, Calendar, Package, Users, Loader2, Lock, Edit2, Check, X, Building2 } from 'lucide-react';
import type { UserProfile, ProfileStats } from '@/lib/types';
import { updateProfileAction, uploadAvatarAction, changePasswordAction } from "@/app/(dashboard)/profile/actions";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { getUserGradient } from '@/lib/utils';

interface ProfileClientProps {
  userId: string;
  userEmail: string;
}

export default function ProfileClient({ userId, userEmail }: ProfileClientProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get gradient for this user
  const gradient = getUserGradient(userId);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileModule, statsModule] = await Promise.all([
          import('@/app/(dashboard)/profile/actions').then(m => m.getCurrentProfileAction()),
          import('@/app/(dashboard)/profile/actions').then(m => m.getProfileStatsAction()),
        ]);

        if (profileModule.success) {
          setProfile(profileModule.data);
          setDisplayName(profileModule.data.display_name || '');
          setPhone(profileModule.data.phone || '');
          setCompany(profileModule.data.company || '');
          setAddress(profileModule.data.address || '');
          setCity(profileModule.data.city || '');
          setCountry(profileModule.data.country || '');
        }
        if (statsModule.success) setStats(statsModule.data);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await uploadAvatarAction(formData);

      if (result.success && profile) {
        setProfile({ ...profile, avatar_url: result.data.url });
        toast({ title: 'Success', description: 'Profile picture updated' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to upload', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const result = await updateProfileAction({ 
        display_name: displayName, 
        phone,
        company,
        address,
        city,
        country,
      });

      if (result.success && profile) {
        setProfile({ ...profile, display_name: displayName, phone, company, address, city, country });
        setEditingProfile(false);
        toast({ title: 'Success', description: 'Profile updated' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await changePasswordAction({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });

      if (result.success) {
        toast({ title: 'Success', description: 'Password updated' });
        setEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to change password', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Cover & Profile Picture - Social Media Style */}
      <Card className="overflow-hidden border-none shadow-md">
        {/* Cover Photo with Animated Gradient */}
        <div 
          className="h-48 relative animate-gradient" 
          style={{ 
            background: gradient,
            backgroundSize: '200% 200%',
          }}
        >
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile Section */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 -mt-20 relative">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-3xl text-white" style={{ background: gradient }}>
                  {getInitials(profile?.display_name || null, userEmail)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
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
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 pt-16 sm:pt-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{profile?.display_name || 'User'}</h1>
                  {profile?.company && (
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{userEmail}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {(profile?.city || profile?.country) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {stats?.member_since ? formatDistanceToNow(new Date(stats.member_since), { addSuffix: true }) : 'recently'}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.total_shipments || 0}</div>
                  <div className="text-xs text-muted-foreground">Shipments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
                  <div className="text-xs text-muted-foreground">Leads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile Card */}
      {editingProfile && (
        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Profile</h2>
            <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProfileSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingProfile(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Security Card */}
      <Card className="p-6 border-none shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          {!editingPassword && (
            <Button variant="outline" size="sm" onClick={() => setEditingPassword(true)}>
              Change Password
            </Button>
          )}
        </div>

        {editingPassword ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePasswordSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
              <Button variant="outline" onClick={() => setEditingPassword(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keep your account secure by using a strong password and changing it regularly.
          </p>
        )}
      </Card>
    </div>
  );
}
