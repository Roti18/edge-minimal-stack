/**
 * POST /auth/logout
 * Destroys session by clearing cookie
 */

import { destroySession } from '@/services/auth/session.service';

export { runtime } from './_runtime';

export async function POST(_request: Request): Promise<Response> {
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
}
