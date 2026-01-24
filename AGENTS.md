# GunnasTV - Agent Development Guide

## Overview
GunnasTV is a self-hosted IPTV web player that connects to Xtream Codes API providers. It's a single-page application with Node.js/Express backend and vanilla JavaScript frontend.

**Tech Stack:** Express 5, Tailwind CSS (CDN), HLS.js, JWT auth, Helmet.js, Portuguese/English bilingual

## Build/Development Commands

### Backend (Node.js)
```bash
cd backend
npm install          # Install dependencies
npm start            # Start production server
npm run dev          # Start development server (same as start)
```

### Frontend
No build process - uses ES modules directly from CDN

### Docker Commands
```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Restart after config changes
docker compose down && docker compose up -d

# Rebuild after code changes
docker compose up -d --build
```

### Testing
No test framework currently configured. Backend package.json shows placeholder test script.

## Code Style Guidelines

### File Organization
- **Backend (`backend/`)**: Express routes organized by responsibility
  - `server.js` - Main entry point with middleware setup
  - `auth.js` - Authentication routes (`/api/auth/login`)
  - `xtream.js` - Xtream API proxy routes (`/api/xtream/*`)
  - `security.js` - SSRF protection and input sanitization
  - `sessionStore.js` - In-memory session storage

- **Frontend (`frontend/js/`)**: ES modules organized by responsibility (~200-400 lines each)
  - `app.js` - Main entry point, global event listeners
  - `config.js` - App configuration and shared state
  - `utils.js` - Utility functions (escapeHtml, storage helpers)
  - `translations.js` - Bilingual translations (pt/en)
  - `api.js` - All API fetch calls
  - `auth.js` - Authentication logic
  - `router.js` - SPA routing
  - `player.js` - HLS.js video player
  - `favorites.js` - Favorites management
  - `ui/` - View components (loading, dashboard, account, epg)

### Naming Conventions
- **Files**: kebab-case for files, camelCase for variables/functions
- **Variables**: camelCase, descriptive names
- **Functions**: camelCase, verb-noun pattern (e.g., `fetchStreams`, `renderDashboard`)
- **Constants**: UPPER_SNAKE_CASE for constants
- **Classes**: PascalCase (if any classes are added)
- **CSS Classes**: Tailwind utility classes, custom components use kebab-case

### Import/Export Patterns
```javascript
// Frontend ES modules
import { API, appData } from './config.js';
import { escapeHtml } from './utils.js';

export async function functionName() { ... }
export const CONSTANT_NAME = 'value';

// Backend CommonJS
const express = require('express');
const { validateDnsUrl } = require('./security');

module.exports = router;
```

### Code Formatting
- **Indentation**: 2 spaces (JavaScript), 4 spaces (Dockerfile)
- **Line endings**: LF
- **Max line length**: ~100 characters (soft limit)
- **Semicolons**: Required in JavaScript
- **Quotes**: Single quotes for strings, double quotes for HTML attributes

### Error Handling
```javascript
// Frontend API calls
export async function fetchStreams(token) {
    const res = await fetch(`${API}/xtream/live`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch streams');
    return await res.json();
}

// Backend routes
router.post('/login', async (req, res) => {
    try {
        // ... logic
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

### Security Requirements (NON-NEGOTIABLE)
```javascript
// ALWAYS escape dynamic content before innerHTML
element.innerHTML = escapeHtml(channelName);

// Backend: validateDnsUrl() blocks private IPs (SSRF protection)
// Helmet CSP requires specific settings for HLS.js:
// - upgradeInsecureRequests: null (Xtream uses HTTP)
// - workerSrc: ['self', 'blob:'] (HLS.js workers)
// - hsts: false (allows HTTP connections)
```

### Bilingual UI Pattern
```html
<!-- Static text: use data attributes -->
<span data-en="Channels" data-pt="Canais"></span>

<!-- Dynamic text: use translations object -->
const t = translations[getLang()];
element.textContent = t.noChannels;
```

### API Call Pattern
```javascript
// All protected routes need Bearer token
fetch(API + '/xtream/live', {
    headers: { 'Authorization': 'Bearer ' + localStorage.token }
});

// Stream URLs are base64 obfuscated
const { u } = await res.json();  // /play/:streamId response
const streamUrl = atob(u);        // decode before use
```

### HLS.js Player Pattern
```javascript
// ALWAYS destroy before creating new instance
if (hlsInstance) hlsInstance.destroy();
hlsInstance = new Hls();
```

### State Management
- `localStorage.token` - JWT only
- `localStorage.user` - Account info (no password)
- `localStorage.gunnastv_favorites` - `{ channels: [], categories: [] }`
- `localStorage.lang` - `'pt'` (default) or `'en'`

### Environment Variables
Required in `.env` file (backend directory):
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)
- `ALLOWED_ORIGIN` - Frontend URL for CORS

### SPA Navigation
- Router handles `/`, `/dashboard`, `/account`, `/epg`
- Views toggled via `.active` class
- Player overlay slides up (`translate-y-0`) over any view

### Critical Files Reference
- Dashboard rendering: `js/ui/dashboard.js` `renderDashboard()`
- EPG grid: `js/ui/epg.js` `renderEPGView()`
- Login flow: `js/auth.js` + `js/api.js` `loginRequest()`
- Stream playback: `js/player.js` `openPlayer()` + backend `/play/:streamId`
- Router: `js/router.js` manages view transitions
- Translations: `js/translations.js` bilingual support

### Common Issues & Solutions
| Symptom | Fix |
|---------|-----|
| 401 errors | Check `localStorage.token` exists, Bearer scheme correct |
| Video won't play | Verify HLS.js loaded, check CSP `workerSrc` includes `blob:` |
| Text not translating | Add both `data-en` and `data-pt`, call `applyLanguage()` after DOM changes |
| HTTPS redirect breaking streams | Ensure `upgradeInsecureRequests: null` in Helmet config |

### Deployment Notes
- **Docker**: Multi-stage Node.js Alpine build
- **Cloudflare**: SSL/TLS Flexible, Automatic HTTPS Rewrites OFF
- **Reverse Proxy**: Caddy or nginx with proper headers
- **Health Check**: `wget --spider http://localhost:3000/`

### Development Workflow
1. Make changes to backend or frontend files
2. Restart server (`npm start` or `docker compose up -d --build`)
3. Test in browser at `http://localhost:3000`
4. Check browser console for errors
5. Verify security headers and CSP settings

### Code Review Checklist
- [ ] All dynamic content escaped with `escapeHtml()`
- [ ] SSRF protection used for external URLs
- [ ] Proper error handling with try/catch
- [ ] Bilingual support implemented correctly
- [ ] HLS.js instances properly destroyed
- [ ] JWT tokens handled securely
- [ ] CSP headers configured for HLS.js
- [ ] No credentials exposed to frontend