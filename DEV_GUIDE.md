# Development Guide

## Available Commands

### Development Modes (Choose One)

#### 1. **Quick Development** (Recommended)
```bash
npm run dev
```
- Uses `tsx watch` for hot reload
- Fast startup (~1-2s)
- Direct TypeScript execution
- All endpoints available at `http://localhost:3000`
- **Perfect for rapid iteration**

#### 2. **Production Simulation**
```bash
npm run vercel
```
- Uses Vercel CLI
- Simulates actual Vercel runtime
- Slower startup (~5-10s)
- **Use before deploying to test runtime behavior**

### How to Restart `npm run vercel`

If you made a config mistake:

```bash
# Windows: Press Ctrl+C to stop
Ctrl+C

# Then restart
npm run vercel
```

Or kill and restart in one command:
```powershell
# Kill any running Vercel process, then start fresh
taskkill /F /IM node.exe /T 2>$null; npm run vercel
```

### Pre-Deployment Check

Always run before deploying:
```bash
npm run check
```

This runs:
1. TypeScript type check
2. Security audit (production only)

---

## Other Commands

```bash
# Type check only
npm run type-check

# Deploy to production
npm run deploy

# Build check (no output, just validation)
npm run build
```

---

## Available Endpoints

### Auth API
- `GET  /auth/google` - Initiate OAuth
- `GET  /auth/google/callback` - OAuth callback
- `GET  /auth/session` - Check session
- `POST /auth/logout` - Logout

### Data API
- `GET /data/app` - App metadata
- `GET /data/config` - Configuration
- `GET /data/flags` - Feature flags

---

## Troubleshooting

### `npm run vercel` won't stop
```powershell
taskkill /F /IM node.exe /T
```

### Port 3000 already in use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Vercel CLI cache issues
```bash
vercel dev --force
```
