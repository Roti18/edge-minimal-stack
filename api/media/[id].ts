/**
 * GET /api/media/:id
 * Get media metadata by ID
 * Edge runtime (metadata only, no file serving)
 */

export const runtime = 'edge';
import { getMediaById } from '@/services/media/media.service';
import { errorResponse, jsonResponse } from '@/shared/utils/response';

interface RouteContext {
    params: { id: string };
}

export async function GET(
    request: Request,
    context: RouteContext
): Promise<Response> {
    const { id } = context.params;

    if (!id) {
        return errorResponse('Media ID is required', 400);
    }

    const media = await getMediaById(id);

    if (!media) {
        return errorResponse('Media not found', 404);
    }

    return jsonResponse(media);
}
