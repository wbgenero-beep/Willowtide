import React, { createContext, useCallback, useContext, useState } from 'react';
import type { HeadStartId } from '../types';

export type Route =
  | { name: 'home' }
  | { name: 'shores' }
  | { name: 'album' }
  | { name: 'ranks' }
  | { name: 'play' }
  | { name: 'boosterSelect'; levelId: number }
  | { name: 'level'; levelId: number; headStarts: HeadStartId[] }
  | { name: 'freeplay'; mode: 'drift' | 'tidal' | 'zen' }
  | { name: 'shop' }
  | { name: 'daily' }
  | { name: 'tidepass' }
  | { name: 'friends' }
  | { name: 'pearljar' };

export const MAIN_TABS = ['ranks', 'shores', 'home', 'album', 'play'] as const;

interface NavValue {
  route: Route;
  navigate: (r: Route) => void;
  back: () => void;
  canBack: boolean;
}

const NavContext = createContext<NavValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const route = stack[stack.length - 1];

  const navigate = useCallback((r: Route) => {
    setStack((s) => {
      // main tabs reset the stack (no deep back chains between tabs)
      if (MAIN_TABS.includes(r.name as (typeof MAIN_TABS)[number])) return [r];
      return [...s, r];
    });
  }, []);

  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  return (
    <NavContext.Provider value={{ route, navigate, back, canBack: stack.length > 1 }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav(): NavValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav outside provider');
  return ctx;
}
