import { z } from 'zod';
import { createHandler } from '@/core/handler';
import { errorResponse } from '@/shared/utils/response';
import { RATE_LIMIT } from '@/shared/constants';

export { runtime } from './_runtime';

/**
 * Login Schema
 */
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

/**
 * POST /auth/login
 */
export const POST = createHandler({
    rateLimit: {
        max: RATE_LIMIT.AUTH.MAX,
        windowMs: RATE_LIMIT.AUTH.WINDOW_MS,
    },
    schema: {
        body: LoginSchema,
    },
    handler: async ({ body }) => {
        // Business logic here (this is now type-safe!)
        console.log('Login attempt for:', body.email);

        return errorResponse('Email/password login not implemented. Use /auth/google', 501);
    },
});
