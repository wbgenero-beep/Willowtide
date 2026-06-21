import type { AreaDef, Creature } from '../types';

export const AREAS: AreaDef[] = [
  {
    id: 'cove',
    name: 'Cove of Beginnings',
    emoji: '🏖️',
    blurb: 'A gentle sheltered cove where every rescue starts.',
    scene: '🏖️🌊🦦🐚',
  },
  {
    id: 'yard',
    name: 'Willow Yard',
    emoji: '🌳',
    blurb: 'Driftwood and old willow roots tangle along the shore.',
    scene: '🌳🪵🐢🐠',
  },
  {
    id: 'pond',
    name: 'Tidewater Pond',
    emoji: '🪷',
    blurb: 'A brackish pond where the tide breathes in and out.',
    scene: '🪷🐸🐙🦆',
  },
  {
    id: 'grove',
    name: 'Moonlit Grove',
    emoji: '🌙',
    blurb: 'The deep, quiet grove that glows under the moon.',
    scene: '🌙✨🦑🐋',
  },
];

export const CREATURES: Creature[] = [
  // ---- Cove of Beginnings ----
  { id: 'pip', emoji: '🦭', name: 'Pip', blurb: 'the brave little seal who started it all', area: 'cove', rarity: 'legendary' },
  { id: 'marlow', emoji: '🦀', name: 'Marlow', blurb: 'the grumpy old crab', area: 'cove', rarity: 'common' },
  { id: 'bubbles', emoji: '🐠', name: 'Bubbles', blurb: 'a cheerful tropical fish', area: 'cove', rarity: 'common' },
  { id: 'sandy', emoji: '🦐', name: 'Sandy', blurb: 'a jittery little shrimp', area: 'cove', rarity: 'common' },
  { id: 'puffin', emoji: '🐡', name: 'Puffin', blurb: 'a pufferfish with stage fright', area: 'cove', rarity: 'rare' },
  { id: 'star', emoji: '⭐', name: 'Twinkle', blurb: 'a sleepy sea star', area: 'cove', rarity: 'rare' },
  { id: 'waddle', emoji: '🐧', name: 'Waddle', blurb: 'a penguin far from home', area: 'cove', rarity: 'rare' },
  // ---- Willow Yard ----
  { id: 'shelldon', emoji: '🐢', name: 'Shelldon', blurb: "Shelby's young nephew", area: 'yard', rarity: 'common' },
  { id: 'finn', emoji: '🐟', name: 'Finn', blurb: 'a fish who loves a good current', area: 'yard', rarity: 'common' },
  { id: 'coral', emoji: '🐙', name: 'Coral', blurb: 'a curious young octopus', area: 'yard', rarity: 'rare' },
  { id: 'pinch', emoji: '🦞', name: 'Pinch', blurb: 'a lobster with strong opinions', area: 'yard', rarity: 'rare' },
  { id: 'glide', emoji: '🐬', name: 'Glide', blurb: 'a dolphin who never stops smiling', area: 'yard', rarity: 'legendary' },
  // ---- Tidewater Pond ----
  { id: 'hopper', emoji: '🐸', name: 'Hopper', blurb: 'a frog who hums old shanties', area: 'pond', rarity: 'common' },
  { id: 'quack', emoji: '🦆', name: 'Quack', blurb: 'a duck with somewhere to be', area: 'pond', rarity: 'common' },
  { id: 'nessa', emoji: '🐍', name: 'Nessa', blurb: 'a shy little sea snake', area: 'pond', rarity: 'rare' },
  { id: 'inky', emoji: '🦑', name: 'Inky', blurb: 'a squid who writes poetry', area: 'pond', rarity: 'legendary' },
  // ---- Moonlit Grove ----
  { id: 'luna', emoji: '🐋', name: 'Luna', blurb: 'a gentle whale who sings to the moon', area: 'grove', rarity: 'legendary' },
  { id: 'glow', emoji: '🪼', name: 'Glow', blurb: 'a jellyfish made of starlight', area: 'grove', rarity: 'rare' },
];

export const creatureById = (id: string): Creature =>
  CREATURES.find((c) => c.id === id) ?? {
    id,
    emoji: '🐚',
    name: 'Friend',
    blurb: 'a rescued sea friend',
    area: 'cove',
    rarity: 'common',
  };

export const areaById = (id: string): AreaDef => AREAS.find((a) => a.id === id)!;
