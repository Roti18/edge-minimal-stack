import { z } from 'zod';

/**
 * Request Validation Utilities
 */

export async function validateRequest<T>(
    request: Request,
    schemas: {
        body?: z.ZodType<T>;
        query?: z.ZodType<any>;
        params?: z.ZodType<any>;
    }
) {
    const results: any = {};
    const url = new URL(request.url);

    try {
        if (schemas.query) {
            results.query = schemas.query.parse(Object.fromEntries(url.searchParams));
        }

        if (schemas.body) {
            const body = await request.clone().json();
            results.body = schemas.body.parse(body);
        }

        return { success: true, data: results };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Validation failed',
                details: error.issues.map(e => ({ path: e.path, message: e.message }))
            };
        }
        return { success: false, error: 'Malformed request' };
    }
}

/**
 * Common reusable schemas
 */
export const CommonSchemas = {
    id: z.string().uuid().or(z.number()),
    pagination: z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
    }),
};
