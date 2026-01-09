/**
 * Google Drive Upload Service
 * Stream-based upload to avoid buffering entire file
 */

import { drive } from './client';
import { Readable } from 'stream';

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function uploadToDrive(
    fileStream: Readable,
    filename: string,
    mimeType: string
): Promise<{ fileId: string; viewUrl: string }> {
    if (!drive) {
        throw new Error('Google Drive is not configured. Set GOOGLE_DRIVE_CREDENTIALS');
    }

    const requestBody: any = {
        name: filename,
    };

    // Add to specific folder if configured
    if (GOOGLE_DRIVE_FOLDER_ID) {
        requestBody.parents = [GOOGLE_DRIVE_FOLDER_ID];
    }

    const response = await drive.files.create({
        requestBody,
        media: {
            mimeType,
            body: fileStream,
        },
        fields: 'id, webViewLink',
    });

    if (!response.data.id) {
        throw new Error('Failed to upload to Google Drive');
    }

    return {
        fileId: response.data.id,
        viewUrl: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    };
}
