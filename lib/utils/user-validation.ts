/**
 * User Management Validation Utilities
 * Centralized validation for user operations
 *
 * @format
 */

import { RoleName } from '@/lib/types';

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must contain uppercase, lowercase, and number',
    };
  }

  return { valid: true };
}

/**
 * Validate role name
 */
export function validateRole(role: string): { valid: boolean; error?: string } {
  const validRoles: RoleName[] = ['admin', 'staff', 'customer'];

  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Role is required' };
  }

  if (!validRoles.includes(role as RoleName)) {
    return {
      valid: false,
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): { valid: boolean; error?: string } {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  if (!UUID_REGEX.test(uuid)) {
    return { valid: false, error: 'Invalid ID format' };
  }

  return { valid: true };
}

/**
 * Validate tenant ID (can be null for global roles)
 */
export function validateTenantId(
  tenantId: string | null,
  allowNull: boolean = true,
): { valid: boolean; error?: string } {
  // Treat empty string, null, and 'none' as null
  if (
    !tenantId ||
    tenantId === null ||
    tenantId === 'none' ||
    tenantId === ''
  ) {
    return allowNull
      ? { valid: true }
      : { valid: false, error: 'Tenant is required' };
  }

  return validateUUID(tenantId);
}

/**
 * Validate phone number (basic E.164 format)
 */
export function validatePhone(phone: string): {
  valid: boolean;
  error?: string;
} {
  if (!phone) return { valid: true }; // Optional field

  const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

  if (!PHONE_REGEX.test(phone.replace(/[\s-]/g, ''))) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true };
}

/**
 * Validate user creation input
 */
export function validateCreateUserInput(input: {
  email: string;
  password: string;
  role: string;
  tenant: string | null;
  phone?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const emailCheck = validateEmail(input.email);
  if (!emailCheck.valid) errors.push(emailCheck.error!);

  const passwordCheck = validatePassword(input.password);
  if (!passwordCheck.valid) errors.push(passwordCheck.error!);

  const roleCheck = validateRole(input.role);
  if (!roleCheck.valid) errors.push(roleCheck.error!);

  const tenantCheck = validateTenantId(input.tenant, true);
  if (!tenantCheck.valid) errors.push(tenantCheck.error!);

  if (input.phone) {
    const phoneCheck = validatePhone(input.phone);
    if (!phoneCheck.valid) errors.push(phoneCheck.error!);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
