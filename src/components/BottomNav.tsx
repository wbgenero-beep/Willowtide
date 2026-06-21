import { useNav } from '../state/Nav';
import type { Route } from '../state/Nav';

const TABS: { name: Route['name']; label: string; emoji: string }[] = [
  { name: 'ranks', label: 'Ranks', emoji: '🏆' },
  { name: 'shores', label: 'Shores', emoji: '🗺️' },
  { name: 'home', label: 'Home', emoji: '🏠' },
  { name: 'album', label: 'Album', emoji: '📖' },
  { name: 'play', label: 'Play', emoji: '🎮' },
];

export function BottomNav() {
  const { route, navigate } = useNav();
  return (
    <div className="flex items-stretch border-t border-driftwood-light/30 bg-sand-deep/90 px-1 pb-1 pt-1 backdrop-blur">
      {TABS.map((t) => {
        const active = route.name === t.name;
        const center = t.name === 'home';
        return (
          <button
            key={t.name}
            onClick={() => navigate({ name: t.name } as Route)}
            className="relative flex flex-1 flex-col items-center justify-center py-1.5"
          >
            <div
              className={`flex items-center justify-center rounded-2xl transition-all ${
                center ? '-mt-6 h-14 w-14 text-3xl shadow-candy-coral' : 'h-9 w-9 text-xl'
              } ${
                center
                  ? 'bg-gradient-to-b from-coral-light to-coral'
                  : active
                    ? 'bg-seaglass/25'
                    : ''
              }`}
            >
              {t.emoji}
            </div>
            <span
              className={`mt-0.5 text-[10px] font-bold ${
                active ? 'text-seaglass-deep' : 'text-driftwood/70'
              }`}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
