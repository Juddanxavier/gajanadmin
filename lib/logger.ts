export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private log(level: LogLevel, message: string, context?: any) {
    let errorContext = context;
    if (context instanceof Error) {
      errorContext = {
        name: context.name,
        message: context.message,
        stack: context.stack,
        digest: (context as any).digest,
      };
      // Merge other properties
      Object.keys(context).forEach(key => {
        (errorContext as any)[key] = (context as any)[key];
      });
    }

    const entry: LogEntry = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context: errorContext,
    };

    // In development, pretty print
    if (process.env.NODE_ENV === 'development') {
      const color = 
        level === 'error' ? '\x1b[31m' : 
        level === 'warn' ? '\x1b[33m' : 
        level === 'info' ? '\x1b[36m' : '\x1b[90m';
      
      const logMsg = `${color}[${level.toUpperCase()}] ${message}\x1b[0m`;
      
      if (errorContext) {
        console[level](logMsg);
        // Explicitly JSON stringify to ensure it shows up in tools that capture stdout/stderr
        console[level](JSON.stringify(errorContext, null, 2));
      } else {
        console[level](logMsg);
      }
    } else {
        // In production, structured JSON logging
        console[level](JSON.stringify(entry));
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
