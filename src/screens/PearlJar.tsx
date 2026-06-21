import { useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { PEARL_JAR_GOAL } from '../lib/constants';
import { CandyButton, ScreenHeader, ProgressBar, CenterModal } from '../components/ui';

export function PearlJar() {
  const { state, crackJar } = useGame();
  const { back } = useNav();
  const full = state.pearlJar >= PEARL_JAR_GOAL;
  const [cracked, setCracked] = useState<number | null>(null);

  const crack = () => {
    const amount = state.pearlJar;
    crackJar();
    setCracked(amount);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Pearl Jar 🫙" onBack={back} />

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className={`text-8xl ${full ? 'animate-bob' : ''}`}>🫙</div>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-driftwood-dark">{state.pearlJar} / {PEARL_JAR_GOAL}</h2>
        <p className="mt-1 text-sm text-driftwood">
          Your jar fills a little with every rescue. When it's full, crack it open for a big pile of pearls.
        </p>
        <ProgressBar value={state.pearlJar} max={PEARL_JAR_GOAL} className="mt-4 w-full" />

        <CandyButton variant={full ? 'coral' : 'gold'} full className="mt-6" disabled={!full} onClick={crack}>
          {full ? 'Crack the jar! · $4.99 (simulated)' : 'Keep playing to fill the jar'}
        </CandyButton>
        {!full && <p className="mt-2 text-xs text-driftwood">{PEARL_JAR_GOAL - state.pearlJar} pearls to go</p>}
      </div>

      {cracked !== null && (
        <CenterModal>
          <div className="text-center">
            <div className="text-6xl">💎</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Jar cracked!</h2>
            <p className="mt-2 font-bold text-seaglass-deep">🪙 +{cracked} pearls</p>
            <CandyButton full className="mt-4" onClick={() => setCracked(null)}>
              Wonderful!
            </CandyButton>
          </div>
        </CenterModal>
      )}
    </div>
  );
}
