/** @format */

// Database types
export interface Role {
  id: string;
  name: string;
  description: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  created_by: string | null;
  role: Role;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  is_default: boolean;
  created_at: string;
  created_by: string | null;
  tenant: Tenant;
}

// Extended user type with relationships
export interface UserWithRelations {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_roles: UserRole[];
  user_tenants: UserTenant[];
}

// Computed user type for display
export interface UserDisplay {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  roles: Role[];
  tenants: Tenant[];
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

// Table filter types
export interface UserTableFilters {
  search?: string;
  role?: string;
  tenant?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Pagination and sorting
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

// Stats types
export interface UserStats {
  total: number;
  active: number; // Users who signed in last 30 days
  byRole: {
    admin: number;
    staff: number;
    customer: number;
  };
  byTenant: {
    [key: string]: number;
  };
}

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface RoleDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TenantDistribution {
  name: string;
  count: number;
}

// Role types
export type RoleName = 'admin' | 'staff' | 'customer';

// Form types
export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  phone?: string;
  role: RoleName; // Strict role name type
  tenant: string | null; // Allow NULL for global roles
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  phone?: string;
  roles?: string[]; // role IDs (keep as array for updates)
  tenants?: string[]; // tenant IDs (keep as array for updates)
}

// Server action response types
export type ActionResponse<T = any> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never; code?: string };

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pageCount: number;
}

// Lead types
export type LeadStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'archived'
  | 'deleted';

export interface Lead {
  id: string;
  customer_id: string;
  tenant_id: string;
  origin_country: string;
  destination_country: string;
  weight: number;
  value: number;
  goods_type: string;
  status: LeadStatus;

  // New fields
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  assigned_to?: string;
  assignee?: {
    name: string;
    email: string;
  };

  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_at?: string;
  archived_at?: string;
  deleted_at?: string;
  customer?: {
    email: string;
    name?: string;
    phone?: string;
  };
}

export interface LeadTableFilters {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ShipmentTableFilters {
  search?: string;
  status?: string;
  provider?: string;
  tenant?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// USER PROFILE TYPES (using Supabase Auth metadata)
// ============================================================================

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  theme: ThemePreference;
  created_at: string;
  last_sign_in_at: string | null;
}

// Form input types
export interface UpdateProfileInput {
  display_name?: string;
  bio?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  theme?: ThemePreference;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Profile stats
export interface ProfileStats {
  total_shipments: number;
  total_leads: number;
  member_since: string;
  last_active: string | null;
}
