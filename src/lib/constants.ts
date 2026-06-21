export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 30 * 60 * 1000; // 30 minutes
export const GIFT_GOAL = 3; // levels to fill Shelby's Gift
export const PEARL_JAR_GOAL = 500; // pearls to "crack" the jar (~$4.99)

// Continue-offer pricing (escalates with consecutive fails)
export const CONTINUE_BASE = 60;
export const CONTINUE_STEP = 40;
export const COMEBACK_DISCOUNT = 0.3; // 30% off on 3rd+ consecutive fail

export function continuePrice(failStreak: number): { price: number; comeback: boolean } {
  const raw = CONTINUE_BASE + Math.max(0, failStreak) * CONTINUE_STEP;
  const comeback = failStreak >= 2; // 3rd consecutive attempt failing
  const price = comeback ? Math.round((raw * (1 - COMEBACK_DISCOUNT)) / 5) * 5 : raw;
  return { price, comeback };
}

// In-level booster costs to buy from the shop
export const BOOSTER_INFO: Record<
  string,
  { name: string; emoji: string; blurb: string; price: number }
> = {
  hammer: { name: 'Pebble Hammer', emoji: '🔨', blurb: 'Remove a single block or obstacle cell.', price: 80 },
  bomb: { name: 'Wave Bomb', emoji: '💥', blurb: 'Detonate a 3×3 area.', price: 120 },
  surge: { name: 'Tide Surge', emoji: '🌊', blurb: 'Clear a full row + column cross.', price: 160 },
  refresh: { name: 'Tray Refresh', emoji: '🔄', blurb: 'Discard your tray and draw 3 new pieces.', price: 60 },
  calm: { name: 'Calm Wave', emoji: '🫧', blurb: 'Push the tide back several steps.', price: 90 },
};

export const HEADSTART_INFO: Record<
  string,
  { name: string; emoji: string; blurb: string; price: number }
> = {
  clearRow: { name: 'Pre-Cleared Row', emoji: '➖', blurb: 'Start with the bottom row already cleared.', price: 100 },
  wildPiece: { name: 'Wild Block', emoji: '✨', blurb: 'Start with a bonus 1×1 wild piece in the tray.', price: 90 },
  breakObstacle: { name: 'Pre-Broken Crate', emoji: '🪓', blurb: 'Start with one obstacle already broken.', price: 110 },
};
