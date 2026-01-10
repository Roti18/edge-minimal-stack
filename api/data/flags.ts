import { createHandler } from '@/core/handler';
import { getFeatureFlags } from '@/modules/data/config.service';
import { RATE_LIMIT, CACHE_DURATION } from '@/shared/constants';
import { jsonResponse } from '@/shared/utils/response';

export { runtime } from './_runtime';

/**
 * GET /data/flags
 */
export const GET = createHandler({
    rateLimit: {
        max: RATE_LIMIT.DATA.MAX,
        windowMs: RATE_LIMIT.DATA.WINDOW_MS,
    },
    handler: async () => {
        const flags = await getFeatureFlags();

        // Transform to key-enabled object
        const flagsObj = flags.reduce((acc, flag) => {
            acc[flag.key] = flag.enabled;
            return acc;
        }, {} as Record<string, boolean>);

        return jsonResponse(flagsObj, 200, {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION.FLAGS}, stale-while-revalidate=${CACHE_DURATION.FLAGS * 2}`,
        });
    },
});
