# Architecture Documentation

## Overview

This backend boilerplate implements a **clean, layered architecture** optimized for **ultra-low latency** on Vercel's edge network with **dual runtime support**.

## Core Principles

### 1. Minimal Complexity

**DO**:
- Services as plain functions
- Direct database calls
- Explicit error handling
- Simple, readable code

**AVOID**:
- Repository pattern layers
- Dependency injection frameworks
- Over-abstraction
- Enterprise patterns

**Rationale**: Keep cognitive overhead low, maintainability high, and bundle sizes minimal.

### 2. Runtime Separation

Vercel supports two runtimes with different capabilities:

| Feature | Node.js Runtime | Edge Runtime |
|---------|----------------|--------------|
| **Location** | Regional | Global edge |
| **Cold start** | ~100-300ms | ~0ms |
| **Max duration** | 60s | 30s |
| **Node.js APIs** | Supported | Limited |
| **Crypto** | Full | Web Crypto only |
| **Size limit** | 50MB | 1MB |
| **Use case** | Auth, OAuth, heavy logic | Static data, caching |

**Runtime Assignment**:
```typescript
// WRONG: Cannot be configured in vercel.json
// RIGHT: Per-file export
export const runtime = 'nodejs' | 'edge';
```

### 3. Stateless Sessions

**Design Decision**: HMAC-signed cookies instead of database sessions.

**Benefits**:
- No DB writes on every request
- Horizontally scalable
- No session cleanup jobs
- Simple revocation (cookie expiry)

**Trade-offs**:
- Cannot revoke before expiry (acceptable for 7-day sessions)
- Cookie size limit (4KB - our payload is ~200 bytes)

**Security**:
- HMAC-SHA256 signing with 32+ char secret
- Constant-time signature verification
- HttpOnly, Secure, SameSite=Lax
- Base64url encoding

### 4. Edge-First Caching

Data endpoints leverage Vercel's CDN with explicit cache headers:

```typescript
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

**Why `s-maxage` instead of `max-age`?**
- `s-maxage`: CDN/shared cache only
- `max-age`: Browser cache
- We want CDN caching without forcing client-side caching

**Why `stale-while-revalidate`?**
- Serve stale content immediately
- Fetch fresh content in background
- Better UX (no waiting)

## Layer Responsibilities

### 1. API Routes (`api/`)

**Purpose**: HTTP entry points for Vercel

**Responsibilities**:
- Parse request (query, body, headers)
- Validate input
- Call service layer
- Format response
- Set headers (cache, cookies)
- Handle errors

**Example**:
```typescript
// api/data/config.ts
export { runtime } from './_runtime'; // REQUIRED

export async function GET(request: Request): Promise<Response> {
  const config = await getAppConfig(); // Service layer
  return jsonResponse(config, 200, {
    'Cache-Control': 'public, s-maxage=300',
  });
}
```

### 2. Services (`src/services/`)

**Purpose**: Business logic (pure functions)

**Responsibilities**:
- Core business rules
- Data transformation
- Orchestration (call multiple infra layers)
- Validation

**Rules**:
- No HTTP concerns (Request/Response)
- No direct environment variables
- Return plain data or throw errors
- Unit-testable

**Example**:
```typescript
// src/services/auth/oauth.service.ts
export async function handleGoogleCallback(code: string): Promise<User> {
  const token = await exchangeCodeForToken(code); // Infra
  const profile = await fetchUserProfile(token.access_token); // Infra
  const user = await upsertUser(profile); // Infra
  return user;
}
```

### 3. Domain (`src/domain/`)

**Purpose**: Types, interfaces, entities

**Responsibilities**:
- Type definitions
- Interfaces
- Entity shapes
- No logic

**Example**:
```typescript
// src/domain/auth.ts
export interface SessionData {
  userId: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
}
```

### 4. Infrastructure (`src/infra/`)

**Purpose**: External integrations

**Responsibilities**:
- Database queries
- Third-party APIs (OAuth, etc.)
- Crypto operations
- File system, network I/O

**Subdirectories**:
- `db/`: Database client & schema
- `crypto/`: HMAC signing (Node.js only)
- `oauth/`: OAuth providers
- `rate-limit/`: Rate limiting

**Example**:
```typescript
// src/infra/oauth/google.ts
export async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({ code, /* ... */ }),
  });
  return response.json();
}
```

### 5. Shared (`src/shared/`)

**Purpose**: Utilities, constants, helpers

**Responsibilities**:
- Constants (cookie names, durations)
- Utility functions (edge-safe)
- Response formatters
- Cookie helpers

**Rules**:
- Must work in both runtimes (unless explicitly Node.js only)
- No business logic
- Pure functions

## Security Model

### OAuth 2.0 (Google)

**MANDATORY Security Features**:

1. **`state` Parameter** (CSRF Protection):
   ```typescript
   const state = generateState(); // Cryptographically secure random
   // Store in short-lived cookie
   // Validate on callback
   ```

2. **Redirect URI Validation**:
   - Must match exactly in Google Console
   - Use environment variable

3. **Token Handling**:
   - Never expose access tokens to client
   - Use only on server-side
   - Exchange once, discard

**Optional Enhancement**: PKCE (not implemented, but recommended for mobile)

### Session Security

**Cookie Configuration**:
```typescript
{
  httpOnly: true,    // No JavaScript access
  secure: true,      // HTTPS only
  sameSite: 'lax',   // CSRF protection
  path: '/',
  maxAge: 604800     // 7 days
}
```

**HMAC Signing**:
- Algorithm: SHA-256
- Secret: 32+ characters from env
- Format: `base64url(payload).hex(signature)`

## Rate Limiting

### Implementation

In-memory Map with cleanup:

```typescript
Map<key, { count: number, resetAt: number }>
```

**Cleanup**: Every 5 minutes, remove expired entries.

### Limitations

> [!WARNING]
> **This is NOT a distributed rate limiter.**

**Edge Runtime**:
- Per-isolate (not shared across regions)
- Different users in different regions = different limits
- Isolates can spawn/die unpredictably

**Node.js Runtime**:
- Per-instance
- Resets on cold start
- Multiple instances = separate counters

**Conclusion**: Good for cost protection, NOT for strict security.

**Alternative**: Use Vercel's built-in rate limiting or Upstash Redis.

## Database Strategy

### Turso SQLite

**Why SQLite?**
- Embedded, low latency
- Read-heavy optimization
- Free tier generous
- Edge-compatible
- Limited write throughput (acceptable for our use case)

### Schema Design

**Tables**:

1. **`users`**: OAuth user profiles
   - Minimal fields
   - Index on email
   - No sensitive data

2. **`app_config`**: Key-value configuration
   - Type-aware (`string`, `number`, `boolean`, `json`)
   - Single-row reads (indexed by `key`)

3. **`feature_flags`**: Feature toggles
   - Boolean enabled/disabled
   - Cache for 60 seconds

**No `sessions` table**: We use stateless cookies.

### Query Patterns

**Good**:
- Single-row lookups by indexed column
- Small result sets (<100 rows)
- Read-once, cache in CDN

**Avoid**:
- Heavy JOINs (use denormalized data)
- Full table scans
- Analytics queries (use dedicated service)

## Caching Strategy

### Layer 1: CDN Edge Cache

**Where**: Vercel's global CDN  
**Scope**: Public data only  
**Duration**: 60s - 600s  
**Headers**: `Cache-Control: public, s-maxage=X`

### Layer 2: Database Query Cache

**Where**: Turso built-in cache  
**Scope**: Automatic  
**Duration**: Configured per table

### What NOT to Cache

- User-specific data (use cookies for auth check)
- Frequently mutated data
- Sensitive information

## Error Handling

### Standard Response Format

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
```

