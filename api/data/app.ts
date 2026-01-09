/**
 * GET /data/app
 * Returns app metadata with edge caching
 */

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

        // App metadata
        const appData = {
            name: 'Edge Minimal Stack',
            version: '1.0.0',
            status: 'operational',
        };

        return jsonResponse(appData, 200, {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION.APP}, stale-while-revalidate=${CACHE_DURATION.APP * 2}`,
        });
    } catch (error) {
        console.error('App data error:', error);
        return errorResponse('Failed to fetch app data', 500);
    }
}
