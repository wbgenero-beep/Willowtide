import { useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { CandyButton, ScreenHeader } from '../components/ui';

const SEED_FRIENDS = [
  { name: 'CoralKate', emoji: '🐢', level: 14 },
  { name: 'SaltyPete', emoji: '🦀', level: 9 },
  { name: 'LunaMoon', emoji: '🐬', level: 21 },
];

export function Friends() {
  const { state, addBooster } = useGame();
  const { back } = useNav();
  const [code, setCode] = useState('');
  const [friends, setFriends] = useState(SEED_FRIENDS);
  const [gifted, setGifted] = useState<string[]>([]);
  const myCode = 'OTTO-' + (1000 + (state.currentLevelId * 37) % 9000);

  const addFriend = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setFriends((f) => [...f, { name: c.replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'Friend', emoji: '🦦', level: 1 }]);
    setCode('');
  };

  const gift = (name: string) => {
    if (gifted.includes(name)) return;
    addBooster('refresh', 1);
    setGifted((g) => [...g, name]);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Friends 👭" onBack={back} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="cream-card mb-4 p-4 text-center">
          <p className="text-sm text-driftwood">Your invite code</p>
          <div className="my-2 font-display text-2xl font-extrabold tracking-wider text-driftwood-dark">{myCode}</div>
          <p className="text-[11px] text-driftwood">Share it with friends. No messaging, no strangers — just gifting. 💛</p>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter friend's code"
            className="flex-1 rounded-2xl border-2 border-driftwood-light/40 bg-white px-3 py-2 font-bold text-driftwood-dark outline-none focus:border-seaglass"
            style={{ userSelect: 'text' }}
          />
          <CandyButton onClick={addFriend}>Add</CandyButton>
        </div>

        <h2 className="mb-2 font-display text-lg font-extrabold text-driftwood-dark">Your friends</h2>
        <div className="space-y-2">
          {friends.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/70 p-2.5">
              <span className="text-2xl">{f.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-driftwood-dark">{f.name}</div>
                <div className="text-xs text-driftwood">Level {f.level}</div>
              </div>
              <CandyButton variant="teal" className="!px-3 !py-2 text-sm" disabled={gifted.includes(f.name)} onClick={() => gift(f.name)}>
                {gifted.includes(f.name) ? 'Sent ✓' : '🎁 Gift'}
              </CandyButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
