import { useMemo, useRef, useState } from 'react';
import type { BoosterId, Cell, FailType, HeadStartId, LevelDef, TrayPiece } from '../types';
import {
  anyPlaceable,
  animalsOnBoard,
  applyUnlocks,
  buildBoardFromLevel,
  canPlace,
  clearSpecific,
  cloneBoard,
  placeShape,
  resolveClears,
  rowSubmerged,
  SIZE,
} from './board';
import { makeTray, poolForLevel, wildPiece } from './tray';

export interface Progress {
  rescued: string[];
  cleanup: number;
  shells: number;
}

export interface EngineState {
  board: Cell[][];
  tray: (TrayPiece | null)[];
  budget: number;
  tide: number;
  placements: number;
  totalLines: number;
  progress: Progress;
  status: 'playing' | 'won' | 'lost';
  failType: FailType | null;
  jammed: boolean;
}

export interface ClearFx {
  id: number;
  rows: number[];
  cols: number[];
  clearedCells: [number, number][];
  rescued: string[];
  obstaclesDestroyed: number;
  shells: number;
  waveSurge: boolean;
  source: 'place' | 'booster';
}

export interface ObjectiveInfo {
  kind: 'rescue' | 'cleanup' | 'restore';
  target: number;
  value: number;
  label: string;
}

function objectiveInfo(level: LevelDef, p: Progress): ObjectiveInfo {
  if (level.type === 'cleanup') {
    return { kind: 'cleanup', target: level.cleanupTarget ?? 0, value: p.cleanup, label: 'Clear debris' };
  }
  if (level.type === 'restore') {
    return { kind: 'restore', target: level.shellTarget ?? 0, value: p.shells, label: 'Collect shells' };
  }
  return { kind: 'rescue', target: level.rescueTarget ?? 0, value: p.rescued.length, label: 'Rescue friends' };
}

function objectiveMet(level: LevelDef, p: Progress): boolean {
  const o = objectiveInfo(level, p);
  return o.value >= o.target;
}

function assess(
  level: LevelDef,
  board: Cell[][],
  tray: (TrayPiece | null)[],
  budget: number,
  tide: number,
  p: Progress,
): { status: EngineState['status']; failType: FailType | null; jammed: boolean } {
  if (objectiveMet(level, p)) return { status: 'won', failType: null, jammed: false };
  if (level.tide) {
    const slipped = animalsOnBoard(board).some((a) => rowSubmerged(a.row, tide));
    if (slipped) return { status: 'lost', failType: 'tide', jammed: false };
  }
  if (budget <= 0) return { status: 'lost', failType: 'budget', jammed: false };
  const shapes = tray.filter(Boolean).map((t) => t!.shape);
  if (!anyPlaceable(board, shapes)) return { status: 'playing', failType: null, jammed: true };
  return { status: 'playing', failType: null, jammed: false };
}

function buildInitial(level: LevelDef, headStarts: HeadStartId[], debug: boolean): EngineState {
  const pool = poolForLevel(level.id);
  let board = buildBoardFromLevel(level);
  let tray = makeTray(pool);
  let tide = level.tide ? level.tide.start : 0;
  const progress: Progress = { rescued: [], cleanup: 0, shells: 0 };
  let totalLines = 0;

  if (headStarts.includes('breakObstacle')) {
    outer: for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c].obstacle && board[r][c].obstacle !== 'locked') {
          const next = cloneBoard(board);
          next[r][c] = { filled: false, animalId: board[r][c].animalId };
          board = next;
          progress.cleanup += 1;
          break outer;
        }
      }
    }
  }

  if (headStarts.includes('clearRow')) {
    const next = cloneBoard(board);
    for (let c = 0; c < SIZE; c++) {
      if (!next[SIZE - 1][c].obstacle) next[SIZE - 1][c].filled = true;
    }
    const res = clearSpecific(next, [SIZE - 1], []);
    board = res.board;
    progress.shells += res.shells;
    progress.cleanup += res.obstaclesDestroyed;
    if (res.rescued.length) progress.rescued.push(...res.rescued);
    totalLines += 1;
    if (level.tide) tide = Math.max(0, tide - 1);
  }

  if (headStarts.includes('wildPiece')) {
    tray[0] = wildPiece();
  }

  void debug;
  return { board, tray, budget: level.budget, tide, placements: 0, totalLines, progress, status: 'playing', failType: null, jammed: false };
}

