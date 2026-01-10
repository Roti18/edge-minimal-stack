# Development Guide

## Available Commands

### Development Mode
```bash
bun run dev
```
- Uses `bun run --hot` for near-instant hot reload
- Fast startup (<100ms)
- Direct TypeScript execution
- All endpoints available with clean paths (e.g., `http://localhost:3000/auth/session`)
- **Perfect for rapid iteration**

### Database Management
```bash
# Initialize local database (Run this first!)
bun db:init

# Reset database (deletes and recreates)
bun db:reset

# Run migrations
bun db:migrate

# Interactive SQL Shell
bun db:query
```

### Pre-Deployment Check
```bash
bun run check
```
This runs:
1. TypeScript type check
2. Production audit check

---

## Available Endpoints

### Auth API
- `GET  /auth/google` - Initiate OAuth
- `GET  /auth/google/callback` - OAuth callback
- `GET  /auth/session` - Check session
- `POST /auth/logout` - Logout
- `POST /auth/login` - Login check

### Data & Media API
- `GET /data/config` - Configuration (from Upstash Redis)
- `GET /data/flags` - Feature flags (from Upstash Redis)
- `GET /media/:id` - Media metadata

---

## Troubleshooting

### Port 3000 already in use
```powershell
# Windows: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Script Errors
If you get "Module not found" errors, ensure you are using `bun` to run the scripts:
```bash
bun db:init
```
Node.js will not work with these scripts as they use Bun-native APIs.
