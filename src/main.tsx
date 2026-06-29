import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as CapApp } from '@capacitor/app';
import App from './App';
import { GameProvider } from './state/GameState';
import { hydrateFromNative } from './lib/storage';
import { initAnalytics, sessionStart, sessionEnd } from './lib/analytics';
import './index.css';

// Resolve GameAnalytics keys in an absence-safe way: if `ga-keys.local.js`
// doesn't exist (e.g. a fresh clone / CI), the glob simply yields nothing and
// analytics runs in tap-only mode. This must never break the build.
const keyMods = import.meta.glob('./ga-keys.local.js', { eager: true }) as Record<
  string,
  { keys?: { game: string; secret: string } }
>;
const localKeys = Object.values(keyMods)[0]?.keys ?? null;

function render() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <GameProvider>
        <App />
      </GameProvider>
    </React.StrictMode>,
  );
}

async function boot() {
  // Recover the save from native storage if the WebView's localStorage was
  // evicted. Must complete before the app mounts (GameState reads synchronously).
  await hydrateFromNative();
  render();

  // Analytics: tap-only until real keys are present. verbose stays on through
  // the device/realtime gates; Block 5 flips it to false for release.
  await initAnalytics({ build: '0.1.0', verbose: true, keys: localKeys });

  // Manual sessions, driven by Capacitor app-state (resume -> start, background
  // -> end). Start one now since the app launches in the foreground.
  sessionStart();
  CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) sessionStart();
    else sessionEnd();
  }).catch(() => {
    /* @capacitor/app unavailable (non-Capacitor context) — fine */
  });
}

void boot();
