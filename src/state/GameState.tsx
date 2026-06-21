import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { BoosterId, GameStateData, HeadStartId } from '../types';
import { load, save, todayKey, wipe } from '../lib/storage';
import { GIFT_GOAL, LIFE_REGEN_MS, MAX_LIVES, PEARL_JAR_GOAL } from '../lib/constants';
import { AREAS } from '../data/creatures';
import { LEVELS } from '../data/levels';

function restoredFor(currentLevelId: number): string[] {
  return AREAS.filter((a) => {
    const ids = LEVELS.filter((l) => l.area === a.id).map((l) => l.id);
    return ids.length > 0 && ids.every((id) => id < currentLevelId);
  }).map((a) => a.id);
}

const DEFAULT_STATE: GameStateData = {
  pearls: 850,
  lives: MAX_LIVES,
  livesUpdatedAt: Date.now(),
  currentLevelId: 1,
  restoredAreas: [],
  collection: {},
  boosters: { hammer: 2, bomb: 1, surge: 1, refresh: 2, calm: 1 },
  headStarts: { clearRow: 2, wildPiece: 2, breakObstacle: 1 },
  shelbyGift: 0,
  failStreak: {},
  dailyLastClaimed: '',
  dailyStreak: 0,
  tidePass: { xp: 0, premium: false, claimedFree: [], claimedPrem: [] },
  pearlJar: 120,
  freePlayHigh: { drift: 0, tidal: 0, zen: 0 },
  debug: false,
  tutorialDone: false,
};

