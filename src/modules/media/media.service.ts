/**
 * Media Service
 * Orchestrates upload to both Google Drive and ImageKit
 */

import { db } from '@/infra/db/client';
import { uploadToDrive } from '@/infra/drive/upload';
import { uploadToImageKit } from '@/infra/imagekit/upload';
import { randomBytes } from 'crypto';
import { Readable } from 'stream';
import type { MediaFile, UploadResult } from '@/domain/media';

export async function handleMediaUpload(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
): Promise<UploadResult> {
    // 1. Upload to Google Drive (archive storage)
    const stream = Readable.from(fileBuffer);
    const { fileId: driveFileId } = await uploadToDrive(stream, filename, mimeType);

    // 2. Upload to ImageKit (CDN delivery)
    const { url: imagekitUrl, fileId: imagekitFileId } = await uploadToImageKit(
        fileBuffer,
        filename
    );

    // 3. Store metadata in database
    const mediaId = randomBytes(16).toString('hex');
    const now = Date.now();

    await db.execute({
        sql: `INSERT INTO media_files (id, drive_file_id, imagekit_url, imagekit_file_id, filename, mime_type, size_bytes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [mediaId, driveFileId, imagekitUrl, imagekitFileId, filename, mimeType, fileBuffer.length, now],
    });

    return {
        media_id: mediaId,
        imagekit_url: imagekitUrl,
        drive_file_id: driveFileId,
    };
}

export async function getMediaById(id: string): Promise<MediaFile | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM media_files WHERE id = ?',
        args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0]!;
    return {
        id: row.id as string,
        drive_file_id: row.drive_file_id as string,
        imagekit_url: row.imagekit_url as string,
        imagekit_file_id: row.imagekit_file_id as string,
        filename: row.filename as string,
        mime_type: row.mime_type as string,
        size_bytes: row.size_bytes as number,
        width: row.width as number | undefined,
        height: row.height as number | undefined,
        created_at: row.created_at as number,
    };
}

export async function getAllMedia(limit = 50, offset = 0): Promise<MediaFile[]> {
    const result = await db.execute({
        sql: 'SELECT * FROM media_files ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [limit, offset],
    });

    return result.rows.map(row => ({
        id: row.id as string,
        drive_file_id: row.drive_file_id as string,
        imagekit_url: row.imagekit_url as string,
        imagekit_file_id: row.imagekit_file_id as string,
        filename: row.filename as string,
        mime_type: row.mime_type as string,
        size_bytes: row.size_bytes as number,
        width: row.width as number | undefined,
        height: row.height as number | undefined,
        created_at: row.created_at as number,
    }));
}
