/**
 * Standard response formatters
 */

import type { ApiResponse } from '@/domain/data';

export function successResponse<T>(data: T): ApiResponse<T> {
    return {
        success: true,
        data,
        timestamp: Date.now(),
    };
}

export function errorResponse(error: string, status = 400): Response {
    const body: ApiResponse = {
        success: false,
        error,
        timestamp: Date.now(),
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function jsonResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(successResponse(data)), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });
}