interface GameContextValue {
  state: GameStateData;
  livesInfo: { lives: number; msToNext: number };
  addPearls: (n: number) => void;
  spendPearls: (n: number) => boolean;
  addToJar: (n: number) => void;
  crackJar: () => void;
  loseLife: () => void;
  gainLife: () => void;
  addBooster: (id: BoosterId, n?: number) => void;
  useBooster: (id: BoosterId) => boolean;
  addHeadStart: (id: HeadStartId, n?: number) => void;
  useHeadStart: (id: HeadStartId) => boolean;
  recordWin: (levelId: number, rescued: string[], pearls: number) => void;
  recordFail: (levelId: number) => void;
  resetFailStreak: (levelId: number) => void;
  claimDaily: () => { pearls: number; boosters: number } | null;
  claimShelbyGift: () => BoosterId[] | null;
  addTideXp: (n: number) => void;
  claimTideReward: (tier: number, premium: boolean) => void;
  buyTidePremium: () => boolean;
  setFreePlayHigh: (mode: 'drift' | 'tidal' | 'zen', score: number) => void;
  toggleDebug: () => void;
  resetAll: () => void;
  setTutorialDone: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function computeLives(state: GameStateData): { lives: number; livesUpdatedAt: number; msToNext: number } {
  if (state.lives >= MAX_LIVES) return { lives: state.lives, livesUpdatedAt: Date.now(), msToNext: 0 };
  const elapsed = Date.now() - state.livesUpdatedAt;
  const gained = Math.floor(elapsed / LIFE_REGEN_MS);
  const lives = Math.min(MAX_LIVES, state.lives + gained);
  const livesUpdatedAt = lives >= MAX_LIVES ? Date.now() : state.livesUpdatedAt + gained * LIFE_REGEN_MS;
  const msToNext = lives >= MAX_LIVES ? 0 : LIFE_REGEN_MS - (Date.now() - livesUpdatedAt);
  return { lives, livesUpdatedAt, msToNext };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameStateData>(() => {
    const loaded = load(DEFAULT_STATE);
    const { lives, livesUpdatedAt } = computeLives(loaded);
    return { ...loaded, lives, livesUpdatedAt };
  });

  const [, force] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // persist
  useEffect(() => {
    save(state);
  }, [state]);

  // tick for life regen display
  useEffect(() => {
    const t = setInterval(() => {
      const cur = stateRef.current;
      if (cur.lives < MAX_LIVES) {
        const { lives, livesUpdatedAt } = computeLives(cur);
        if (lives !== cur.lives) {
          setState((s) => ({ ...s, lives, livesUpdatedAt }));
        } else {
          force((n) => n + 1); // refresh countdown
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const livesInfo = useMemo(() => {
    const { lives, msToNext } = computeLives(state);
    return { lives, msToNext };
  }, [state]);

  const mutate = useCallback((fn: (s: GameStateData) => GameStateData) => {
    setState((s) => fn(s));
  }, []);

  const addPearls = useCallback((n: number) => mutate((s) => ({ ...s, pearls: s.pearls + n })), [mutate]);

  const spendPearls = useCallback(
    (n: number) => {
      if (stateRef.current.pearls < n) return false;
      mutate((s) => ({ ...s, pearls: s.pearls - n }));
      return true;
    },
    [mutate],
  );

  const addToJar = useCallback((n: number) => mutate((s) => ({ ...s, pearlJar: Math.min(PEARL_JAR_GOAL, s.pearlJar + n) })), [mutate]);
  const crackJar = useCallback(
    () => mutate((s) => ({ ...s, pearls: s.pearls + s.pearlJar, pearlJar: 0 })),
    [mutate],
  );

  const loseLife = useCallback(
    () =>
      mutate((s) => {
        const cur = computeLives(s);
        const lives = Math.max(0, cur.lives - 1);
        // when dropping from full, start the regen clock now
        const livesUpdatedAt = cur.lives >= MAX_LIVES ? Date.now() : cur.livesUpdatedAt;
        return { ...s, lives, livesUpdatedAt };
      }),
    [mutate],
  );

  const gainLife = useCallback(
    () => mutate((s) => ({ ...s, lives: Math.min(MAX_LIVES, computeLives(s).lives + 1) })),
    [mutate],
  );

  const addBooster = useCallback(
    (id: BoosterId, n = 1) => mutate((s) => ({ ...s, boosters: { ...s.boosters, [id]: (s.boosters[id] ?? 0) + n } })),
    [mutate],
  );

  const useBooster = useCallback(
    (id: BoosterId) => {
      if ((stateRef.current.boosters[id] ?? 0) <= 0) return false;
      mutate((s) => ({ ...s, boosters: { ...s.boosters, [id]: s.boosters[id] - 1 } }));
      return true;
    },
    [mutate],
  );

  const addHeadStart = useCallback(
    (id: HeadStartId, n = 1) => mutate((s) => ({ ...s, headStarts: { ...s.headStarts, [id]: (s.headStarts[id] ?? 0) + n } })),
    [mutate],
  );

  const useHeadStart = useCallback(
    (id: HeadStartId) => {
      if ((stateRef.current.headStarts[id] ?? 0) <= 0) return false;
      mutate((s) => ({ ...s, headStarts: { ...s.headStarts, [id]: s.headStarts[id] - 1 } }));
      return true;
    },
    [mutate],
  );

  const recordWin = useCallback(
    (levelId: number, rescued: string[], pearls: number) =>
      mutate((s) => {
        const collection = { ...s.collection };
        for (const id of rescued) collection[id] = (collection[id] ?? 0) + 1;
        const failStreak = { ...s.failStreak, [levelId]: 0 };
        const gift = Math.min(GIFT_GOAL, s.shelbyGift + 1);
        const advanced = levelId === s.currentLevelId ? s.currentLevelId + 1 : s.currentLevelId;
        return {
          ...s,
          pearls: s.pearls + pearls,
          collection,
          failStreak,
          shelbyGift: gift,
          currentLevelId: advanced,
          restoredAreas: restoredFor(advanced),
          pearlJar: Math.min(PEARL_JAR_GOAL, s.pearlJar + Math.round(pearls / 4)),
          tidePass: { ...s.tidePass, xp: s.tidePass.xp + 1 },
        };
      }),
    [mutate],
  );

  const recordFail = useCallback(
    (levelId: number) => mutate((s) => ({ ...s, failStreak: { ...s.failStreak, [levelId]: (s.failStreak[levelId] ?? 0) + 1 } })),
    [mutate],
  );

  const resetFailStreak = useCallback(
    (levelId: number) => mutate((s) => ({ ...s, failStreak: { ...s.failStreak, [levelId]: 0 } })),
    [mutate],
  );

  const claimDaily = useCallback((): { pearls: number; boosters: number } | null => {
    const today = todayKey();
    if (stateRef.current.dailyLastClaimed === today) return null;
    const streak = stateRef.current.dailyStreak + 1;
    const pearls = 50 + streak * 10;
    const boosters = streak % 3 === 0 ? 1 : 0;
    mutate((s) => ({
      ...s,
      pearls: s.pearls + pearls,
      dailyLastClaimed: today,
      dailyStreak: streak,
      boosters: boosters ? { ...s.boosters, surge: s.boosters.surge + 1 } : s.boosters,
    }));
    return { pearls, boosters };
  }, [mutate]);

  const claimShelbyGift = useCallback((): BoosterId[] | null => {
    if (stateRef.current.shelbyGift < GIFT_GOAL) return null;
    const reward: BoosterId[] = ['surge', 'bomb', 'refresh'];
    mutate((s) => {
      const boosters = { ...s.boosters };
      for (const b of reward) boosters[b] = (boosters[b] ?? 0) + 1;
      return { ...s, boosters, shelbyGift: 0 };
    });
    return reward;
  }, [mutate]);

  const addTideXp = useCallback((n: number) => mutate((s) => ({ ...s, tidePass: { ...s.tidePass, xp: s.tidePass.xp + n } })), [mutate]);

  const claimTideReward = useCallback(
    (tier: number, premium: boolean) =>
      mutate((s) => {
        const key = premium ? 'claimedPrem' : 'claimedFree';
        if (s.tidePass[key].includes(tier)) return s;
        return { ...s, tidePass: { ...s.tidePass, [key]: [...s.tidePass[key], tier] } };
      }),
    [mutate],
  );

  const buyTidePremium = useCallback(() => {
    mutate((s) => ({ ...s, tidePass: { ...s.tidePass, premium: true } }));
    return true;
  }, [mutate]);

  const setFreePlayHigh = useCallback(
    (mode: 'drift' | 'tidal' | 'zen', score: number) =>
      mutate((s) => (score > s.freePlayHigh[mode] ? { ...s, freePlayHigh: { ...s.freePlayHigh, [mode]: score } } : s)),
    [mutate],
  );

  const toggleDebug = useCallback(() => mutate((s) => ({ ...s, debug: !s.debug })), [mutate]);
  const setTutorialDone = useCallback(() => mutate((s) => ({ ...s, tutorialDone: true })), [mutate]);

  const resetAll = useCallback(() => {
    wipe();
    setState({ ...DEFAULT_STATE, livesUpdatedAt: Date.now() });
  }, []);

  const value: GameContextValue = {
    state,
    livesInfo,
    addPearls,
    spendPearls,
    addToJar,
    crackJar,
    loseLife,
    gainLife,
    addBooster,
    useBooster,
    addHeadStart,
    useHeadStart,
    recordWin,
    recordFail,
    resetFailStreak,
    claimDaily,
    claimShelbyGift,
    addTideXp,
    claimTideReward,
    buyTidePremium,
    setFreePlayHigh,
    toggleDebug,
    resetAll,
    setTutorialDone,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
