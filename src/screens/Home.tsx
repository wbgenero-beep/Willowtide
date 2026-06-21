import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { AREAS, areaById, creatureById } from '../data/creatures';
import { levelById, MAX_LEVEL } from '../data/levels';
import { todayKey } from '../lib/storage';
import { GIFT_GOAL } from '../lib/constants';
import { CandyButton } from '../components/ui';

function currentArea(levelId: number) {
  const lvl = levelById(Math.min(levelId, MAX_LEVEL));
  return areaById(lvl ? lvl.area : AREAS[AREAS.length - 1].id);
}

export function Home() {
  const { state, claimDaily } = useGame();
  const { navigate } = useNav();

  const area = currentArea(state.currentLevelId);
  const nextLevel = levelById(Math.min(state.currentLevelId, MAX_LEVEL));
  const allDone = state.currentLevelId > MAX_LEVEL;

  // residents = rescued creatures belonging to the current (or restored) areas
  const residents = Object.keys(state.collection)
    .filter((id) => state.collection[id] > 0)
    .map(creatureById)
    .slice(0, 8);

  const dailyReady = state.dailyLastClaimed !== todayKey();
  const giftFull = state.shelbyGift >= GIFT_GOAL;

  return (
    <div className="flex h-full flex-col">
      {/* greeting */}
      <div className="px-4 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🦦</span>
          <div className="rounded-2xl rounded-bl-none bg-white/80 px-3 py-1.5 text-sm font-semibold text-driftwood-dark shadow-sm">
            {allDone ? 'The whole sanctuary is glowing. Thank you!' : `Welcome back! ${area.name} needs you.`}
          </div>
        </div>
      </div>

      {/* the Sanctuary scene */}
      <div className="relative mx-3 mt-3 flex-1 overflow-hidden rounded-3xl bg-gradient-to-b from-seaglass-light/60 via-sand to-sand-deep shadow-cardsoft">
        {/* sun + sky */}
        <div className="absolute right-5 top-4 text-4xl">☀️</div>
        <div className="absolute left-0 top-0 px-4 pt-3">
          <div className="font-display text-lg font-extrabold text-driftwood-dark">{area.emoji} {area.name}</div>
          <div className="text-xs font-semibold text-driftwood">The living sanctuary</div>
        </div>

        {/* restored-area badges */}
        <div className="absolute left-3 top-14 flex flex-wrap gap-1">
          {state.restoredAreas.map((id) => (
            <span key={id} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-seaglass-deep">
              ✓ {areaById(id).name}
            </span>
          ))}
        </div>

        {/* diegetic tappable objects */}
        <SceneObject className="left-4 top-28" emoji="🫙" label="Pearl Jar" onClick={() => navigate({ name: 'pearljar' })} badge={`${Math.round((state.pearlJar / 500) * 100)}%`} />
        <SceneObject className="right-4 top-28" emoji="🎁" label="Daily" onClick={() => navigate({ name: 'daily' })} pulse={dailyReady} />
        <SceneObject className="left-4 top-48" emoji="📖" label="Album" onClick={() => navigate({ name: 'album' })} />
        <SceneObject className="right-4 top-48" emoji="🏆" label="Ranks" onClick={() => navigate({ name: 'ranks' })} />
        <SceneObject className="left-4 top-[17rem]" emoji="👭" label="Friends" onClick={() => navigate({ name: 'friends' })} />
        <SceneObject className="right-4 top-[17rem]" emoji="🎟️" label="Tide Pass" onClick={() => navigate({ name: 'tidepass' })} />

        {/* Shelby's Gift */}
        <button
          onClick={() => navigate({ name: 'play' })}
          className="absolute left-1/2 top-32 -translate-x-1/2 text-center"
        >
          <div className={`text-5xl ${giftFull ? 'animate-bob' : ''}`}>{giftFull ? '🎉' : '🐚'}</div>
          <div className="mt-0.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-driftwood-dark">
            Shelby's Gift {state.shelbyGift}/{GIFT_GOAL}
          </div>
        </button>

        {/* Otto + residents on the shore */}
        <div className="absolute bottom-16 left-0 right-0 flex flex-wrap items-end justify-center gap-1 px-4">
          <span className="animate-bob text-5xl" style={{ animationDelay: '0.2s' }}>🦦</span>
          {residents.map((c, i) => (
            <span key={c.id} className="animate-bob text-2xl" style={{ animationDelay: `${(i % 5) * 0.3}s` }} title={c.name}>
              {c.emoji}
            </span>
          ))}
          {residents.length === 0 && (
            <span className="mb-2 text-xs font-semibold text-driftwood">Rescue friends and they'll live here →</span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-seaglass/50 to-transparent" />
      </div>

      {/* pinned CTA */}
      <div className="px-4 py-3">
        {allDone ? (
          <CandyButton full variant="teal" onClick={() => navigate({ name: 'play' })}>
            🎮 Play Free Mode
          </CandyButton>
        ) : (
          <button
            onClick={() => navigate({ name: 'boosterSelect', levelId: state.currentLevelId })}
            className="candy-btn candy-coral w-full"
          >
            <div className="font-display text-lg font-extrabold">Start rescue · Level {state.currentLevelId}</div>
            <div className="text-xs font-semibold text-white/90">
              {nextLevel?.type === 'storm' ? '🌊 tide rising · ' : ''}
              {nextLevel?.rescueTarget ? `${nextLevel.rescueTarget} friends waiting` : nextLevel?.hook}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function SceneObject({
  className,
  emoji,
  label,
  onClick,
  badge,
  pulse,
}: {
  className: string;
  emoji: string;
  label: string;
  onClick: () => void;
  badge?: string;
  pulse?: boolean;
}) {
  return (
    <button onClick={onClick} className={`absolute flex flex-col items-center ${className}`}>
      <div className="relative">
        <span className="text-3xl drop-shadow">{emoji}</span>
        {pulse && <span className="absolute -right-1 -top-1 h-3 w-3 animate-shimmer rounded-full bg-coral" />}
        {badge && (
          <span className="absolute -bottom-1 -right-2 rounded-full bg-pearl-gold px-1 text-[8px] font-extrabold text-driftwood-dark">
            {badge}
          </span>
        )}
      </div>
      <span className="rounded-full bg-white/60 px-1.5 text-[9px] font-bold text-driftwood-dark">{label}</span>
    </button>
  );
}
