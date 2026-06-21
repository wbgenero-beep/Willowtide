import { useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { BOOSTER_INFO, HEADSTART_INFO } from '../lib/constants';
import { CandyButton, ScreenHeader } from '../components/ui';
import type { BoosterId, HeadStartId } from '../types';

const PEARL_PACKS = [
  { id: 'p1', pearls: 300, price: '$0.99', emoji: '🪙' },
  { id: 'p2', pearls: 800, price: '$2.99', emoji: '💰', best: false },
  { id: 'p3', pearls: 2000, price: '$4.99', emoji: '🏆', best: true },
];

export function Shop() {
  const { state, addPearls, addBooster, addHeadStart, spendPearls } = useGame();
  const { back } = useNav();
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1400);
  };

  const buyPearls = (pearls: number) => {
    addPearls(pearls);
    flash(`+${pearls} pearls added! (simulated)`);
  };

  const buyBooster = (id: BoosterId) => {
    if (spendPearls(BOOSTER_INFO[id].price)) {
      addBooster(id, 1);
      flash(`+1 ${BOOSTER_INFO[id].name}`);
    } else flash('Not enough pearls');
  };

  const buyHeadStart = (id: HeadStartId) => {
    if (spendPearls(HEADSTART_INFO[id].price)) {
      addHeadStart(id, 1);
      flash(`+1 ${HEADSTART_INFO[id].name}`);
    } else flash('Not enough pearls');
  };

  const buyStarter = () => {
    addPearls(500);
    (['hammer', 'bomb', 'surge', 'refresh', 'calm'] as BoosterId[]).forEach((b) => addBooster(b, 1));
    flash('Starter Pack unlocked! (simulated)');
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Shelby's Shop 🐢" onBack={back} right={<span className="text-xs font-extrabold text-driftwood-dark">🪙{state.pearls}</span>} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* starter pack */}
        <div className="cream-card mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-coral-light to-coral p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-xl font-extrabold">Starter Pack</div>
                <div className="text-sm text-white/90">500 pearls + 1 of every booster</div>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
            <CandyButton variant="gold" full className="mt-3" onClick={buyStarter}>
              $1.99 · Get it
            </CandyButton>
          </div>
        </div>

        <h2 className="mb-2 font-display text-lg font-extrabold text-driftwood-dark">Pearl packs</h2>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PEARL_PACKS.map((p) => (
            <button key={p.id} onClick={() => buyPearls(p.pearls)} className="cream-card relative flex flex-col items-center p-3 active:translate-y-[2px]">
              {p.best && <span className="absolute -top-2 rounded-full bg-pearl-gold px-2 text-[9px] font-extrabold text-driftwood-dark">BEST</span>}
              <span className="text-3xl">{p.emoji}</span>
              <span className="font-display font-extrabold text-driftwood-dark">{p.pearls}</span>
              <span className="mt-1 rounded-full bg-seaglass/20 px-2 py-0.5 text-xs font-bold text-seaglass-deep">{p.price}</span>
            </button>
          ))}
        </div>

        <h2 className="mb-2 font-display text-lg font-extrabold text-driftwood-dark">Boosters</h2>
        <div className="mb-4 space-y-2">
          {(Object.keys(BOOSTER_INFO) as BoosterId[]).map((id) => (
            <div key={id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-2.5">
              <span className="text-2xl">{BOOSTER_INFO[id].emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-driftwood-dark">{BOOSTER_INFO[id].name} <span className="text-driftwood">×{state.boosters[id] ?? 0}</span></div>
                <div className="text-[11px] text-driftwood">{BOOSTER_INFO[id].blurb}</div>
              </div>
              <CandyButton variant="teal" className="!px-3 !py-2 text-sm" onClick={() => buyBooster(id)}>
                🪙{BOOSTER_INFO[id].price}
              </CandyButton>
            </div>
          ))}
        </div>

        <h2 className="mb-2 font-display text-lg font-extrabold text-driftwood-dark">Head-starts</h2>
        <div className="space-y-2">
          {(Object.keys(HEADSTART_INFO) as HeadStartId[]).map((id) => (
            <div key={id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-2.5">
              <span className="text-2xl">{HEADSTART_INFO[id].emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-driftwood-dark">{HEADSTART_INFO[id].name} <span className="text-driftwood">×{state.headStarts[id] ?? 0}</span></div>
                <div className="text-[11px] text-driftwood">{HEADSTART_INFO[id].blurb}</div>
              </div>
              <CandyButton variant="teal" className="!px-3 !py-2 text-sm" onClick={() => buyHeadStart(id)}>
                🪙{HEADSTART_INFO[id].price}
              </CandyButton>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 animate-pop rounded-full bg-driftwood-dark px-5 py-2 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
