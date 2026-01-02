# User Profile System

## Overview
Production-grade user profile system with social media-style features, comprehensive security, and privacy controls.

## Features Implemented

### ✅ Core Profile Features
- **Profile Information**
  - Display name, bio (500 char limit), phone number
  - Avatar upload with validation (5MB max, JPEG/PNG/WebP)
  - Profile visibility controls (public/team/private)
  - Timezone and theme preferences
  - Privacy toggles for email/phone visibility

### ✅ Security Features
- **Password Management**
  - Change password with current password verification
  - Password strength requirements (min 8 characters)
  - Security recommendations
- **Activity Logging**
  - Comprehensive audit trail of user actions
  - IP address and user agent tracking
  - Metadata storage for detailed activity context

### ✅ Notification Preferences
- **Channel Controls**
  - Email notifications toggle
  - Push notifications toggle
  - SMS notifications toggle
- **Digest Settings**
  - Instant, daily, weekly, or never
- **Event-Specific Preferences**
  - Shipment delivered/exception
  - Lead assigned/updated
  - Customizable per event type

### ✅ Activity Feed
- **Activity Summary**
  - Today's actions count
  - This week's actions count
  - This month's actions count
- **Recent Activity**
  - Last 10 actions with timestamps
  - Action type badges
  - Expandable metadata details

### ✅ Profile Stats
- Total shipments managed
- Total leads handled
- Notifications sent
- Member since date
- Last active timestamp

## Database Schema

### Tables Created
1. **user_profiles** - Core profile information
2. **notification_preferences** - User notification settings
3. **user_activity_log** - Audit trail of user actions

### Security Features
- Row Level Security (RLS) enabled on all tables
- Users can only view/edit their own data
- Team visibility based on tenant relationships
- Automatic profile creation on user signup

## File Structure

```
app/admin/profile/
├── page.tsx                    # Server component
├── profile-client.tsx          # Main client component with tabs
└── actions.ts                  # Server actions

components/profile/
├── profile-header.tsx          # Avatar, stats, cover
├── edit-profile-form.tsx       # Personal info form
├── security-settings.tsx       # Password change
├── notification-settings.tsx   # Notification preferences
└── activity-feed.tsx           # Activity log display

lib/services/
└── profile-service.ts          # Business logic

lib/types/
└── index.ts                    # TypeScript types (updated)

supabase/migrations/
└── 20251229180000_create_user_profiles.sql
```

## Usage

### Accessing the Profile Page
Navigate to `/admin/profile` in the application. The link is available in the sidebar.

### Updating Profile
1. Go to the "General" tab
2. Edit display name, bio, phone, timezone, theme
3. Adjust privacy settings
4. Click "Save Changes"

### Uploading Avatar
1. Click the camera icon on the avatar
2. Select an image (max 5MB, JPEG/PNG/WebP)
3. Avatar is automatically uploaded and updated

### Changing Password
1. Go to the "Security" tab
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click "Update Password"

### Managing Notifications
1. Go to the "Notifications" tab
2. Toggle notification channels (email/push/SMS)
3. Select digest frequency
4. Enable/disable specific event types
5. Click "Save Preferences"

### Viewing Activity
1. Go to the "Activity" tab
2. View activity summary cards
3. Scroll through recent actions
4. Click "View details" to see metadata

## Security Considerations

### Implemented
- ✅ File upload validation (size, type)
- ✅ Input sanitization (bio length, XSS prevention)
- ✅ Password verification before changes
- ✅ RLS policies for data access
- ✅ Activity logging for audit trail
- ✅ Secure session management (Supabase Auth)

### Best Practices
- Passwords are hashed by Supabase Auth
- Sensitive data is never exposed in client
- All mutations go through server actions
- File uploads are validated server-side
- Activity logs include IP and user agent

## API Reference

### Server Actions

#### `getCurrentProfileAction()`
Get current user's profile.

#### `updateProfileAction(updates: UpdateProfileInput)`
Update profile information.

#### `uploadAvatarAction(formData: FormData)`
Upload new avatar image.

#### `getNotificationPreferencesAction()`
Get notification preferences.

#### `updateNotificationPreferencesAction(updates: UpdateNotificationPreferencesInput)`
Update notification preferences.

#### `getProfileStatsAction()`
Get profile statistics.

#### `getActivitySummaryAction()`
Get activity summary.

#### `changePasswordAction(input: ChangePasswordInput)`
Change user password.

## Migration Instructions

1. **Apply the migration:**
   ```bash
   # Copy the migration file to Supabase
   # Run in Supabase SQL Editor or via CLI
   ```

2. **Create storage bucket (if not exists):**
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('avatars', 'avatars', true);
   ```

3. **Apply storage policies:**
   - Uncomment the storage policies in the migration file
   - Run them in Supabase SQL Editor

## Future Enhancements (Not Implemented)

- Two-Factor Authentication (2FA)
- Active sessions management
- Connected devices list
- Account deletion (soft delete implemented, full deletion not)
- Profile sharing links
- Cover photo upload
- Team directory integration
- @Mentions in comments

## Notes

- Profile is automatically created on user signup via trigger
- Avatar uploads use Supabase Storage
- Activity logging is automatic for profile-related actions
- All forms use React Hook Form + Zod validation
- UI uses Shadcn components for consistency
