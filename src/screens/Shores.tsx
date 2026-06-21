import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { AREAS } from '../data/creatures';
import { areaLevels } from '../data/levels';
import { CandyButton, ProgressBar } from '../components/ui';

export function Shores() {
  const { state } = useGame();
  const { navigate } = useNav();

  return (
    <div className="px-4 pt-1">
      <h1 className="mb-1 font-display text-2xl font-extrabold text-driftwood-dark">The Shores</h1>
      <p className="mb-3 text-sm text-driftwood">Restore every shore of the sanctuary.</p>

      <div className="space-y-3 pb-4">
        {AREAS.map((area) => {
          const levels = areaLevels(area.id);
          const ids = levels.map((l) => l.id);
          const first = ids[0];
          const completed = ids.filter((id) => id < state.currentLevelId).length;
          const unlocked = first <= state.currentLevelId;
          const done = completed >= levels.length;
          const isCurrent = unlocked && !done;

          return (
            <div
              key={area.id}
              className={`cream-card overflow-hidden ${!unlocked ? 'opacity-70' : ''}`}
            >
              <div
                className="flex items-center gap-3 p-3"
                style={{
                  background: done
                    ? 'linear-gradient(180deg,#8FD6CE33,#FBF3E4)'
                    : isCurrent
                      ? 'linear-gradient(180deg,#FFB59A22,#FBF3E4)'
                      : undefined,
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-3xl">
                  {unlocked ? area.emoji : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-extrabold text-driftwood-dark">{area.name}</h2>
                    {done && <span className="text-seaglass-deep">✓</span>}
                  </div>
                  <p className="text-xs text-driftwood">{area.blurb}</p>
                  {unlocked && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={completed} max={levels.length} className="flex-1" />
                      <span className="text-[10px] font-bold text-driftwood-dark">
                        {completed}/{levels.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isCurrent && (
                <div className="px-3 pb-3">
                  <CandyButton
                    full
                    onClick={() => navigate({ name: 'boosterSelect', levelId: state.currentLevelId })}
                  >
                    ▶ Play Level {state.currentLevelId}
                  </CandyButton>
                </div>
              )}
              {done && (
                <div className="px-3 pb-3 text-center text-xs font-bold text-seaglass-deep">
                  Restored — thank you for bringing it back to life 🌊
                </div>
              )}
              {!unlocked && (
                <div className="px-3 pb-3 text-center text-xs font-semibold text-driftwood">
                  Finish the previous shore to unlock.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
