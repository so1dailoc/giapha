import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { APP_VERSION, LEGACY_STORAGE_PREFIXES } from './appVersion';

const VERSION_KEY = '__gia_pha_app_version_v2';
const RELOAD_KEY = '__gia_pha_stale_reload_v2';
const CACHE_BUSTER = '__gia_pha_cache_buster_v2';

function purgeLegacyClientState() {
  try {
    const previousVersion = localStorage.getItem(VERSION_KEY);
    if (previousVersion === APP_VERSION) return;

    // Old versions persisted manual node positions under versioned keys. They
    // can make a new layout appear "stuck" after an upgrade, so discard only
    // those obsolete layout caches. Supabase data/settings are untouched.
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && LEGACY_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  } catch {
    // Storage can be unavailable in private browsing; the app still works.
  }
}

async function ensureFreshBundle(): Promise<boolean> {
  try {
    const response = await fetch(`/version.json?${CACHE_BUSTER}=${encodeURIComponent(APP_VERSION)}&t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, max-age=0' },
    });
    if (!response.ok) return true;

    const remote = (await response.json()) as { version?: string };
    const current = remote.version;
    const attempted = sessionStorage.getItem(RELOAD_KEY);

    if (current && current !== APP_VERSION && attempted !== current) {
      sessionStorage.setItem(RELOAD_KEY, current);
      // A query string makes the navigation request a fresh document even on
      // browsers/CDNs that retained the previous HTML response.
      const url = new URL(window.location.href);
      url.searchParams.set(CACHE_BUSTER, current);
      url.searchParams.set('_t', String(Date.now()));
      window.location.replace(url.toString());
      return false;
    }

    if (current === APP_VERSION) sessionStorage.removeItem(RELOAD_KEY);
    return true;
  } catch {
    // Offline/temporary network failure: do not prevent the application from
    // opening with its already-loaded bundle.
    return true;
  }
}

async function bootstrap() {
  const fresh = await ensureFreshBundle();
  if (!fresh) return;

  purgeLegacyClientState();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
