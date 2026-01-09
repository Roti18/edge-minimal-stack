/**
 * Google Drive Client
 * Service account authentication for file uploads
 */

import { google } from 'googleapis';

const GOOGLE_DRIVE_CREDENTIALS = process.env.GOOGLE_DRIVE_CREDENTIALS;

let drive: ReturnType<typeof google.drive> | null = null;

if (!GOOGLE_DRIVE_CREDENTIALS) {
    console.warn('[Drive] Google Drive not configured - media upload will not work');
} else {
    try {
        const credentials = JSON.parse(GOOGLE_DRIVE_CREDENTIALS);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        drive = google.drive({ version: 'v3', auth });
        console.log('[Drive] Google Drive configured');
    } catch (error) {
        console.error('[Drive] Invalid GOOGLE_DRIVE_CREDENTIALS JSON format');
    }
}

export { drive };
