# Local Persistence — Aster Code

Aster Code stores user preferences and UI state in the browser's `localStorage`. No API keys or secrets are ever persisted to the frontend.

---

## Storage Architecture

### Namespace

All keys are prefixed with `aster-code:` to avoid collisions with other web apps.

### Storage Helper

`apps/web/src/lib/storage.ts` provides a safe, typed API:

```typescript
import { storage } from '../lib/storage';

storage.get('key', 'default');       // string
storage.set('key', 'value');
storage.remove('key');
storage.getJson<T>('key', fallback); // JSON-parsed object
storage.setJson('key', object);
storage.has('key');                  // boolean
storage.resetAll();                  // clear all aster-code:* keys
```

All operations are wrapped in try/catch — if localStorage is unavailable (private browsing, storage full), operations silently fail without crashing the app.

### Migration

Old keys (from v0.1.0, prefixed `aster_`) are automatically migrated to the `aster-code:` namespace on first load. After migration, old keys are deleted.

| Old Key | New Key |
|---------|---------|
| `aster_auto_refresh` | `aster-code:auto-refresh` |
| `aster_auto_refresh_interval` | `aster-code:auto-refresh-interval` |
| `aster_welcome_dismissed` | `aster-code:welcome-dismissed` |
| `aster_system_prompts` | `aster-code:system-prompts` |
| `aster_selected_prompt_id` | `aster-code:selected-prompt-id` |
| `aster_provider_configs` | `aster-code:provider-configs` |

---

## Persisted Fields

| Key | Type | Description | Stores Secrets? |
|-----|------|-------------|-----------------|
| `auto-refresh` | boolean | Model registry auto-refresh on/off | No |
| `auto-refresh-interval` | number | Auto-refresh interval in seconds (default: 300) | No |
| `welcome-dismissed` | boolean | First-run onboarding dismissed state | No |
| `system-prompts` | JSON array | User-created system prompt templates | No |
| `selected-prompt-id` | string | Currently active system prompt ID | No |
| `provider-configs` | JSON object | Provider toggle states + URLs (API keys scrubbed before save) | No |

### What is NOT Stored

- **API keys** — `openaiApiKey`, `anthropicApiKey`, `openrouterApiKey`, `nvidiaApiKey`, `openaiCompatibleApiKey` are explicitly deleted from provider configs before saving to localStorage
- **OAuth tokens** — Access tokens are in-memory only (runtime server), never in the browser
- **Chat history** — Not persisted (in-memory session only)
- **Workspace files** — Stored on disk by the runtime server, not in browser storage
- **Runtime logs** — Captured in-memory in the Electron main process (not localStorage)

---

## Reset Local Data

### From Settings UI

`Settings → Runtime Server → "Reset All Local Data"`

This clears all `aster-code:*` keys and reloads the page. Does NOT affect:
- Project/workspace files on disk
- Runtime server configuration (`.env` file)
- Electron logs (`%APPDATA%\aster-code\logs\`)
- Installed packages or build artifacts

### Programmatically

```typescript
import { storage } from '../lib/storage';
storage.resetAll(); // clears all aster-code:* keys
```

### Manually (Browser DevTools)

1. Open DevTools (F12)
2. Go to Application → Local Storage → localhost:5173
3. Delete individual keys or click "Clear All"

---

## Error Handling

All `storage.*` operations are wrapped in try/catch. If localStorage is:
- **Unavailable** (private browsing, disabled): operations silently no-op
- **Full** (quota exceeded): set operations silently fail
- **Corrupted** (bad JSON): `getJson` returns the provided fallback

This means the app gracefully degrades without localStorage — all features work but preferences reset on reload.

---

## Future Improvements

- **Persistent sessions** — Save agent sessions to disk (currently in-memory only)
- **Settings export** — Download/upload a single JSON file with all preferences
- **Encrypted storage** — Use OS keychain for sensitive runtime tokens
- **Cloud sync** — Optional sync of settings via authenticated user account (OAuth required)
