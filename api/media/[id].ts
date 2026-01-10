import { getMediaById } from '@/modules/media/media.service';
import { jsonResponse } from '@/shared/utils/response';

export const runtime = 'edge';

/**
 * GET /api/media/:id
 * Get media metadata by ID
 */
export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
): Promise<Response> {
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Media ID required',
            timestamp: Date.now()
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const media = await getMediaById(id);

    if (!media) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Media not found',
            timestamp: Date.now()
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return jsonResponse(media);
}
