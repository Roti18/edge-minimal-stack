import { createHandler } from '@/core/handler';
import { destroySession } from '@/modules/auth/session.service';

export { runtime } from './_runtime';

/**
 * POST /auth/logout
 */
export const POST = createHandler({
    handler: async () => {
        const destroyCookie = destroySession();

        return new Response(
            JSON.stringify({
                success: true,
                data: { message: 'Logged out successfully' },
                timestamp: Date.now(),
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': destroyCookie,
                },
            }
        );
    },
});
