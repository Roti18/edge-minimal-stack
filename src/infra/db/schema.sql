-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  oauth_provider TEXT NOT NULL,
  oauth_provider_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_provider_id);

-- App configuration table
CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean', 'json')),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Media files table (metadata only)
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  drive_file_id TEXT NOT NULL,
  imagekit_url TEXT NOT NULL,
  imagekit_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_created ON media_files(created_at DESC);

-- Seed some example data
INSERT OR IGNORE INTO app_config (id, key, value, type, updated_at) VALUES
  ('1', 'app_name', 'Edge Minimal Stack', 'string', strftime('%s', 'now') * 1000),
  ('2', 'api_version', '1.0.0', 'string', strftime('%s', 'now') * 1000),
  ('3', 'maintenance_mode', 'false', 'boolean', strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO feature_flags (id, key, enabled, description, updated_at) VALUES
  ('1', 'new_ui', 0, 'Enable new UI features', strftime('%s', 'now') * 1000),
  ('2', 'analytics', 1, 'Enable analytics tracking', strftime('%s', 'now') * 1000),
  ('3', 'beta_features', 0, 'Enable beta features', strftime('%s', 'now') * 1000);
