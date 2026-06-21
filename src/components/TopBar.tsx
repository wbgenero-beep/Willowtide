import { useState } from 'react';
import { useGame } from '../state/GameState';
import { MAX_LIVES } from '../lib/constants';
import { CenterModal, CandyButton } from './ui';

function fmt(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function TopBar() {
  const { state, livesInfo, toggleDebug, resetAll, addPearls, gainLife } = useGame();
  const [settings, setSettings] = useState(false);

  return (
    <div className="flex items-center gap-2 px-3 pb-2 pt-3">
      <div className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 shadow-sm">
        <span className="text-base">♥</span>
        <span className="font-display font-extrabold text-coral-dark">{livesInfo.lives}</span>
        <span className="text-[10px] font-bold text-driftwood">
          {livesInfo.lives >= MAX_LIVES ? 'FULL' : fmt(livesInfo.msToNext)}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 shadow-sm">
        <span className="text-base">🪙</span>
        <span className="font-display font-extrabold text-driftwood-dark">{state.pearls}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="rounded-full bg-seaglass/20 px-2.5 py-1 text-xs font-bold text-seaglass-deep">
          Lvl {state.currentLevelId}
        </div>
        <button
          onClick={() => setSettings(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-lg shadow-sm active:translate-y-[2px]"
        >
          ⚙️
        </button>
      </div>

      {settings && (
        <CenterModal>
          <h2 className="mb-1 font-display text-2xl font-extrabold text-driftwood-dark">Settings</h2>
          <p className="mb-4 text-sm text-driftwood">Willowtide — playable design demo</p>

          <div className="space-y-2">
            <button
              onClick={toggleDebug}
              className="flex w-full items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left font-bold text-driftwood-dark"
            >
              <span>🐛 Debug overlay</span>
              <span className={state.debug ? 'text-seaglass-deep' : 'text-driftwood/50'}>
                {state.debug ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              onClick={() => addPearls(500)}
              className="flex w-full items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left font-bold text-driftwood-dark"
            >
              <span>🪙 +500 pearls (debug)</span>
            </button>
            <button
              onClick={gainLife}
              className="flex w-full items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left font-bold text-driftwood-dark"
            >
              <span>♥ +1 life (debug)</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Reset all progress?')) {
                  resetAll();
                  setSettings(false);
                }
              }}
              className="w-full rounded-2xl bg-coral/20 px-4 py-3 text-left font-bold text-coral-dark"
            >
              ♻️ Reset all progress
            </button>
          </div>

          <CandyButton variant="teal" full className="mt-4" onClick={() => setSettings(false)}>
            Close
          </CandyButton>
        </CenterModal>
      )}
    </div>
  );
}
