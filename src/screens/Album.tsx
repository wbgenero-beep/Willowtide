import { useGame } from '../state/GameState';
import { AREAS, CREATURES } from '../data/creatures';

const RARITY: Record<string, { ring: string; label: string }> = {
  common: { ring: 'ring-driftwood-light', label: 'Common' },
  rare: { ring: 'ring-seaglass', label: 'Rare' },
  legendary: { ring: 'ring-pearl-gold', label: 'Legendary' },
};

export function Album() {
  const { state } = useGame();
  const total = CREATURES.length;
  const found = CREATURES.filter((c) => (state.collection[c.id] ?? 0) > 0).length;

  return (
    <div className="px-4 pt-1 pb-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-driftwood-dark">Album</h1>
          <p className="text-sm text-driftwood">Every friend is a named individual.</p>
        </div>
        <div className="rounded-full bg-white/70 px-3 py-1 text-sm font-extrabold text-seaglass-deep">
          {found}/{total}
        </div>
      </div>

      {AREAS.map((area) => {
        const set = CREATURES.filter((c) => c.area === area.id);
        return (
          <div key={area.id} className="mb-4">
            <h2 className="mb-2 font-display text-lg font-extrabold text-driftwood-dark">
              {area.emoji} {area.name}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {set.map((c) => {
                const count = state.collection[c.id] ?? 0;
                const found = count > 0;
                const r = RARITY[c.rarity];
                return (
                  <div
                    key={c.id}
                    className={`cream-card flex flex-col items-center p-2 text-center ring-2 ${
                      found ? r.ring : 'ring-transparent'
                    }`}
                  >
                    <div className={`text-3xl ${found ? '' : 'opacity-25 grayscale'}`}>
                      {found ? c.emoji : '❔'}
                    </div>
                    <div className="mt-0.5 text-xs font-extrabold text-driftwood-dark">
                      {found ? c.name : '???'}
                    </div>
                    <div className="text-[9px] leading-tight text-driftwood">
                      {found ? c.blurb : r.label}
                    </div>
                    {count > 1 && (
                      <div className="mt-0.5 rounded-full bg-seaglass/20 px-1.5 text-[9px] font-bold text-seaglass-deep">
                        rescued ×{count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
