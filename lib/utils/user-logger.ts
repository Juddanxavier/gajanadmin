/**
 * User Management Logger
 * Centralized logging for user operations
 *
 * @format
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  email?: string;
  role?: string;
  tenant?: string | null;
  [key: string]: any;
}

class UserLogger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const prefix = `[UserManagement][${level.toUpperCase()}]`;

    if (context) {
      console.log(`${prefix} ${message}`, {
        timestamp,
        ...context,
      });
    } else {
      console.log(`${prefix} ${message}`, { timestamp });
    }
  }

  created(
    userId: string,
    creatorId: string,
    email: string,
    role: string,
    tenant?: string | null,
  ) {
    this.log('info', 'User created', {
      userId,
      creatorId,
      email,
      role,
      tenant: tenant || 'global',
    });
  }

  updated(userId: string, updaterId: string, changes: string[]) {
    this.log('info', 'User updated', {
      userId,
      updaterId,
      changes,
    });
  }

  deleted(userId: string, deletedBy: string) {
    this.log('info', 'User deleted', {
      userId,
      deletedBy,
    });
  }

  roleAssigned(
    userId: string,
    role: string,
    tenant: string | null,
    assignedBy: string,
  ) {
    this.log('info', 'Role assigned', {
      userId,
      role,
      tenant: tenant || 'global',
      assignedBy,
    });
  }

  tenantAssigned(userId: string, tenantId: string, assignedBy: string) {
    this.log('info', 'Tenant assigned', {
      userId,
      tenantId,
      assignedBy,
    });
  }

  error(operation: string, error: Error, context?: LogContext) {
    this.log('error', `${operation} failed: ${error.message}`, {
      ...context,
      errorStack: error.stack,
    });
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }
}

export const userLogger = new UserLogger();
