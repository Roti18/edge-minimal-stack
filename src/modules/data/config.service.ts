/**
 * Config Service
 * Business logic for app configuration and feature flags
 */

import { db } from '@/infra/db/client';
import type { AppConfig, FeatureFlag } from '@/domain/data';

export async function getAppConfig(): Promise<AppConfig[]> {
    const result = await db.execute('SELECT * FROM app_config');

    return result.rows.map((row) => ({
        id: row.id as string,
        key: row.key as string,
        value: row.value as string,
        type: row.type as 'string' | 'number' | 'boolean' | 'json',
        updated_at: row.updated_at as number,
    }));
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
    const result = await db.execute('SELECT * FROM feature_flags');

    return result.rows.map((row) => ({
        id: row.id as string,
        key: row.key as string,
        enabled: Boolean(row.enabled),
        description: row.description as string | undefined,
        updated_at: row.updated_at as number,
    }));
}

export async function getConfigByKey(key: string): Promise<AppConfig | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM app_config WHERE key = ?',
        args: [key],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0]!;
    return {
        id: row.id as string,
        key: row.key as string,
        value: row.value as string,
        type: row.type as 'string' | 'number' | 'boolean' | 'json',
        updated_at: row.updated_at as number,
    };
}
