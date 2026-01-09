/**
 * Media Domain Types
 */

export interface MediaFile {
    id: string;
    drive_file_id: string;
    imagekit_url: string;
    imagekit_file_id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    width?: number;
    height?: number;
    created_at: number;
}

export interface UploadResult {
    media_id: string;
    imagekit_url: string;
    drive_file_id: string;
}
