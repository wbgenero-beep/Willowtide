import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../state/GameState';
import { useNav } from '../state/Nav';
import { anyPlaceable, canPlace, cloneBoard, emptyBoard, placeShape, resolveClears, SIZE } from '../engine/board';
import { makeTray, poolForLevel } from '../engine/tray';
import { BoardView, CELL } from '../components/BoardView';
import { PieceView } from '../components/PieceView';
import { useDrag } from '../components/useDrag';
import { CandyButton, CenterModal, ScreenHeader } from '../components/ui';
import type { Cell, TrayPiece } from '../types';

const MODE_INFO = {
  drift: { name: 'Drift', emoji: '🌊', timed: false },
  tidal: { name: 'Tidal', emoji: '⏱️', timed: true },
  zen: { name: 'Zen', emoji: '🍵', timed: false },
};

export function FreePlayGame({ mode }: { mode: 'drift' | 'tidal' | 'zen' }) {
  const { state, setFreePlayHigh } = useGame();
  const { navigate, back } = useNav();
  const pool = useMemo(() => poolForLevel(mode === 'zen' ? 1 : 99), [mode]);

  const [board, setBoard] = useState<Cell[][]>(() => emptyBoard());
  const [tray, setTray] = useState<(TrayPiece | null)[]>(() => makeTray(pool));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [over, setOver] = useState(false);
  const [jam, setJam] = useState(false);
  const [revives, setRevives] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const boardModel = useRef(board);
  boardModel.current = board;
  const trayModel = useRef(tray);
  trayModel.current = tray;

  // timer for tidal
  useEffect(() => {
    if (mode !== 'tidal' || over) return;
    const t = setInterval(() => {
      setTime((x) => {
        if (x <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, over]);

  const finish = () => {
    setOver(true);
    setFreePlayHigh(mode, Math.max(score, scoreRef.current));
  };
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const refill = (t: (TrayPiece | null)[]): (TrayPiece | null)[] => (t.every((x) => x === null) ? makeTray(pool) : t);

  const drop = (slot: number, r: number, c: number) => {
    const piece = trayModel.current[slot];
    if (!piece) return;
    let b = placeShape(boardModel.current, piece.shape, r, c);
    const next = trayModel.current.slice();
    next[slot] = null;
    const clear = resolveClears(b);
    b = clear.board;
    const gained = clear.linesCleared > 0 ? clear.linesCleared * 10 + (clear.linesCleared >= 2 ? clear.linesCleared * 10 : 0) : piece.shape.cells.length;
    const filled = refill(next);
    setBoard(b);
    setTray(filled);
    setScore((s) => s + gained);

    if (mode !== 'tidal') {
      const shapes = filled.filter(Boolean).map((t) => t!.shape);
      if (!anyPlaceable(b, shapes)) setJam(true);
    }
  };

  const drag = useDrag(boardRef, {
    canDrop: (shape, r, c) => !over && !jam && canPlace(boardModel.current, shape, r, c),
    onDrop: drop,
  });

  const revive = () => {
    // clear the bottom 3 rows to open space, refresh tray
    const b = cloneBoard(boardModel.current);
    for (let r = SIZE - 3; r < SIZE; r++) for (let c = 0; c < SIZE; c++) b[r][c] = { filled: false };
    setBoard(b);
    setTray(makeTray(pool));
    setRevives((x) => x + 1);
    setJam(false);
  };

  const high = state.freePlayHigh[mode];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-seaglass-light/40 to-sand">
      <ScreenHeader title={`${MODE_INFO[mode].emoji} ${MODE_INFO[mode].name}`} onBack={back} />

      <div className="flex items-center justify-around px-4 pb-1">
        <Stat label="SCORE" value={score} />
        {mode === 'tidal' ? <Stat label="TIME" value={`${time}s`} accent /> : <Stat label="BEST" value={high} />}
        {mode !== 'tidal' && <Stat label="REVIVES" value={revives} />}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <BoardView ref={boardRef} board={board} ghost={drag.ghost} />
      </div>

      <div className="flex items-end justify-around px-3 py-3" style={{ minHeight: 84 }}>
        {tray.map((piece, slot) => (
          <div key={slot} className="flex h-[72px] flex-1 items-center justify-center">
            {piece && drag.drag?.slot !== slot && (
              <div onPointerDown={(e) => drag.startDrag(slot, piece.shape, e)} className="cursor-grab touch-none active:cursor-grabbing">
                <PieceView shape={piece.shape} cell={20} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-3">
        <CandyButton variant="gold" full onClick={finish}>
          End game
        </CandyButton>
      </div>

      {/* floating dragged piece */}
      {drag.drag && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: drag.drag.px, top: drag.drag.py - CELL * 1.4, transform: 'translate(-50%,-50%)' }}
        >
          <PieceView shape={drag.drag.shape} cell={CELL * 0.92} />
        </div>
      )}

      {jam && !over && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">🪵</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Stuck!</h2>
            <p className="mt-1 text-sm text-driftwood">No moves fit. Revive to clear some space and keep your run going.</p>
            <CandyButton variant="teal" full className="mt-4" onClick={revive}>
              🌊 Revive (free)
            </CandyButton>
            <button onClick={finish} className="mt-2 w-full py-1 text-sm font-bold text-driftwood">
              End run
            </button>
          </div>
        </CenterModal>
      )}

      {over && (
        <CenterModal>
          <div className="text-center">
            <div className="text-5xl">🏁</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-driftwood-dark">Run complete</h2>
            <p className="mt-1 text-sm text-driftwood">
              Score <span className="font-extrabold text-seaglass-deep">{score}</span>
              {score >= high && score > 0 ? ' · new best! 🎉' : ` · best ${high}`}
            </p>
            <div className="mt-4 space-y-2">
              <CandyButton
                full
                onClick={() => {
                  setBoard(emptyBoard());
                  setTray(makeTray(pool));
                  setScore(0);
                  setTime(60);
                  setOver(false);
                  setJam(false);
                  setRevives(0);
                }}
              >
                Play again
              </CandyButton>
              <CandyButton variant="teal" full onClick={() => navigate({ name: 'play' })}>
                Back to modes
              </CandyButton>
            </div>
          </div>
        </CenterModal>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display text-xl font-extrabold ${accent ? 'text-coral-dark' : 'text-driftwood-dark'}`}>{value}</span>
      <span className="text-[10px] font-bold text-driftwood">{label}</span>
    </div>
  );
}
