/**
 * POST /api/media/upload
 * Upload image to Google Drive and ImageKit
 * Node.js runtime only (requires googleapis)
 */

export { runtime } from './_runtime';
import { handleMediaUpload } from '@/modules/media/media.service';
import { errorResponse, jsonResponse } from '@/shared/utils/response';

export async function POST(request: Request): Promise<Response> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return errorResponse('No file provided', 400);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return errorResponse('File must be an image', 400);
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to both Drive and ImageKit
        const result = await handleMediaUpload(buffer, file.name, file.type);

        return jsonResponse(result, 201);
    } catch (error) {
        console.error('Upload error:', error);
        return errorResponse('Upload failed', 500);
    }
}
