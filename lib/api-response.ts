import { ActionResponse } from "@/lib/types";

export type { ActionResponse };

export function successResponse<T>(data: T): ActionResponse<T> {
  return { success: true, data }
}

export function errorResponse(error: unknown, code?: string): ActionResponse<any> {
    console.error('[API Error]', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: message, code }
}

export class AppError extends Error {
    constructor(message: string, public code?: string) {
        super(message)
    }
}
