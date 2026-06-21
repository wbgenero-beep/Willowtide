// ---- Board & pieces ----

export type ObstacleType = 'crate' | 'driftwood' | 'locked';

export interface Cell {
  filled: boolean;
  color?: string;
  obstacle?: ObstacleType;
  hits?: number; // remaining hits for driftwood; lines-needed for locked
  animalId?: string; // a trapped animal anchored to this cell
}

export interface PieceShape {
  id: string;
  cells: [number, number][]; // [row, col] offsets from top-left
  color: string;
}

export interface TrayPiece {
  uid: string; // unique instance id
  shape: PieceShape;
  wild?: boolean;
}

// ---- Levels ----

export type LevelType = 'rescue' | 'cleanup' | 'restore' | 'storm';

export interface TrappedAnimal {
  creatureId: string;
  row: number;
  col: number;
}

export interface ObstaclePlacement {
  type: ObstacleType;
  row: number;
  col: number;
}

export interface TideConfig {
  start: number; // initial tide height (rows from bottom)
  riseEvery: number; // rise +1 every N placements
}

export interface LevelDef {
  id: number;
  area: string;
  type: LevelType;
  budget: number;
  hook: string;
  animals?: TrappedAnimal[];
  rescueTarget?: number;
  cleanupTarget?: number;
  shellTarget?: number;
  obstacles?: ObstaclePlacement[];
  lockUnlockAfter?: number; // cleared lines needed to unlock 'locked' cells
  tide?: TideConfig;
}

// ---- Meta ----

export type BoosterId = 'hammer' | 'bomb' | 'surge' | 'refresh' | 'calm';
export type HeadStartId = 'clearRow' | 'wildPiece' | 'breakObstacle';

export interface Creature {
  id: string;
  emoji: string;
  name: string;
  blurb: string;
  area: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface AreaDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  scene: string; // emoji scene shown on Home when restored
}

export type FailType = 'budget' | 'tide' | 'jam';

export interface GameStateData {
  pearls: number;
  lives: number;
  livesUpdatedAt: number; // ms timestamp baseline for regen
  currentLevelId: number; // highest unlocked story level id
  restoredAreas: string[];
  collection: Record<string, number>; // creatureId -> rescue count
  boosters: Record<BoosterId, number>;
  headStarts: Record<HeadStartId, number>;
  shelbyGift: number; // 0..GIFT_GOAL
  failStreak: Record<number, number>; // levelId -> consecutive fails
  dailyLastClaimed: string; // YYYY-MM-DD
  dailyStreak: number;
  tidePass: { xp: number; premium: boolean; claimedFree: number[]; claimedPrem: number[] };
  pearlJar: number;
  freePlayHigh: { drift: number; tidal: number; zen: number };
  debug: boolean;
  tutorialDone: boolean;
}
