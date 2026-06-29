const KEY = 'willowtide.save.v1';

// --- Native (Capacitor Preferences) mirror -------------------------------
// localStorage is the synchronous source of truth (it persists inside the
// Android WebView). We additionally mirror writes to Capacitor Preferences,
// which is backed by native storage and survives WebView data eviction. The
// mirror is best-effort and never blocks or breaks the sync path.
//
// Loaded lazily so the web build/runtime never depends on the native plugin.
type PrefsApi = {
  get(o: { key: string }): Promise<{ value: string | null }>;
  set(o: { key: string; value: string }): Promise<void>;
  remove(o: { key: string }): Promise<void>;
};

let prefsPromise: Promise<PrefsApi | null> | null = null;
function getPrefs(): Promise<PrefsApi | null> {
  if (!prefsPromise) {
    prefsPromise = import('@capacitor/preferences')
      .then((m) => (m.Preferences as unknown as PrefsApi) ?? null)
      .catch(() => null);
  }
  return prefsPromise;
}

export function load<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function save<T>(data: T): void {
  let raw = '';
  try {
    raw = JSON.stringify(data);
    localStorage.setItem(KEY, raw);
  } catch {
    /* ignore quota / private-mode errors */
  }
  // best-effort mirror to native storage
  if (raw) {
    void getPrefs().then((p) => p?.set({ key: KEY, value: raw }).catch(() => {}));
  }
}

export function wipe(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  void getPrefs().then((p) => p?.remove({ key: KEY }).catch(() => {}));
}

/**
 * Recover the save from native storage into localStorage when the WebView's
 * localStorage has been cleared but native Preferences survived. No-op on the
 * web or when localStorage already holds a save. Call once before the app
 * mounts (the game's synchronous load() then sees the recovered data).
 */
export async function hydrateFromNative(): Promise<void> {
  try {
    if (localStorage.getItem(KEY)) return; // localStorage wins when present
    const p = await getPrefs();
    if (!p) return;
    const { value } = await p.get({ key: KEY });
    if (value) localStorage.setItem(KEY, value);
  } catch {
    /* best-effort recovery only */
  }
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
