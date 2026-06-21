import type { PieceShape } from '../types';
import { shapeBounds } from '../data/pieces';

export function PieceView({ shape, cell, dim }: { shape: PieceShape; cell: number; dim?: boolean }) {
  const { rows, cols } = shapeBounds(shape.cells);
  const filled = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridTemplateRows: `repeat(${rows}, ${cell}px)` }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const on = filled.has(`${r},${c}`);
        return (
          <div key={i} style={{ width: cell, height: cell }} className="p-[2px]">
            {on && (
              <div
                className={`h-full w-full rounded-[6px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] ${dim ? 'opacity-40' : ''}`}
                style={{ background: shape.color }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
