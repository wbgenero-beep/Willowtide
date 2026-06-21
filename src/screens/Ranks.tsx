import { useMemo, useState } from 'react';
import { useGame } from '../state/GameState';
import { buildLeaderboard } from '../data/ranks';

const SCOPES = [
  { id: 'global', label: 'Global' },
  { id: 'national', label: 'National' },
  { id: 'friends', label: 'Friends' },
] as const;

export function Ranks() {
  const { state } = useGame();
  const [scope, setScope] = useState<'global' | 'national' | 'friends'>('national');

  // player "score" derived from progress + collection so it feels earned
  const playerScore = useMemo(
    () =>
      state.currentLevelId * 120 +
      Object.values(state.collection).reduce((a, b) => a + b, 0) * 60 +
      Math.max(state.freePlayHigh.drift, state.freePlayHigh.tidal, state.freePlayHigh.zen),
    [state],
  );

  const board = useMemo(() => buildLeaderboard(scope, playerScore), [scope, playerScore]);
  const myRank = board.findIndex((b) => b.name === 'You') + 1;

  return (
    <div className="px-4 pt-1 pb-4">
      <h1 className="mb-1 font-display text-2xl font-extrabold text-driftwood-dark">Ranks</h1>
      <p className="mb-3 text-sm text-driftwood">
        You're #{myRank} {scope === 'national' && 'in your nation 🎉'}
      </p>

      <div className="mb-3 flex gap-1 rounded-full bg-white/60 p-1">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${
              scope === s.id ? 'bg-seaglass text-white shadow' : 'text-driftwood'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {board.map((b, i) => {
          const me = b.name === 'You';
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                me ? 'bg-pearl-gold/40 ring-2 ring-pearl-gold' : 'bg-white/70'
              }`}
            >
              <div
                className={`w-6 text-center font-display font-extrabold ${
                  i === 0 ? 'text-pearl-gold' : 'text-driftwood'
                }`}
              >
                {i + 1}
              </div>
              <span className="text-2xl">{b.emoji}</span>
              <span className={`flex-1 font-bold ${me ? 'text-driftwood-dark' : 'text-driftwood-dark'}`}>
                {b.name}
              </span>
              <span className="font-display font-extrabold text-seaglass-deep">{b.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