export function useLevelEngine(level: LevelDef, headStarts: HeadStartId[]) {
  const pool = useMemo(() => poolForLevel(level.id), [level.id]);
  const [engine, setEngineState] = useState<EngineState>(() => buildInitial(level, headStarts, false));
  const ref = useRef(engine);
  const [fx, setFx] = useState<ClearFx | null>(null);
  const fxId = useRef(0);

  const set = (n: EngineState) => {
    ref.current = n;
    setEngineState(n);
  };

  const emitFx = (data: Omit<ClearFx, 'id'>) => {
    fxId.current += 1;
    setFx({ ...data, id: fxId.current });
  };

  function refillIfEmpty(tray: (TrayPiece | null)[]): (TrayPiece | null)[] {
    if (tray.every((t) => t === null)) {
      return makeTray(pool);
    }
    return tray;
  }

  const place = (slotIndex: number, top: number, left: number): boolean => {
    const s = ref.current;
    if (s.status !== 'playing') return false;
    const piece = s.tray[slotIndex];
    if (!piece) return false;
    if (!canPlace(s.board, piece.shape, top, left)) return false;

    let board = placeShape(s.board, piece.shape, top, left);
    const tray = s.tray.slice();
    tray[slotIndex] = null;
    const budget = s.budget - 1;
    const placements = s.placements + 1;

    const clear = resolveClears(board);
    board = clear.board;
    let totalLines = s.totalLines + clear.linesCleared;
    board = applyUnlocks(board, totalLines, level.lockUnlockAfter);

    const progress: Progress = {
      rescued: clear.rescued.length ? [...s.progress.rescued, ...clear.rescued] : s.progress.rescued,
      cleanup: s.progress.cleanup + clear.obstaclesDestroyed,
      shells: s.progress.shells + clear.shells,
    };

    let tide = s.tide;
    if (level.tide) {
      if (clear.linesCleared > 0) tide = Math.max(0, tide - 1);
      if (placements % level.tide.riseEvery === 0) tide += 1;
    }

    const filled = refillIfEmpty(tray);
    const verdict = assess(level, board, filled, budget, tide, progress);

    set({ board, tray: filled, budget, tide, placements, totalLines, progress, ...verdict });
    emitFx({
      rows: clear.rows,
      cols: clear.cols,
      clearedCells: clear.clearedCells,
      rescued: clear.rescued,
      obstaclesDestroyed: clear.obstaclesDestroyed,
      shells: clear.shells,
      waveSurge: clear.linesCleared >= 2,
      source: 'place',
    });
    return true;
  };

  // ---- boosters ----

  const hammer = (r: number, c: number): boolean => {
    const s = ref.current;
    if (s.status !== 'playing') return false;
    const cell = s.board[r][c];
    if (!cell.filled && !cell.obstacle) return false;
    const board = cloneBoard(s.board);
    const wasObstacle = !!cell.obstacle;
    board[r][c] = { filled: false, animalId: cell.animalId };
    const progress: Progress = { ...s.progress, cleanup: s.progress.cleanup + (wasObstacle ? 1 : 0) };
    const verdict = assess(level, board, s.tray, s.budget, s.tide, progress);
    set({ ...s, board, progress, ...verdict });
    emitFx({ rows: [], cols: [], clearedCells: [[r, c]], rescued: [], obstaclesDestroyed: wasObstacle ? 1 : 0, shells: 0, waveSurge: false, source: 'booster' });
    return true;
  };

  const bomb = (cr: number, cc: number): boolean => {
    const s = ref.current;
    if (s.status !== 'playing') return false;
    const board = cloneBoard(s.board);
    const rescued: string[] = [];
    let destroyed = 0;
    let cleared = 0;
    const cells: [number, number][] = [];
    for (let r = cr - 1; r <= cr + 1; r++) {
      for (let c = cc - 1; c <= cc + 1; c++) {
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue;
        const cell = board[r][c];
        if (!cell.filled && !cell.obstacle && !cell.animalId) continue;
        cells.push([r, c]);
        if (cell.animalId) rescued.push(cell.animalId);
        if (cell.obstacle) destroyed += 1;
        if (cell.filled) cleared += 1;
        board[r][c] = { filled: false };
      }
    }
    const progress: Progress = {
      rescued: rescued.length ? [...s.progress.rescued, ...rescued] : s.progress.rescued,
      cleanup: s.progress.cleanup + destroyed,
      shells: s.progress.shells + cleared,
    };
    const verdict = assess(level, board, s.tray, s.budget, s.tide, progress);
    set({ ...s, board, progress, ...verdict });
    emitFx({ rows: [], cols: [], clearedCells: cells, rescued, obstaclesDestroyed: destroyed, shells: cleared, waveSurge: cells.length > 4, source: 'booster' });
    return true;
  };

  const surge = (r: number, c: number): boolean => {
    const s = ref.current;
    if (s.status !== 'playing') return false;
    const clear = clearSpecific(s.board, [r], [c]);
    const board = applyUnlocks(clear.board, s.totalLines + 2, level.lockUnlockAfter);
    const progress: Progress = {
      rescued: clear.rescued.length ? [...s.progress.rescued, ...clear.rescued] : s.progress.rescued,
      cleanup: s.progress.cleanup + clear.obstaclesDestroyed,
      shells: s.progress.shells + clear.shells,
    };
    let tide = s.tide;
    if (level.tide) tide = Math.max(0, tide - 2);
    const verdict = assess(level, board, s.tray, s.budget, tide, progress);
    set({ ...s, board, tide, totalLines: s.totalLines + 2, progress, ...verdict });
    emitFx({ rows: [r], cols: [c], clearedCells: clear.clearedCells, rescued: clear.rescued, obstaclesDestroyed: clear.obstaclesDestroyed, shells: clear.shells, waveSurge: true, source: 'booster' });
    return true;
  };

  const refreshTray = (): boolean => {
    const s = ref.current;
    if (s.status !== 'playing') return false;
    const tray = makeTray(pool);
    const verdict = assess(level, s.board, tray, s.budget, s.tide, s.progress);
    set({ ...s, tray, ...verdict });
    return true;
  };

  const calm = (): boolean => {
    const s = ref.current;
    if (s.status !== 'playing' || !level.tide) return false;
    const tide = Math.max(0, s.tide - 3);
    const verdict = assess(level, s.board, s.tray, s.budget, tide, s.progress);
    set({ ...s, tide, ...verdict });
    emitFx({ rows: [], cols: [], clearedCells: [], rescued: [], obstaclesDestroyed: 0, shells: 0, waveSurge: false, source: 'booster' });
    return true;
  };

  const useInLevelBooster = (id: BoosterId, target?: { r: number; c: number }): boolean => {
    switch (id) {
      case 'hammer':
        return target ? hammer(target.r, target.c) : false;
      case 'bomb':
        return target ? bomb(target.r, target.c) : false;
      case 'surge':
        return target ? surge(target.r, target.c) : false;
      case 'refresh':
        return refreshTray();
      case 'calm':
        return calm();
    }
  };

  const continueLevel = (extra: number): void => {
    const s = ref.current;
    let tide = s.tide;
    if (level.tide) tide = Math.max(0, tide - 3);
    let tray = s.tray;
    if (s.jammed || tray.every((t) => t === null)) tray = makeTray(pool);
    set({ ...s, budget: s.budget + extra, tide, tray, status: 'playing', failType: null, jammed: false });
  };

  const resolveJamWithRefresh = (): void => {
    const s = ref.current;
    const tray = makeTray(pool);
    const verdict = assess(level, s.board, tray, s.budget, s.tide, s.progress);
    set({ ...s, tray, ...verdict });
  };

  const objective = objectiveInfo(level, engine.progress);

  return {
    engine,
    fx,
    objective,
    place,
    useInLevelBooster,
    continueLevel,
    resolveJamWithRefresh,
  };
}
