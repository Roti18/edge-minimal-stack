import { createHandler } from '@/core/handler';
import { getAppConfig } from '@/modules/data/config.service';
import { RATE_LIMIT, CACHE_DURATION } from '@/shared/constants';
import { jsonResponse } from '@/shared/utils/response';

export { runtime } from './_runtime';

/**
 * GET /data/config
 */
export const GET = createHandler({
    rateLimit: {
        max: RATE_LIMIT.DATA.MAX,
        windowMs: RATE_LIMIT.DATA.WINDOW_MS,
    },
    handler: async () => {
        const config = await getAppConfig();

        // Transform to key-value object
        const configObj = config.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {} as Record<string, string>);

        return jsonResponse(configObj, 200, {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION.CONFIG}, stale-while-revalidate=${CACHE_DURATION.CONFIG * 2}`,
        });
    },
});
