/**
 * Data Domain Types
 * Pure types for data API responses
 */

export interface AppConfig {
    id: string;
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    updated_at: number;
}

export interface FeatureFlag {
    id: string;
    key: string;
    enabled: boolean;
    description?: string;
    updated_at: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}
