/**
 * GET /api/media
 * List all media files
 * Edge runtime
 */

export const runtime = 'edge';
import { getAllMedia } from '@/services/media/media.service';
import { jsonResponse } from '@/shared/utils/response';

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const media = await getAllMedia(limit, offset);

    return jsonResponse({
        media,
        count: media.length,
        limit,
        offset,
    });
}
