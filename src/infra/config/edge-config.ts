import { get } from '@vercel/edge-config';

/**
 * Vercel Edge Config Wrapper
 * Used for ultra-fast reading of feature flags and global settings.
 */

export async function getConfig<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const val = await get(key);
        return (val as T) ?? defaultValue;
    } catch (error) {
        console.warn(`[EdgeConfig] Failed to fetch key: ${key}, using default.`);
        return defaultValue;
    }
}

/**
 * List of known config keys for autocomplete
 */
export const CONFIG_KEYS = {
    MAINTENANCE_MODE: 'maintenance_mode',
    FEATURE_AUTH_GOOGLE: 'feature_auth_google',
    REGISTRATION_ENABLED: 'registration_enabled',
} as const;
