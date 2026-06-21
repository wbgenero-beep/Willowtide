import { useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { GIFT_GOAL, BOOSTER_INFO } from '../lib/constants';
import { CandyButton, CenterModal } from '../components/ui';
import type { BoosterId } from '../types';

const MODES = [
  { id: 'drift', emoji: '🌊', name: 'Drift', blurb: 'Endless calm. Play until the board jams.' },
  { id: 'tidal', emoji: '⏱️', name: 'Tidal', blurb: '60 seconds. Clear as many lines as you can.' },
  { id: 'zen', emoji: '🍵', name: 'Zen', blurb: 'No tide, no clock. Just place and breathe.' },
] as const;

export function Play() {
  const { state, claimShelbyGift } = useGame();
  const { navigate } = useNav();
  const giftFull = state.shelbyGift >= GIFT_GOAL;
  const [reward, setReward] = useState<BoosterId[] | null>(null);

  const claimGift = () => {
    const got = claimShelbyGift();
    if (got) setReward(got);
  };

  return (
    <div className="px-4 pt-1 pb-4">
      <h1 className="mb-1 font-display text-2xl font-extrabold text-driftwood-dark">Free Play</h1>
      <p className="mb-3 text-sm text-driftwood">No lives, revive on stuck, chase a high score.</p>

      {giftFull && (
        <button
          onClick={claimGift}
          className="mb-3 w-full animate-bob rounded-3xl bg-gradient-to-b from-pearl to-pearl-gold p-3 text-center shadow-candy-gold"
        >
          <div className="text-3xl">🎁</div>
          <div className="font-display font-extrabold text-driftwood-dark">Shelby's Gift is full!</div>
          <div className="text-xs font-bold text-driftwood-dark">Tap to open your boosters</div>
        </button>
      )}

      <div className="space-y-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate({ name: 'freeplay', mode: m.id })}
            className="cream-card flex w-full items-center gap-3 p-3 text-left active:translate-y-[2px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-seaglass/15 text-2xl">
              {m.emoji}
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-extrabold text-driftwood-dark">{m.name}</div>
              <div className="text-xs text-driftwood">{m.blurb}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-driftwood">BEST</div>
              <div className="font-display font-extrabold text-seaglass-deep">{state.freePlayHigh[m.id]}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <CandyButton variant="gold" onClick={() => navigate({ name: 'shop' })}>
          🛍️ Shop
        </CandyButton>
        <CandyButton variant="teal" onClick={() => navigate({ name: 'tidepass' })}>
          🎟️ Tide Pass
        </CandyButton>
      </div>

      <div className="mt-4">
        <h2 className="mb-2 font-display text-base font-extrabold text-driftwood-dark">Your boosters</h2>
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(BOOSTER_INFO) as BoosterId[]).map((id) => (
            <div key={id} className="cream-card flex flex-col items-center p-1.5">
              <span className="text-xl">{BOOSTER_INFO[id].emoji}</span>
              <span className="text-[10px] font-extrabold text-driftwood-dark">×{state.boosters[id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {reward && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">🎁</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Shelby's Gift!</h2>
            <div className="my-3 flex justify-center gap-3">
              {reward.map((b) => (
                <div key={b} className="flex flex-col items-center">
                  <span className="text-3xl">{BOOSTER_INFO[b].emoji}</span>
                  <span className="text-xs font-bold text-driftwood-dark">+1</span>
                </div>
              ))}
            </div>
            <CandyButton full onClick={() => setReward(null)}>
              Lovely!
            </CandyButton>
          </div>
        </CenterModal>
      )}
    </div>
  );
}
