import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { APP_VERSION } from './appVersion';

const STALE_RELOAD_KEY = '__gia_pha_stale_reload_v1';

/**
 * Old phones can retain a previous index.html in browser memory/BFCache even
 * when Vercel has deployed a new immutable build. Check a tiny no-store
 * manifest before mounting the app so an old bundle can recover automatically.
 */
async function recoverFromStaleBundle() {
  try {
    const response = await fetch(`/version.json?ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return;
    const remote = await response.json() as { version?: string };
    const reloadAlreadyAttempted = sessionStorage.getItem(STALE_RELOAD_KEY) === APP_VERSION;

    if (remote.version && remote.version !== APP_VERSION && !reloadAlreadyAttempted) {
      sessionStorage.setItem(STALE_RELOAD_KEY, APP_VERSION);
      window.location.reload();
      return;
    }

    if (remote.version === APP_VERSION) {
      sessionStorage.removeItem(STALE_RELOAD_KEY);
    }
  } catch {
    // Offline / temporary network failure: continue loading the local bundle.
  }
}

recoverFromStaleBundle().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
