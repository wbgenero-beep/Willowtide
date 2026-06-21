import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { levelById, MAX_LEVEL } from '../data/levels';
import { creatureById } from '../data/creatures';
import { continuePrice, BOOSTER_INFO } from '../lib/constants';
import { canPlace, SIZE } from '../engine/board';
import { useLevelEngine } from '../engine/useLevelEngine';
import { BoardView, CELL } from '../components/BoardView';
import { PieceView } from '../components/PieceView';
import { useDrag } from '../components/useDrag';
import { CandyButton, CenterModal, ProgressBar } from '../components/ui';
import type { BoosterId, FailType, HeadStartId } from '../types';

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'shell' | 'pearl' | 'rescue';
}

const TARGETED: BoosterId[] = ['hammer', 'bomb', 'surge'];

export function Level({ levelId, headStarts }: { levelId: number; headStarts: HeadStartId[] }) {
  const level = levelById(levelId)!;
  const game = useGame();
  const { state } = game;
  const { navigate, back } = useNav();
  const engineApi = useLevelEngine(level, headStarts);
  const { engine, fx, objective, place, useInLevelBooster, continueLevel, resolveJamWithRefresh } = engineApi;

  const boardRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState<BoosterId | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [surge, setSurge] = useState(false);
  const [flash, setFlash] = useState<Set<string>>(new Set());

  const drag = useDrag(boardRef, {
    canDrop: (shape, r, c) => engine.status === 'playing' && !armed && canPlace(engine.board, shape, r, c),
    onDrop: (slot, r, c) => place(slot, r, c),
  });

  // ---- win / fail bookkeeping ----
  const resolvedRef = useRef(false);
  const [failInfo, setFailInfo] = useState<{ type: FailType; price: number; comeback: boolean } | null>(null);
  const [won, setWon] = useState<{ rescued: string[]; pearls: number } | null>(null);
  const [debugLog, setDebugLog] = useState<{ budget: number; tide: number; jam: number; offered: number; accepted: number }>(
    { budget: 0, tide: 0, jam: 0, offered: 0, accepted: 0 },
  );

  useEffect(() => {
    if (engine.status === 'won' && !resolvedRef.current) {
      resolvedRef.current = true;
      const leftover = Math.max(0, engine.budget);
      const pearls =
        50 + engine.progress.rescued.length * 20 + engine.progress.cleanup * 8 + Math.floor(engine.progress.shells / 2) * 4 + leftover * 2;
      const rescued = engine.progress.rescued.length ? engine.progress.rescued : level.animals?.map((a) => a.creatureId) ?? [];
      game.recordWin(levelId, rescued, pearls);
      setWon({ rescued, pearls });
    }
    if (engine.status === 'lost' && !resolvedRef.current && engine.failType) {
      resolvedRef.current = true;
      const prevStreak = state.failStreak[levelId] ?? 0;
      const { price, comeback } = continuePrice(prevStreak);
      game.recordFail(levelId);
      const type = engine.failType;
      // eslint-disable-next-line no-console
      console.log(`[Willowtide] FAIL type=${type} level=${levelId} streak=${prevStreak + 1} offerPrice=${price} comeback=${comeback}`);
      setDebugLog((d) => ({ ...d, [type]: d[type] + 1, offered: d.offered + 1 }));
      setFailInfo({ type, price, comeback });
    }
  }, [engine.status, engine.failType]);

  // ---- jam logging ----
  const jamLoggedRef = useRef(false);
  useEffect(() => {
    if (engine.jammed && !jamLoggedRef.current) {
      jamLoggedRef.current = true;
      // eslint-disable-next-line no-console
      console.log(`[Willowtide] FAIL type=jam level=${levelId} (board-jam) — offering refresh`);
      setDebugLog((d) => ({ ...d, jam: d.jam + 1 }));
    }
    if (!engine.jammed) jamLoggedRef.current = false;
  }, [engine.jammed]);

  // ---- juice from fx ----
  useEffect(() => {
    if (!fx) return;
    if (fx.clearedCells.length >= 4 || fx.waveSurge) setShakeKey((k) => k + 1);
    if (fx.waveSurge) {
      setSurge(true);
      setTimeout(() => setSurge(false), 1100);
    }
    // flash cleared cells
    const set = new Set(fx.clearedCells.map(([r, c]) => `${r},${c}`));
    setFlash(set);
    setTimeout(() => setFlash(new Set()), 320);

    const el = boardRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const add: Floater[] = [];
      let n = Date.now();
      if (fx.shells > 0) add.push({ id: n++, x: rect.left + rect.width / 2, y: rect.top + 30, text: `+${fx.shells} 🐚`, kind: 'shell' });
      for (const id of fx.rescued) {
        add.push({ id: n++, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, text: creatureById(id).emoji, kind: 'rescue' });
      }
      if (add.length) {
        setFloaters((f) => [...f, ...add]);
        setTimeout(() => setFloaters((f) => f.filter((x) => !add.some((a) => a.id === x.id))), 1000);
      }
    }
  }, [fx?.id]);

  // ---- booster handling ----
  const tapBooster = (id: BoosterId) => {
    if (engine.status !== 'playing') return;
    if ((state.boosters[id] ?? 0) <= 0) return;
    if (TARGETED.includes(id)) {
      setArmed((a) => (a === id ? null : id));
    } else {
      if (useInLevelBooster(id)) game.useBooster(id);
    }
  };

  const onCellPointerDown = (r: number, c: number) => {
    if (!armed) return;
    const ok = useInLevelBooster(armed, { r, c });
    if (ok) {
      game.useBooster(armed);
      setArmed(null);
    }
  };

  // ---- continue / give up ----
  const doContinue = (extra: number) => {
    if (!failInfo) return;
    if (!game.spendPearls(failInfo.price)) {
      navigate({ name: 'shop' });
      return;
    }
    setDebugLog((d) => ({ ...d, accepted: d.accepted + 1 }));
    // eslint-disable-next-line no-console
    console.log(`[Willowtide] CONTINUE accepted level=${levelId} price=${failInfo.price}`);
    continueLevel(extra);
    setFailInfo(null);
    resolvedRef.current = false;
  };

  const giveUp = () => {
    game.loseLife();
    setFailInfo(null);
    back();
  };

  const continueFromJam = () => {
    resolveJamWithRefresh();
  };

  const progressPct = objective;
  const [showTutorial, setShowTutorial] = useState(!state.tutorialDone);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-seaglass-light/40 to-sand">
      {/* header */}
      <div className="flex items-center gap-2 px-3 pb-1 pt-3">
        <button onClick={giveUp} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-lg active:translate-y-[2px]">
          ✕
        </button>
        <div className="flex-1 rounded-2xl bg-white/70 px-3 py-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-driftwood-dark">
            <span>
              {objective.kind === 'rescue' ? '🆘 Rescue' : objective.kind === 'cleanup' ? '🧹 Clear' : '🐚 Collect'} {progressPct.value}/{progressPct.target}
            </span>
            <span>{level.type === 'storm' ? '🌊 Storm' : 'Calm'}</span>
          </div>
          <ProgressBar value={progressPct.value} max={progressPct.target} className="mt-1" />
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-coral/90 px-2.5 py-1 text-white shadow-candy-coral">
          <span className="font-display text-lg font-extrabold leading-none">{engine.budget}</span>
          <span className="text-[8px] font-bold leading-none">LEFT</span>
        </div>
      </div>

      {/* tide bar */}
      {level.tide && (
        <div className="px-3 pb-1">
          <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-seaglass-deep">
            🌊 Tide
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-driftwood-light/30">
              <div className="h-full rounded-full bg-seaglass transition-all" style={{ width: `${(engine.tide / SIZE) * 100}%` }} />
            </div>
            <span>{engine.tide >= SIZE - 1 ? 'high!' : ''}</span>
          </div>
        </div>
      )}

      {/* board */}
      <div className="flex flex-1 items-center justify-center">
        <div key={shakeKey} className={shakeKey ? 'animate-shake' : ''}>
          <BoardView
            ref={boardRef}
            board={engine.board}
            tide={engine.tide}
            ghost={drag.ghost}
            targeting={!!armed}
            flash={flash}
            onCellPointerDown={(r, c) => onCellPointerDown(r, c)}
          />
        </div>
      </div>

      {/* tray */}
      <div className="flex items-end justify-around px-3 py-2" style={{ minHeight: 84 }}>
        {engine.tray.map((piece, slot) => (
          <div key={slot} className="flex h-[72px] flex-1 items-center justify-center">
            {piece && (drag.drag?.slot !== slot) && (
              <div onPointerDown={(e) => drag.startDrag(slot, piece.shape, e)} className="cursor-grab touch-none active:cursor-grabbing">
                <PieceView shape={piece.shape} cell={20} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* booster bar */}
      <div className="flex items-center justify-center gap-2 border-t border-driftwood-light/30 bg-sand-deep/70 px-3 py-2">
        {(['hammer', 'bomb', 'surge', 'refresh', ...(level.tide ? (['calm'] as BoosterId[]) : [])] as BoosterId[]).map((id) => {
          const count = state.boosters[id] ?? 0;
          const active = armed === id;
          return (
            <button
              key={id}
              onClick={() => tapBooster(id)}
              disabled={count <= 0}
              className={`relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl text-xl transition ${
                active ? 'bg-coral text-white ring-2 ring-coral-dark' : 'bg-white/80'
              } ${count <= 0 ? 'opacity-40' : 'shadow-sm active:translate-y-[2px]'}`}
              title={BOOSTER_INFO[id].name}
            >
              {BOOSTER_INFO[id].emoji}
              <span className="absolute -bottom-1 -right-1 rounded-full bg-driftwood-dark px-1 text-[9px] font-extrabold text-white">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {armed && (
        <div className="absolute inset-x-0 top-24 z-30 flex justify-center">
          <div className="rounded-full bg-coral px-4 py-1.5 text-sm font-bold text-white shadow-candy-coral">
            Tap a tile to use {BOOSTER_INFO[armed].name} · <button onClick={() => setArmed(null)} className="underline">cancel</button>
          </div>
        </div>
      )}

      {/* floating dragged piece */}
      {drag.drag && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: drag.drag.px, top: drag.drag.py - CELL * 1.4, transform: 'translate(-50%,-50%)' }}
        >
          <PieceView shape={drag.drag.shape} cell={CELL * 0.92} />
        </div>
      )}

      {/* floaters */}
      {floaters.map((f) => (
        <div
          key={f.id}
          className="pointer-events-none fixed z-50 animate-floatUp text-2xl font-extrabold text-pearl-gold drop-shadow"
          style={{ left: f.x, top: f.y, transform: 'translate(-50%,-50%)' }}
        >
          <span className={f.kind === 'rescue' ? 'animate-leap text-4xl' : ''}>{f.text}</span>
        </div>
      ))}

      {/* wave surge banner */}
      {surge && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="animate-pop rounded-full bg-gradient-to-r from-seaglass to-seaglass-deep px-6 py-2 font-display text-2xl font-extrabold text-white shadow-candy-teal">
            🌊 WAVE SURGE!
          </div>
        </div>
      )}

      {/* debug overlay */}
      {state.debug && (
        <div className="pointer-events-none absolute left-2 top-20 z-30 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-mono text-seaglass-light">
          <div>budget-fail: {debugLog.budget}</div>
          <div>tide-fail: {debugLog.tide}</div>
          <div>jam: {debugLog.jam}</div>
          <div>offer/accept: {debugLog.offered}/{debugLog.accepted}</div>
          <div>tide={engine.tide} pl={engine.placements}</div>
        </div>
      )}

      {/* first-time tutorial (Shelby) */}
      {showTutorial && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">🐢</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Welcome, friend!</h2>
            <p className="mt-2 text-sm text-driftwood">
              I'm Shelby. <b>Drag wooden pieces</b> onto the board to fill rows or columns — they clear with a splash!
              Clear the line a friend is stuck on to <b>rescue</b> them, all within your <b>{level.budget} placements</b>.
            </p>
            <p className="mt-2 text-sm text-driftwood">Tap the boosters below if you ever get stuck. 🌊</p>
            <CandyButton
              full
              className="mt-4"
              onClick={() => {
                setShowTutorial(false);
                game.setTutorialDone();
              }}
            >
              Let's rescue!
            </CandyButton>
          </div>
        </CenterModal>
      )}

      {/* JAM modal */}
      {engine.jammed && !failInfo && !won && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">🪵</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">No moves fit!</h2>
            <p className="mt-1 text-sm text-driftwood">The driftwood's jammed up. Draw a fresh set of pieces?</p>
            <CandyButton variant="teal" full className="mt-4" onClick={continueFromJam}>
              🔄 Fresh pieces (free)
            </CandyButton>
            <button onClick={giveUp} className="mt-2 w-full py-1 text-sm font-bold text-driftwood">
              Leave level
            </button>
          </div>
        </CenterModal>
      )}

      {/* FAIL / continue modal */}
      {failInfo && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">{failInfo.type === 'tide' ? '🌊' : '🐚'}</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">
              {failInfo.type === 'tide' ? 'The tide rolled in' : 'So close!'}
            </h2>
            <p className="mt-1 text-sm text-driftwood">
              {failInfo.type === 'tide'
                ? 'The tide carried your friends back to the rocks — push it back and try again.'
                : 'One more set could free them. Keep going?'}
            </p>

            {failInfo.comeback && (
              <div className="mt-2 inline-block rounded-full bg-pearl-gold/40 px-3 py-0.5 text-xs font-extrabold text-driftwood-dark">
                💛 Comeback Boost · 30% off
              </div>
            )}

            <CandyButton full className="mt-4" onClick={() => doContinue(3)}>
              {failInfo.type === 'tide' ? '+3 placements & push tide back' : 'Continue · +3 placements'} · 🪙 {failInfo.price}
            </CandyButton>
            <button onClick={giveUp} className="mt-2 w-full py-1 text-sm font-bold text-driftwood">
              Maybe later
            </button>
            <p className="mt-1 text-[11px] text-driftwood/70">You have 🪙 {state.pearls}</p>
          </div>
        </CenterModal>
      )}

      {/* WIN modal */}
      {won && (
        <CenterModal>
          <div className="text-center">
            <div className="mb-1 flex justify-center gap-1">
              {won.rescued.map((id, i) => (
                <span key={i} className="animate-bob text-4xl" style={{ animationDelay: `${i * 0.15}s` }}>
                  {creatureById(id).emoji}
                </span>
              ))}
            </div>
            <h2 className="font-display text-2xl font-extrabold text-seaglass-deep">Rescued!</h2>
            <p className="mt-1 text-sm text-driftwood">
              {won.rescued.map((id) => creatureById(id).name).join(', ') || 'The cove is restored'} — safe and sound. 🌅
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-pearl-gold/40 px-4 py-1.5 font-display font-extrabold text-driftwood-dark">
              🪙 +{won.pearls} pearls
            </div>
            <div className="mt-4 space-y-2">
              {levelId < MAX_LEVEL && state.currentLevelId <= MAX_LEVEL && (
                <CandyButton full onClick={() => navigate({ name: 'boosterSelect', levelId: Math.min(levelId + 1, MAX_LEVEL) })}>
                  Next rescue ▶
                </CandyButton>
              )}
              <CandyButton variant="teal" full onClick={() => navigate({ name: 'home' })}>
                Back to Sanctuary
              </CandyButton>
            </div>
          </div>
        </CenterModal>
      )}
    </div>
  );
}
