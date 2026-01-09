/**
 * GET /data/ping
 * Simple health check endpoint on the edge
 */

import { jsonResponse, errorResponse } from '@/shared/utils/response';
import { rateLimiter } from '@/infra/rate-limit/memory';
import { RATE_LIMIT } from '@/shared/constants';

export { runtime } from './_runtime';

export async function GET(request: Request): Promise<Response> {
    try {
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        const { allowed } = rateLimiter.check(
            `ping:${clientIp}`,
            RATE_LIMIT.DATA.MAX,
            RATE_LIMIT.DATA.WINDOW_MS
        );

        if (!allowed) {
            return errorResponse('Rate limit exceeded', 429);
        }

        return jsonResponse({
            message: 'pong',
            timestamp: Date.now(),
            region: request.headers.get('x-vercel-id')?.split(':')[0] || 'local',
        }, 200, {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        });
    } catch (error) {
        console.error('Ping error:', error);
        return errorResponse('Internal Server Error', 500);
    }
}
