/**
 * ImageKit Upload Service
 */

import { imagekit } from './client';

export async function uploadToImageKit(
    fileBuffer: Buffer,
    filename: string
): Promise<{ url: string; fileId: string }> {
    if (!imagekit) {
        throw new Error('ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT');
    }

    const result = await imagekit.upload({
        file: fileBuffer,
        fileName: filename,
        useUniqueFileName: true,
    });

    return {
        url: result.url,
        fileId: result.fileId,
    };
}

/**
 * Generate optimized ImageKit URL with transformations
 */
export function getOptimizedUrl(imagekitUrl: string, width?: number): string {
    const transforms = ['q-auto', 'f-auto'];
    if (width) transforms.push(`w-${width}`);

    return `${imagekitUrl}?tr=${transforms.join(',')}`;
}
