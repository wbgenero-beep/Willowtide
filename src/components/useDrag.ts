import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PieceShape } from '../types';
import { SIZE } from '../engine/board';
import { shapeBounds } from '../data/pieces';
import type { Ghost } from './BoardView';

export interface DragState {
  slot: number;
  shape: PieceShape;
  px: number;
  py: number;
}

interface Api {
  canDrop: (shape: PieceShape, row: number, col: number) => boolean;
  onDrop: (slot: number, row: number, col: number) => void;
}

export function useDrag(boardEl: React.RefObject<HTMLDivElement>, api: Api) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const apiRef = useRef(api);
  apiRef.current = api;

  const targetFor = (d: DragState): { row: number; col: number } | null => {
    const el = boardEl.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cell = rect.width / SIZE;
    const lift = cell * 1.4;
    const { rows, cols } = shapeBounds(d.shape.cells);
    const localX = d.px - rect.left;
    const localY = d.py - rect.top - lift;
    const col = Math.round(localX / cell - cols / 2);
    const row = Math.round(localY / cell - rows / 2);
    return { row, col };
  };

  const startDrag = (slot: number, shape: PieceShape, e: React.PointerEvent) => {
    e.preventDefault();
    setDrag({ slot, shape, px: e.clientX, py: e.clientY });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d));
    };
    const up = () => {
      const d = dragRef.current;
      if (d) {
        const t = targetFor(d);
        if (t && apiRef.current.canDrop(d.shape, t.row, t.col)) {
          apiRef.current.onDrop(d.slot, t.row, t.col);
        }
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.slot, drag?.shape.id]);

  const ghost: Ghost | null = useMemo(() => {
    if (!drag) return null;
    const t = targetFor(drag);
    if (!t) return null;
    const cells = drag.shape.cells
      .map(([dr, dc]) => [t.row + dr, t.col + dc] as [number, number])
      .filter(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE);
    const valid = api.canDrop(drag.shape, t.row, t.col);
    return { cells, valid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  return { drag, ghost, startDrag };
}