### HTTP Status Codes

| Code | Meaning | Use Case |
|--------|---------|----------|
| 200 | OK | Successful GET/POST |
| 302 | Redirect | OAuth flow |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid/missing session |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unexpected failure |
| 501 | Not Implemented | Placeholder endpoint |

### Error Logging

**Production**: Log to `console.error` (captured by Vercel)  
**Development**: Full stack traces

## Deployment Architecture

```
User Request
    ↓
Vercel Edge Network (CDN)
    ↓
┌─────────────────┬─────────────────┐
│   Auth API      │    Data API     │
│  (Node.js)      │     (Edge)      │
│  Regional       │    Global       │
└────────┬────────┴────────┬────────┘
         ↓                 ↓
    Turso SQLite (Global)
```

**Flow**:
1. Request hits nearest edge POP
2. CDN checks cache (for data endpoints)
3. Cache miss → Route to function
4. Auth: Regional Node.js instance
5. Data: Edge function (global)
6. DB: Turso (embedded, low latency)
7. Response cached at CDN

## Environment Variables

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Turso connection | `libsql://db.turso.io` |
| `DATABASE_AUTH_TOKEN` | Turso auth | `eyJ...` |
| `GOOGLE_CLIENT_ID` | OAuth client | `123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | OAuth callback | `https://api.domain.com/auth/google/callback` |
| `SESSION_SECRET` | HMAC signing | `32+ random characters` |
| `ALLOWED_ORIGIN` | CORS | `https://domain.com` |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTH_RATE_LIMIT_MAX` | 10 | Auth requests per window |
| `AUTH_RATE_LIMIT_WINDOW_MS` | 900000 | Auth window (15 min) |
| `DATA_RATE_LIMIT_MAX` | 100 | Data requests per window |
| `DATA_RATE_LIMIT_WINDOW_MS` | 60000 | Data window (1 min) |

## Trade-offs & Limitations

### Stateless Sessions

**Pros**: No DB writes, scalable  
**Cons**: Cannot revoke before expiry

### In-Memory Rate Limiting

**Pros**: No external dependency, fast  
**Cons**: Not globally consistent

### SQLite

**Pros**: Low latency, simple, free-tier friendly  
**Cons**: Limited write throughput

### No Repository Layer

**Pros**: Less abstraction, easier to understand  
**Cons**: Direct DB coupling (acceptable for this scale)

## Future Enhancements

**If you need**:
- Distributed rate limiting → Add Upstash Redis
- Session revocation → Add `sessions` table + TTL cleanup
- Analytics → Add Tinybird or ClickHouse
- Real-time → Add Ably or Pusher
- File uploads → Add S3 or Cloudflare R2

**Remember**: Start minimal, add complexity only when needed.

---

**Keep it simple. Keep it fast. Keep it maintainable.**
