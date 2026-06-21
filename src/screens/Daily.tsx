import { useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { todayKey } from '../lib/storage';
import { CandyButton, ScreenHeader, CenterModal } from '../components/ui';

export function Daily() {
  const { state, claimDaily } = useGame();
  const { back } = useNav();
  const claimedToday = state.dailyLastClaimed === todayKey();
  const [reward, setReward] = useState<{ pearls: number; boosters: number } | null>(null);

  const claim = () => {
    const r = claimDaily();
    if (r) setReward(r);
  };

  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const streak = state.dailyStreak;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Daily Reward 🎁" onBack={back} />

      <div className="flex-1 px-4">
        <div className="cream-card p-4 text-center">
          <div className="text-5xl">🐚</div>
          <h2 className="mt-1 font-display text-xl font-extrabold text-driftwood-dark">Day {streak + (claimedToday ? 0 : 1)}</h2>
          <p className="text-sm text-driftwood">Come back each day — the cove keeps a gift for you.</p>

          <div className="my-4 grid grid-cols-7 gap-1">
            {days.map((d) => {
              const reached = streak % 7 >= d || (streak % 7 === 0 && streak > 0 && d === 7);
              const isBonus = d % 3 === 0;
              return (
                <div
                  key={d}
                  className={`flex flex-col items-center rounded-xl py-2 ${
                    reached ? 'bg-seaglass/25' : 'bg-white/60'
                  }`}
                >
                  <span className="text-lg">{isBonus ? '🎁' : '🪙'}</span>
                  <span className="text-[9px] font-bold text-driftwood-dark">D{d}</span>
                </div>
              );
            })}
          </div>

          <CandyButton full disabled={claimedToday} onClick={claim}>
            {claimedToday ? 'Come back tomorrow 🌅' : 'Claim today\'s gift'}
          </CandyButton>
        </div>
      </div>

      {reward && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Daily gift!</h2>
            <p className="mt-2 font-bold text-seaglass-deep">🪙 +{reward.pearls} pearls</p>
            {reward.boosters > 0 && <p className="font-bold text-seaglass-deep">🌊 +1 Tide Surge</p>}
            <CandyButton full className="mt-4" onClick={() => setReward(null)}>
              Lovely!
            </CandyButton>
          </div>
        </CenterModal>
      )}
    </div>
  );
}
