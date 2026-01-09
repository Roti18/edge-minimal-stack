/**
 * GET /data/flags
 * Returns feature flags with edge caching
 */

import { getFeatureFlags } from '@/services/data/config.service';
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

        const flags = await getFeatureFlags();

        // Transform to key-enabled object
        const flagsObj = flags.reduce((acc, flag) => {
            acc[flag.key] = flag.enabled;
            return acc;
        }, {} as Record<string, boolean>);

        return jsonResponse(flagsObj, 200, {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION.FLAGS}, stale-while-revalidate=${CACHE_DURATION.FLAGS * 2}`,
        });
    } catch (error) {
        console.error('Flags fetch error:', error);
        return errorResponse('Failed to fetch feature flags', 500);
    }
}
