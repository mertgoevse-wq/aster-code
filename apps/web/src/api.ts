/**
 * API helper — resolves the correct base URL for API calls.
 *
 * In browser dev mode, Vite's dev proxy handles `/api/*` → `http://localhost:3001/*`.
 * In Electron (production), there is no proxy, so we call the runtime directly.
 *
 * Usage:  import { apiFetch, apiEventSource } from '../api';
 *         const res = await apiFetch('/api/health');
 *         const es = apiEventSource('/api/events');
 */

const RUNTIME_URL = 'http://localhost:3001';

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).asterDesktop?.isElectron;
}

/**
 * Resolve a `/api/*` path to the correct absolute URL.
 * In Electron, strips `/api` prefix and uses the runtime URL directly.
 * In browser dev, returns the path as-is (Vite proxy handles it).
 */
export function apiUrl(path: string): string {
  if (isElectron()) {
    const cleanPath = path.startsWith('/api') ? path.slice(4) : path;
    return `${RUNTIME_URL}${cleanPath}`;
  }
  return path;
}

/**
 * fetch() wrapper that resolves the correct base URL automatically.
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}

/**
 * EventSource wrapper that resolves the correct base URL automatically.
 */
export function apiEventSource(path: string): EventSource {
  return new EventSource(apiUrl(path));
}
