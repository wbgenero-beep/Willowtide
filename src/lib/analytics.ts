// GameAnalytics wrapper for Bountu.
//
// Safe by default: with no keys it runs in "tap-only" mode — nothing is sent to
// GameAnalytics, but every event is surfaced locally so you can watch the stream
// in the browser/device console:
//
//   window.__BOUNTU_GA_TAP = (e) => console.log(e);
//
// Keys make it go live. They come from (in priority order):
//   1. the `keys` arg passed to initAnalytics(), then
//   2. window.__BOUNTU_GA_KEYS = { game, secret }
// Empty/absent keys => tap-only. Absence must never break the build (callers
// resolve the local keys file in an absence-safe way; see main.tsx).
//
// Sessions are MANUAL: the host drives sessionStart/sessionEnd from Capacitor
// app-state changes. The game logic itself is not modified by this wrapper.

export interface GaKeys {
  game: string;
  secret: string;
}

export interface InitOptions {
  build: string;
  verbose?: boolean;
  keys?: Partial<GaKeys> | null;
}

type GaEvent = Record<string, unknown> & { name: string };

declare global {
  interface Window {
    __BOUNTU_GA_TAP?: (e: GaEvent) => void;
    __BOUNTU_GA_KEYS?: Partial<GaKeys> | null;
  }
}

// Module state
let verbose = false;
let live = false; // true once initialized with real keys
let ready = false; // true once init has completed (live or tap-only)
let sessionOpen = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GA: any = null; // the GameAnalytics SDK object, when live
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ENUMS: any = {}; // resolved enum holders from the SDK

function emit(event: GaEvent): void {
  try {
    if (typeof window !== 'undefined' && typeof window.__BOUNTU_GA_TAP === 'function') {
      window.__BOUNTU_GA_TAP(event);
    }
  } catch {
    /* a misbehaving tap must never break analytics */
  }
  if (verbose) {
    // eslint-disable-next-line no-console
    console.log('[GA]', event);
  }
}

function nonEmpty(k?: Partial<GaKeys> | null): k is GaKeys {
  return !!k && typeof k.game === 'string' && typeof k.secret === 'string' && k.game.length > 0 && k.secret.length > 0;
}

function resolveKeys(passed?: Partial<GaKeys> | null): GaKeys | null {
  if (nonEmpty(passed)) return passed;
  const win = typeof window !== 'undefined' ? window.__BOUNTU_GA_KEYS : null;
  if (nonEmpty(win)) return win;
  return null;
}

/**
 * Initialize analytics. Always succeeds (resolves) and never throws — on any
 * failure it falls back to tap-only so the app keeps running.
 * Emits an `__init` event with `ok` and `live` flags.
 */
export async function initAnalytics(opts: InitOptions): Promise<{ ok: boolean; live: boolean }> {
  verbose = !!opts.verbose;
  const keys = resolveKeys(opts.keys);

  try {
    if (keys) {
      // Dynamic import keeps GA out of the critical path and lets tap-only builds
      // work even if the package is unavailable.
      const mod: any = await import('gameanalytics');
      GA = mod.GameAnalytics ?? mod.default?.GameAnalytics ?? mod.default ?? mod;
      ENUMS = {
        Prog: mod.EGAProgressionStatus ?? GA?.EGAProgressionStatus,
        Flow: mod.EGAResourceFlowType ?? GA?.EGAResourceFlowType,
      };

      GA.setEnabledManualSessionHandling?.(true);
      GA.configureBuild?.(opts.build);
      GA.setEnabledInfoLog?.(verbose);
      GA.setEnabledVerboseLog?.(false);
      GA.initialize?.(keys.game, keys.secret);

      live = true;
      ready = true;
      emit({ name: '__init', ok: true, live: true, build: opts.build });
      return { ok: true, live: true };
    }

    // tap-only
    live = false;
    ready = true;
    emit({ name: '__init', ok: true, live: false, build: opts.build });
    return { ok: true, live: false };
  } catch (err) {
    // Never break the app on analytics failure — degrade to tap-only.
    live = false;
    ready = true;
    emit({ name: '__init', ok: false, live: false, error: String(err) });
    return { ok: false, live: false };
  }
}

/** Begin a manual session. Idempotent. */
export function sessionStart(): void {
  if (sessionOpen) return;
  sessionOpen = true;
  if (live && GA) {
    try {
      GA.startSession?.();
    } catch {
      /* ignore */
    }
  }
  emit({ name: 'sessionStart' });
}

/** End the current manual session. Idempotent. */
export function sessionEnd(): void {
  if (!sessionOpen) return;
  sessionOpen = false;
  if (live && GA) {
    try {
      GA.endSession?.();
    } catch {
      /* ignore */
    }
  }
  emit({ name: 'sessionEnd' });
}

/** Progression event. status: 'Start' | 'Complete' | 'Fail'. */
export function progression(
  status: 'Start' | 'Complete' | 'Fail',
  p1: string,
  p2?: string,
  p3?: string,
  score?: number,
): void {
  if (live && GA) {
    try {
      const s = ENUMS.Prog
        ? ENUMS.Prog[`GAProgressionStatus${status}`] ?? ENUMS.Prog[status]
        : undefined;
      GA.addProgressionEvent?.(s, p1, p2, p3, score);
    } catch {
      /* ignore */
    }
  }
  emit({ name: 'progression', status, p1, p2, p3, score });
}

export const progStart = (p1: string, p2?: string, p3?: string) => progression('Start', p1, p2, p3);
export const progComplete = (p1: string, p2?: string, p3?: string, score?: number) =>
  progression('Complete', p1, p2, p3, score);
export const progFail = (p1: string, p2?: string, p3?: string, score?: number) =>
  progression('Fail', p1, p2, p3, score);

/** Design event, e.g. design('save_offer:shown:stuck'). */
export function design(eventId: string, value?: number): void {
  if (live && GA) {
    try {
      GA.addDesignEvent?.(eventId, value);
    } catch {
      /* ignore */
    }
  }
  emit({ name: 'design', eventId, value });
}

/** Resource event. flow: 'Source' (grant) | 'Sink' (spend). */
export function resource(
  flow: 'Source' | 'Sink',
  currency: string,
  amount: number,
  itemType: string,
  itemId: string,
): void {
  if (live && GA) {
    try {
      const f = ENUMS.Flow ? ENUMS.Flow[`GAResourceFlowType${flow}`] ?? ENUMS.Flow[flow] : undefined;
      GA.addResourceEvent?.(f, currency, amount, itemType, itemId);
    } catch {
      /* ignore */
    }
  }
  emit({ name: 'resource', flow, currency, amount, itemType, itemId });
}

export function isLive(): boolean {
  return live;
}
export function isReady(): boolean {
  return ready;
}
