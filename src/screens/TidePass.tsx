import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { CandyButton, ScreenHeader, ProgressBar } from '../components/ui';
import type { BoosterId } from '../types';

interface Reward {
  free: { kind: 'pearls' | 'booster'; amount: number; booster?: BoosterId; label: string };
  prem: { kind: 'pearls' | 'booster' | 'headstart'; amount: number; booster?: BoosterId; label: string };
}

const TIERS: Reward[] = [
  { free: { kind: 'pearls', amount: 50, label: '🪙 50' }, prem: { kind: 'pearls', amount: 150, label: '🪙 150' } },
  { free: { kind: 'booster', amount: 1, booster: 'refresh', label: '🔄 ×1' }, prem: { kind: 'booster', amount: 2, booster: 'surge', label: '🌊 ×2' } },
  { free: { kind: 'pearls', amount: 80, label: '🪙 80' }, prem: { kind: 'booster', amount: 1, booster: 'bomb', label: '💥 ×1' } },
  { free: { kind: 'booster', amount: 1, booster: 'hammer', label: '🔨 ×1' }, prem: { kind: 'pearls', amount: 300, label: '🪙 300' } },
  { free: { kind: 'pearls', amount: 100, label: '🪙 100' }, prem: { kind: 'booster', amount: 2, booster: 'calm', label: '🫧 ×2' } },
  { free: { kind: 'booster', amount: 1, booster: 'surge', label: '🌊 ×1' }, prem: { kind: 'pearls', amount: 500, label: '🪙 500' } },
];

export function TidePass() {
  const { state, addPearls, addBooster, claimTideReward, buyTidePremium } = useGame();
  const { back } = useNav();
  const { xp, premium, claimedFree, claimedPrem } = state.tidePass;
  const xpPerTier = 2;

  const grant = (r: Reward['free'] | Reward['prem']) => {
    if (r.kind === 'pearls') addPearls(r.amount);
    else if (r.kind === 'booster' && r.booster) addBooster(r.booster, r.amount);
  };

  const tierUnlocked = (i: number) => xp >= (i + 1) * xpPerTier;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Tide Pass 🎟️" onBack={back} />

      <div className="px-4">
        <div className="cream-card mb-3 p-3">
          <div className="flex items-center justify-between text-sm font-bold text-driftwood-dark">
            <span>Season progress</span>
            <span>{xp} ⭐</span>
          </div>
          <ProgressBar value={xp % xpPerTier} max={xpPerTier} className="mt-2" />
          <p className="mt-1 text-xs text-driftwood">Earn a star for every rescue you complete.</p>
          {!premium && (
            <CandyButton variant="gold" full className="mt-3" onClick={buyTidePremium}>
              Unlock Premium Lane · $4.99 (simulated)
            </CandyButton>
          )}
          {premium && <div className="mt-2 text-center text-xs font-extrabold text-pearl-gold">✨ Premium unlocked</div>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="space-y-2">
          {TIERS.map((t, i) => {
            const unlocked = tierUnlocked(i);
            const fClaimed = claimedFree.includes(i);
            const pClaimed = claimedPrem.includes(i);
            return (
              <div key={i} className="flex items-stretch gap-2">
                <div className="flex w-8 flex-col items-center justify-center">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${unlocked ? 'bg-seaglass text-white' : 'bg-driftwood-light/40 text-driftwood-dark'}`}>
                    {i + 1}
                  </div>
                </div>
                {/* free lane */}
                <Lane
                  label="FREE"
                  reward={t.free.label}
                  locked={!unlocked}
                  claimed={fClaimed}
                  onClaim={() => {
                    grant(t.free);
                    claimTideReward(i, false);
                  }}
                />
                {/* premium lane */}
                <Lane
                  label="PREMIUM"
                  reward={t.prem.label}
                  premium
                  locked={!unlocked || !premium}
                  claimed={pClaimed}
                  onClaim={() => {
                    grant(t.prem);
                    claimTideReward(i, true);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Lane({
  label,
  reward,
  locked,
  claimed,
  premium,
  onClaim,
}: {
  label: string;
  reward: string;
  locked: boolean;
  claimed: boolean;
  premium?: boolean;
  onClaim: () => void;
}) {
  return (
    <button
      disabled={locked || claimed}
      onClick={onClaim}
      className={`flex flex-1 flex-col items-center rounded-2xl p-2 ${
        premium ? 'bg-pearl-gold/30' : 'bg-white/70'
      } ${claimed ? 'opacity-50' : locked ? 'opacity-60' : 'shadow-sm active:translate-y-[2px]'}`}
    >
      <span className="text-[9px] font-extrabold text-driftwood">{label}</span>
      <span className="text-lg font-extrabold text-driftwood-dark">{reward}</span>
      <span className={`text-[10px] font-bold ${claimed ? 'text-seaglass-deep' : locked ? 'text-driftwood' : 'text-coral-dark'}`}>
        {claimed ? '✓ claimed' : locked ? '🔒 locked' : 'Tap to claim'}
      </span>
    </button>
  );
}
