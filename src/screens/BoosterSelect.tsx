import { useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { levelById } from '../data/levels';
import { areaById, creatureById } from '../data/creatures';
import { HEADSTART_INFO } from '../lib/constants';
import { CandyButton, ScreenHeader, CenterModal } from '../components/ui';
import type { HeadStartId } from '../types';

const TYPE_LABEL: Record<string, string> = {
  rescue: 'Rescue',
  cleanup: 'Clean-up',
  restore: 'Restore',
  storm: 'Storm 🌊',
};

export function BoosterSelect({ levelId }: { levelId: number }) {
  const { state, livesInfo, useHeadStart } = useGame();
  const { navigate, back } = useNav();
  const level = levelById(levelId);
  const [selected, setSelected] = useState<HeadStartId[]>([]);

  if (!level) {
    return (
      <div className="p-6 text-center text-driftwood">
        Level not found.
        <CandyButton className="mt-4" onClick={back}>Back</CandyButton>
      </div>
    );
  }

  const noLives = livesInfo.lives <= 0;

  const toggle = (id: HeadStartId) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 3) return cur;
      if ((state.headStarts[id] ?? 0) <= 0) return cur;
      return [...cur, id];
    });
  };

  const start = () => {
    for (const id of selected) useHeadStart(id);
    navigate({ name: 'level', levelId, headStarts: selected });
  };

  const objText =
    level.type === 'cleanup'
      ? `Clear ${level.cleanupTarget} debris`
      : level.type === 'restore'
        ? `Collect ${level.shellTarget} shells`
        : `Rescue ${level.rescueTarget} friend${(level.rescueTarget ?? 0) > 1 ? 's' : ''}`;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={`Level ${level.id}`} onBack={back} />

      <div className="flex-1 overflow-y-auto px-4">
        <div className="cream-card mb-4 p-4 text-center">
          <div className="mb-1 inline-block rounded-full bg-seaglass/15 px-3 py-0.5 text-xs font-bold text-seaglass-deep">
            {areaById(level.area).name} · {TYPE_LABEL[level.type]}
          </div>
          <h2 className="font-display text-xl font-extrabold text-driftwood-dark">{objText}</h2>
          <p className="mt-1 text-sm text-driftwood">{level.hook}</p>

          <div className="mt-3 flex items-center justify-center gap-3 text-sm font-bold text-driftwood-dark">
            <span>🎯 {level.budget} placements</span>
            {level.tide && <span className="text-seaglass-deep">🌊 rising tide</span>}
          </div>

          {level.animals && (
            <div className="mt-2 flex justify-center gap-1 text-2xl">
              {level.animals.map((a, i) => (
                <span key={i} title={creatureById(a.creatureId).name}>
                  {creatureById(a.creatureId).emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        <h3 className="mb-2 font-display text-lg font-extrabold text-driftwood-dark">
          Head-start boosters
          <span className="ml-2 text-sm font-bold text-driftwood">{selected.length}/3</span>
        </h3>
        <div className="space-y-2 pb-4">
          {(Object.keys(HEADSTART_INFO) as HeadStartId[]).map((id) => {
            const info = HEADSTART_INFO[id];
            const owned = state.headStarts[id] ?? 0;
            const on = selected.includes(id);
            const disabled = owned <= 0;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                disabled={disabled}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                  on ? 'bg-seaglass/20 ring-2 ring-seaglass' : 'bg-white/70'
                } ${disabled ? 'opacity-40' : ''}`}
              >
                <span className="text-2xl">{info.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-driftwood-dark">{info.name}</div>
                  <div className="text-xs text-driftwood">{info.blurb}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-driftwood">OWNED</div>
                  <div className="font-extrabold text-driftwood-dark">{owned}</div>
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                    on ? 'bg-seaglass text-white' : 'bg-driftwood-light/30'
                  }`}
                >
                  {on ? '✓' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3">
        <CandyButton full onClick={start} disabled={noLives}>
          {selected.length > 0 ? `Start with ${selected.length} head-start${selected.length > 1 ? 's' : ''}` : 'Start rescue ▶'}
        </CandyButton>
      </div>

      {noLives && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">💗</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Out of lives</h2>
            <p className="mt-1 text-sm text-driftwood">
              Lives refill over time. Meanwhile, Free Play never runs out!
            </p>
            <div className="mt-4 space-y-2">
              <CandyButton variant="teal" full onClick={() => navigate({ name: 'freeplay', mode: 'drift' })}>
                🎮 Play Free Mode
              </CandyButton>
              <CandyButton variant="gold" full onClick={back}>
                Back
              </CandyButton>
            </div>
          </div>
        </CenterModal>
      )}
    </div>
  );
}
