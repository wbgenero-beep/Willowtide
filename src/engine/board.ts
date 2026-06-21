import type { Cell, LevelDef, PieceShape } from '../types';

export const SIZE = 8;

export function emptyBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ({ filled: false }) as Cell));
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((c) => ({ ...c })));
}

export function buildBoardFromLevel(level: LevelDef): Cell[][] {
  const board = emptyBoard();
  for (const o of level.obstacles ?? []) {
    const hits = o.type === 'driftwood' ? 2 : 1;
    board[o.row][o.col] = { filled: false, obstacle: o.type, hits };
  }
  for (const a of level.animals ?? []) {
    const cell = board[a.row][a.col];
    cell.animalId = a.creatureId;
  }
  return board;
}

// A cell counts as "occupied" for line completion if filled or a hard obstacle.
function occupies(cell: Cell): boolean {
  return cell.filled || cell.obstacle === 'crate' || cell.obstacle === 'driftwood';
}

function blocksPlacement(cell: Cell): boolean {
  return cell.filled || cell.obstacle !== undefined;
}

export function canPlace(board: Cell[][], shape: PieceShape, top: number, left: number): boolean {
  for (const [dr, dc] of shape.cells) {
    const r = top + dr;
    const c = left + dc;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (blocksPlacement(board[r][c])) return false;
  }
  return true;
}

export function placeShape(board: Cell[][], shape: PieceShape, top: number, left: number): Cell[][] {
  const next = cloneBoard(board);
  for (const [dr, dc] of shape.cells) {
    const cell = next[top + dr][left + dc];
    cell.filled = true;
    cell.color = shape.color;
  }
  return next;
}

export function fullRows(board: Cell[][]): number[] {
  const out: number[] = [];
  for (let r = 0; r < SIZE; r++) {
    let ok = true;
    for (let c = 0; c < SIZE; c++) {
      const cell = board[r][c];
      if (cell.obstacle === 'locked' || !occupies(cell)) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(r);
  }
  return out;
}

export function fullCols(board: Cell[][]): number[] {
  const out: number[] = [];
  for (let c = 0; c < SIZE; c++) {
    let ok = true;
    for (let r = 0; r < SIZE; r++) {
      const cell = board[r][c];
      if (cell.obstacle === 'locked' || !occupies(cell)) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(c);
  }
  return out;
}

export interface ClearResult {
  board: Cell[][];
  linesCleared: number;
  rows: number[];
  cols: number[];
  rescued: string[];
  obstaclesDestroyed: number;
  shells: number;
  clearedCells: [number, number][];
}

export function clearSpecific(board: Cell[][], rows: number[], cols: number[]): ClearResult {
  const next = cloneBoard(board);
  const rescued: string[] = [];
  let obstaclesDestroyed = 0;
  const clearedCells: [number, number][] = [];

  // count how many cleared lines pass through each cell (for obstacle hits)
  const hitCount = (r: number, c: number): number =>
    (rows.includes(r) ? 1 : 0) + (cols.includes(c) ? 1 : 0);

  const inClear = (r: number, c: number) => rows.includes(r) || cols.includes(c);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!inClear(r, c)) continue;
      const cell = next[r][c];
      clearedCells.push([r, c]);
      if (cell.animalId) {
        rescued.push(cell.animalId);
        cell.animalId = undefined;
      }
      if (cell.obstacle === 'crate' || cell.obstacle === 'driftwood') {
        const remaining = (cell.hits ?? 1) - hitCount(r, c);
        if (remaining <= 0) {
          obstaclesDestroyed += 1;
          cell.obstacle = undefined;
          cell.hits = undefined;
          cell.filled = false;
          cell.color = undefined;
        } else {
          cell.hits = remaining;
          cell.filled = false;
          cell.color = undefined;
        }
      } else {
        cell.filled = false;
        cell.color = undefined;
      }
    }
  }

  const linesCleared = rows.length + cols.length;
  const shells = linesCleared * 2;
  return { board: next, linesCleared, rows, cols, rescued, obstaclesDestroyed, shells, clearedCells };
}

export function resolveClears(board: Cell[][]): ClearResult {
  return clearSpecific(board, fullRows(board), fullCols(board));
}

// Unlock 'locked' tangles once enough lines have been cleared.
export function applyUnlocks(board: Cell[][], totalLinesCleared: number, threshold?: number): Cell[][] {
  if (!threshold || totalLinesCleared < threshold) return board;
  let changed = false;
  const next = cloneBoard(board);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (next[r][c].obstacle === 'locked') {
        next[r][c] = { filled: false };
        changed = true;
      }
    }
  }
  return changed ? next : board;
}

export function anyPlaceable(board: Cell[][], shapes: PieceShape[]): boolean {
  for (const shape of shapes) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (canPlace(board, shape, r, c)) return true;
      }
    }
  }
  return false;
}

// Remaining trapped animals on the board.
export function animalsOnBoard(board: Cell[][]): { id: string; row: number; col: number }[] {
  const out: { id: string; row: number; col: number }[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c].animalId) out.push({ id: board[r][c].animalId!, row: r, col: c });
    }
  }
  return out;
}

// Tide covers the bottom `tide` rows. A row r is submerged when r >= SIZE - tide.
export function rowSubmerged(row: number, tide: number): boolean {
  return tide > 0 && row >= SIZE - tide;
}
