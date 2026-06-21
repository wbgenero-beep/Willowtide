import type { PieceShape, TrayPiece } from '../types';
import { buildShape, EASY, HARD, MID } from '../data/pieces';

let counter = 0;
export function uid(): string {
  counter += 1;
  return `p${counter}_${Math.floor(Math.random() * 1e6)}`;
}

export function poolForLevel(levelId: number): string[] {
  if (levelId <= 4) return EASY;
  if (levelId <= 14) return MID;
  return HARD;
}

export function makePiece(pool: string[]): TrayPiece {
  const id = pool[Math.floor(Math.random() * pool.length)];
  return { uid: uid(), shape: buildShape(id) };
}

export function wildPiece(): TrayPiece {
  const shape: PieceShape = { id: 'wild', cells: [[0, 0]], color: '#FFCB47' };
  return { uid: uid(), shape, wild: true };
}

export function makeTray(pool: string[], count = 3): (TrayPiece | null)[] {
  return Array.from({ length: count }, () => makePiece(pool));
}
