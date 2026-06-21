import React from 'react';
import type { Cell } from '../types';
import { SIZE } from '../engine/board';
import { creatureById } from '../data/creatures';

export const BOARD_PX = 336;
export const CELL = BOARD_PX / SIZE;

const OBSTACLE_EMOJI: Record<string, string> = {
  crate: '📦',
  driftwood: '🪵',
  locked: '🪢',
};

export interface Ghost {
  cells: [number, number][];
  valid: boolean;
}

export const BoardView = React.forwardRef<
  HTMLDivElement,
  {
    board: Cell[][];
    ghost?: Ghost | null;
    tide?: number;
    targeting?: boolean;
    flash?: Set<string>;
    onCellPointerDown?: (r: number, c: number, e: React.PointerEvent) => void;
  }
>(function BoardView({ board, ghost, tide = 0, targeting, flash, onCellPointerDown }, ref) {
  const ghostSet = new Map<string, boolean>();
  if (ghost) for (const [r, c] of ghost.cells) ghostSet.set(`${r},${c}`, ghost.valid);

  return (
    <div
      ref={ref}
      className={`relative grid touch-none select-none rounded-2xl bg-driftwood/20 p-1 shadow-inner ${
        targeting ? 'ring-4 ring-coral animate-shimmer' : ''
      }`}
      style={{ width: BOARD_PX, height: BOARD_PX, gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r},${c}`;
          const g = ghostSet.get(key);
          const submerged = tide > 0 && r >= SIZE - tide;
          const isFlash = flash?.has(key);
          return (
            <div
              key={key}
              onPointerDown={(e) => onCellPointerDown?.(r, c, e)}
              className="relative flex items-center justify-center"
              style={{ width: CELL, height: CELL }}
            >
              {/* base tile */}
              <div className="absolute inset-[2px] rounded-[6px] bg-sand-deep/70 shadow-inner" />

              {/* filled block */}
              {cell.filled && !cell.obstacle && (
                <div
                  className={`absolute inset-[2px] rounded-[6px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] ${
                    isFlash ? 'animate-pop' : ''
                  }`}
                  style={{ background: cell.color }}
                />
              )}

              {/* obstacle */}
              {cell.obstacle && (
                <div className="absolute inset-[2px] flex items-center justify-center rounded-[6px] bg-driftwood-light/80 text-[18px] shadow-inner">
                  {OBSTACLE_EMOJI[cell.obstacle]}
                  {cell.obstacle === 'driftwood' && (cell.hits ?? 0) > 1 && (
                    <span className="absolute bottom-0 right-0.5 text-[8px] font-extrabold text-coral-dark">{cell.hits}</span>
                  )}
                </div>
              )}

              {/* trapped animal */}
              {cell.animalId && (
                <span className={`relative z-10 text-[20px] ${submerged ? 'animate-shake' : 'animate-bob'}`}>
                  {creatureById(cell.animalId).emoji}
                </span>
              )}

              {/* tide water */}
              {submerged && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]">
                  <div className="absolute inset-0 bg-seaglass/45" />
                  <div className="absolute -inset-x-2 top-0 h-1.5 animate-wave bg-seaglass-light/70" />
                </div>
              )}

              {/* ghost preview */}
              {g !== undefined && (
                <div
                  className={`absolute inset-[2px] rounded-[6px] ${
                    g ? 'bg-seaglass-light/70 ring-2 ring-seaglass' : 'bg-coral/40 ring-2 ring-coral-dark'
                  }`}
                />
              )}
            </div>
          );
        }),
      )}
    </div>
  );
});
