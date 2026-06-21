import type { PieceShape } from '../types';

// Coastal "wood-block" palette (driftwood / sea-glass tones)
const COLORS = ['#C9A06A', '#A87C4F', '#5FB8B0', '#8FD6CE', '#FFB59A', '#FFCB47', '#E89B5A'];

export function colorFor(seed: number): string {
  return COLORS[Math.abs(seed) % COLORS.length];
}

// Shapes defined as filled [row,col] offsets. Normalised to start at 0,0.
const RAW: Record<string, [number, number][]> = {
  // 1
  dot: [[0, 0]],
  // 2
  domH: [[0, 0], [0, 1]],
  domV: [[0, 0], [1, 0]],
  // 3
  triL: [[0, 0], [1, 0], [1, 1]],
  triJ: [[0, 1], [1, 0], [1, 1]],
  triR: [[0, 0], [0, 1], [1, 0]],
  triS: [[0, 0], [0, 1], [1, 1]],
  i3H: [[0, 0], [0, 1], [0, 2]],
  i3V: [[0, 0], [1, 0], [2, 0]],
  // 4
  square: [[0, 0], [0, 1], [1, 0], [1, 1]],
  i4H: [[0, 0], [0, 1], [0, 2], [0, 3]],
  i4V: [[0, 0], [1, 0], [2, 0], [3, 0]],
  lT: [[0, 0], [1, 0], [2, 0], [2, 1]],
  lJ: [[0, 1], [1, 1], [2, 0], [2, 1]],
  tT: [[0, 0], [0, 1], [0, 2], [1, 1]],
  sS: [[0, 1], [0, 2], [1, 0], [1, 1]],
  sZ: [[0, 0], [0, 1], [1, 1], [1, 2]],
  // 5
  plus: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  i5H: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  cornerBig: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
};

// Difficulty buckets — earlier levels draw from easier shapes.
export const EASY = ['dot', 'domH', 'domV', 'triL', 'triJ', 'triR', 'triS', 'i3H', 'i3V', 'square'];
export const MID = [...EASY, 'i4H', 'i4V', 'lT', 'lJ', 'tT', 'sS', 'sZ'];
export const HARD = [...MID, 'plus', 'i5H', 'cornerBig'];

let colorCounter = 0;

export function buildShape(id: string): PieceShape {
  const cells = RAW[id];
  if (!cells) throw new Error('unknown shape ' + id);
  return { id, cells, color: COLORS[colorCounter++ % COLORS.length] };
}

export function shapeBounds(cells: [number, number][]): { rows: number; cols: number } {
  let rows = 0;
  let cols = 0;
  for (const [r, c] of cells) {
    rows = Math.max(rows, r + 1);
    cols = Math.max(cols, c + 1);
  }
  return { rows, cols };
}

export const ALL_SHAPE_IDS = Object.keys(RAW);
