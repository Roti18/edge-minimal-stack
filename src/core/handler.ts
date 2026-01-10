import { z } from 'zod';
import { checkRateLimit } from '@/infra/rate-limit/distributed';
import { validateRequest } from '@/shared/validator';
import { errorResponse, jsonResponse } from '@/shared/utils/response';
import { getConfig, CONFIG_KEYS } from '@/infra/config/edge-config';

interface HandlerConfig<B = any, Q = any> {
    rateLimit?: {
        max: number;
        windowMs: number;
        key?: string;
    };
    schema?: {
        body?: z.ZodType<B>;
        query?: z.ZodType<Q>;
    };
    handler: (ctx: {
        req: Request;
        body: B;
        query: Q;
        clientIp: string
    }) => Promise<Response | any>; // Allow returning plain objects
}

/**
 * Higher-order function to create standardized API handlers.
 */
export function createHandler<B, Q>(config: HandlerConfig<B, Q>) {
    return async (req: Request): Promise<Response> => {
        const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

        try {
            // 1. Maintenance Mode
            const isMaintenance = await getConfig(CONFIG_KEYS.MAINTENANCE_MODE, false);
            if (isMaintenance) {
                return errorResponse('System is under maintenance', 503);
            }

            // 2. Rate Limiting
            if (config.rateLimit) {
                const limitKey = config.rateLimit.key || `rl:${clientIp}`;
                const { success } = await checkRateLimit(limitKey, {
                    max: config.rateLimit.max,
                    windowMs: config.rateLimit.windowMs,
                });
                if (!success) {
                    return errorResponse('Too many requests', 429);
                }
            }

            // 3. Validation
            let body: any = {};
            let query: any = {};

            if (config.schema) {
                const validation = await validateRequest(req, config.schema);
                if (!validation.success) {
                    return errorResponse(validation.error || 'Invalid Request', 400);
                }
                body = validation.data.body;
                query = validation.data.query;
            }

            // 4. Execution
            const result = await config.handler({ req, body, query, clientIp });

            // 5. Response Wrapping
            if (result instanceof Response) {
                return result;
            }
            return jsonResponse(result);

        } catch (error: any) {
            console.error('[Handler Error]:', error);
            const status = error.status || (error.message.includes('authenticated') ? 401 : 500);
            return errorResponse(
                process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
                status
            );
        }
    };
}
