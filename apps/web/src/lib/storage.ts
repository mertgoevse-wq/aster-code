/**
 * Aster Code localStorage helper — namespaced, error-safe, with migration.
 *
 * All keys are prefixed with "aster-code:" to avoid collisions.
 * Supports automatic migration from old "aster_" prefixed keys.
 *
 * Usage:
 *   import { storage } from '../lib/storage';
 *   storage.get('auto-refresh', 'true');        // always returns string
 *   storage.set('auto-refresh', 'true');
 *   storage.remove('auto-refresh');
 *   storage.getJson('system-prompts', []);      // JSON-parsed
 *   storage.setJson('system-prompts', prompts);
 *   storage.has('system-prompts');              // existence check
 *   storage.resetAll(); // clears all aster-code:* keys
 */

const PREFIX = 'aster-code:';
const MIGRATION_VERSION_KEY = PREFIX + 'storage-version';
const CURRENT_VERSION = 1;

// Old keys for migration (read-only, then delete)
const OLD_KEYS: Record<string, string> = {
  'aster_auto_refresh': 'auto-refresh',
  'aster_auto_refresh_interval': 'auto-refresh-interval',
  'aster_welcome_dismissed': 'welcome-dismissed',
  'aster_system_prompts': 'system-prompts',
  'aster_selected_prompt_id': 'selected-prompt-id',
  'aster_provider_configs': 'provider-configs',
};

function fullKey(key: string): string {
  return PREFIX + key;
}

function runMigration(): void {
  const migrated = localStorage.getItem(MIGRATION_VERSION_KEY);
  if (migrated === String(CURRENT_VERSION)) return;

  for (const [oldKey, newKey] of Object.entries(OLD_KEYS)) {
    const value = localStorage.getItem(oldKey);
    if (value !== null) {
      localStorage.setItem(fullKey(newKey), value);
      localStorage.removeItem(oldKey);
    }
  }

  localStorage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_VERSION));
}

// Run migration once on module load
try {
  runMigration();
} catch { /* ignore — may fail in SSR/non-browser */ }

export const storage = {
  /** Get a string value (always returns fallback if key not found) */
  get(key: string, fallback: string): string {
    try {
      const raw = localStorage.getItem(fullKey(key));
      return raw !== null ? raw : fallback;
    } catch {
      return fallback;
    }
  },

  /** Set a string value */
  set(key: string, value: string): void {
    try {
      localStorage.setItem(fullKey(key), value);
    } catch { /* storage full or unavailable */ }
  },

  /** Remove a key */
  remove(key: string): void {
    try {
      localStorage.removeItem(fullKey(key));
    } catch { /* ignore */ }
  },

  /** Get a JSON-parsed value, returns fallback on parse error or missing key */
  getJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** Set a JSON-serialized value */
  setJson<T>(key: string, value: T): void {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch { /* storage full or unavailable */ }
  },

  /** Check if a key exists */
  has(key: string): boolean {
    try {
      return localStorage.getItem(fullKey(key)) !== null;
    } catch {
      return false;
    }
  },

  /** List all aster-code:* keys */
  listKeys(): string[] {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    } catch {
      return [];
    }
  },

  /** Reset ALL aster-code:* data. Does NOT clear other localStorage keys. */
  resetAll(): void {
    try {
      const keys = this.listKeys();
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch { /* ignore */ }
  },

  /** Clear old "aster_" prefixed keys (for cleanup after migration) */
  clearOldKeys(): void {
    for (const oldKey of Object.keys(OLD_KEYS)) {
      try { localStorage.removeItem(oldKey); } catch { /* ignore */ }
    }
  },
};
