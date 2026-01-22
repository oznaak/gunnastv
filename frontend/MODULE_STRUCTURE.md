# GunnasTV - Modular Architecture

## 📁 Directory Structure

```
frontend/
├── index.html                    # Single-page HTML (all views)
└── js/                          # ES Modules
    ├── app.js                   # Main entry point
    ├── config.js                # App state & constants
    ├── utils.js                 # Utility functions
    ├── translations.js          # Bilingual support
    ├── api.js                   # API calls
    ├── auth.js                  # Authentication
    ├── router.js                # SPA routing
    ├── player.js                # HLS.js player
    ├── favorites.js             # Favorites management
    └── ui/                      # UI Components
        ├── loading.js           # Loading screen
        ├── dashboard.js         # Dashboard view
        ├── account.js           # Account view
        └── epg.js              # EPG guide view
```

## 🔗 Module Dependencies

### Core Modules
- **config.js** - Pure data, no dependencies
- **utils.js** - Pure functions, no dependencies
- **translations.js** - No dependencies

### API Layer
- **api.js** → `config.js`

### Business Logic
- **auth.js** → `config`, `api`, `utils`, `translations`, `ui/loading`, `router`
- **favorites.js** - No dependencies (localStorage only)
- **router.js** → `translations`, `config`, `ui/*`
- **player.js** → `config`, `api`, `utils`, `translations`

### UI Components
- **ui/loading.js** - No dependencies (DOM only)
- **ui/dashboard.js** → `config`, `utils`, `translations`, `favorites`, `player`
- **ui/account.js** → `config`, `utils`, `translations`, `favorites`
- **ui/epg.js** → `config`, `translations`, `favorites`, `api`, `utils`

### Entry Point
- **app.js** → All modules (orchestrator)

## 🚀 Key Features

### Clean Separation
- **Config** - Centralized state management
- **API** - Single source of truth for backend calls
- **UI** - Each view is self-contained
- **Utils** - Shared helpers

### Type Safety (Future)
All modules are ready for TypeScript migration:
```typescript
// Example: config.ts
export interface AppData {
  streams: Stream[];
  categories: Record<string, Stream[]>;
  // ...
}
```

### Testing (Future)
Each module can be tested independently:
```javascript
import { escapeHtml } from './utils.js';
import { assert } from 'chai';

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  });
});
```

## 📝 Migration Benefits

✅ **Maintainability** - ~200-400 lines per file vs 1700 line monolith  
✅ **Reusability** - Import only what you need  
✅ **Debugging** - Easier to locate issues  
✅ **Performance** - Browser can cache modules separately  
✅ **Collaboration** - Multiple devs can work on different modules  
✅ **Future-proof** - Ready for bundler (Vite/Webpack) if needed  

## 🔄 Import/Export Pattern

### Export (from module)
```javascript
export function myFunction() { }
export const myVariable = 'value';
```

### Import (in consumer)
```javascript
import { myFunction, myVariable } from './module.js';
```

### Global Functions (for HTML onclick)
```javascript
// In app.js
import { logout } from './auth.js';
window.logout = logout;  // Now available in HTML
```

## 🛠️ Adding New Features

### Example: Adding a new view

1. Create `js/ui/newview.js`:
```javascript
import { appData } from '../config.js';
import { translations, getLang } from '../translations.js';

export function renderNewView() {
  const container = document.getElementById('newViewContainer');
  const t = translations[getLang()];
  // ... render logic
}
```

2. Add route in `js/router.js`:
```javascript
routes: {
  '/': 'login',
  '/newview': 'newview',  // Add this
  // ...
}
```

3. Import in `js/app.js`:
```javascript
import { renderNewView } from './ui/newview.js';
```

4. Add to `router.onViewChanged()`:
```javascript
if (viewName === 'newview') {
  renderNewView();
}
```

## 📊 Module Size Comparison

| Module | Lines | Responsibility |
|--------|-------|----------------|
| config.js | 25 | State management |
| utils.js | 20 | Helper functions |
| translations.js | 70 | i18n support |
| api.js | 60 | HTTP requests |
| auth.js | 120 | Login/logout |
| router.js | 130 | Navigation |
| player.js | 250 | Video playback |
| favorites.js | 95 | Favorites CRUD |
| ui/loading.js | 20 | Loading screen |
| ui/dashboard.js | 330 | Channel grid |
| ui/account.js | 150 | Account settings |
| ui/epg.js | 280 | EPG timeline |
| app.js | 130 | Entry point |
| **TOTAL** | **1,680** | **13 modules** |

vs. **Old app.js: 1,692 lines in 1 file** 🤯
