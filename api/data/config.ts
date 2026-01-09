/**
 * GET /data/config
 * Returns app configuration with edge caching
 */

import { getAppConfig } from '@/services/data/config.service';
import { jsonResponse, errorResponse } from '@/shared/utils/response';
import { rateLimiter } from '@/infra/rate-limit/memory';
import { RATE_LIMIT, CACHE_DURATION } from '@/shared/constants';

export { runtime } from './_runtime';

export async function GET(request: Request): Promise<Response> {
    try {
        // Light rate limiting
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        const { allowed } = rateLimiter.check(
            `data:${clientIp}`,
            RATE_LIMIT.DATA.MAX,
            RATE_LIMIT.DATA.WINDOW_MS
        );

        if (!allowed) {
            return errorResponse('Rate limit exceeded', 429);
        }

        const config = await getAppConfig();

        // Transform to key-value object
        const configObj = config.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {} as Record<string, string>);

        return jsonResponse(configObj, 200, {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION.CONFIG}, stale-while-revalidate=${CACHE_DURATION.CONFIG * 2}`,
        });
    } catch (error) {
        console.error('Config fetch error:', error);
        return errorResponse('Failed to fetch configuration', 500);
    }
}
