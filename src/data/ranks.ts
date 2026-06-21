export interface Bot {
  name: string;
  emoji: string;
  score: number;
}

// Deterministic-ish believable leaderboard pools, seeded locally (no backend).
const NAMES = [
  'TideWhisperer', 'CoralKate', 'OttosBuddy', 'ShellSeeker', 'PearlDiver88', 'MarinaB',
  'SaltyPete', 'LunaMoon', 'DriftwoodDan', 'BaySplash', 'FinneganF', 'SeaGlassSue',
  'CaptainKelp', 'MistyShores', 'WaveRider', 'BarnacleBob', 'AnchorAmy', 'ReefRunner',
  'CocoTide', 'SandpiperJo', 'NauticalNell', 'HarborHank', 'BreezyBella', 'GullGray',
  'StarfishStu', 'PelicanPam', 'CoveCarol', 'EbbAndElla', 'SkipperSam', 'DuneDarcy',
];
const EMOJI = ['🦦', '🐢', '🦭', '🐠', '🦀', '🐙', '🐧', '🐬', '🦞', '🐡', '🦑', '🪼'];

function seeded(i: number): number {
  const x = Math.sin(i * 99.13) * 10000;
  return x - Math.floor(x);
}

export function buildLeaderboard(scope: 'global' | 'national' | 'friends', playerScore: number): Bot[] {
  const counts = { global: 28, national: 12, friends: 7 };
  const spread = { global: 4200, national: 1800, friends: 900 };
  const base = { global: 600, national: 400, friends: 200 };
  const n = counts[scope];
  const bots: Bot[] = [];
  for (let i = 0; i < n; i++) {
    const r = seeded(i + (scope === 'global' ? 0 : scope === 'national' ? 100 : 200));
    bots.push({
      name: NAMES[(i * 3 + (scope.length % NAMES.length)) % NAMES.length],
      emoji: EMOJI[i % EMOJI.length],
      score: Math.round(base[scope] + r * spread[scope]),
    });
  }
  bots.push({ name: 'You', emoji: '⭐', score: playerScore });
  bots.sort((a, b) => b.score - a.score);
  return bots;
}
