# 🌊 Willowtide — Playable Design Demo

A cozy coastal **animal-rescue block puzzle**. Place wooden polyomino pieces to
clear lines, rescue stranded sea creatures, and restore a living sanctuary.
Warm, calm, and satisfying — nonviolent (animals never die, they "slip away" and
you try again).

This is a **design demo**, not a production build. Art is intentionally
placeholder (emoji + simple shapes). The point is to *play the whole experience
end to end*: the real core loop, the continue/fail and booster systems, and a
fully navigable meta.

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173). On desktop it renders
inside a phone frame (~390×844). It's built for **mobile portrait** and works
with mouse or touch. All progress is saved to `localStorage`.

```bash
npm run build   # type-check + production build
npm run preview # preview the production build
```

## How to play

- **Drag** a wooden piece from the 3-slot tray onto the **8×8 board**. A ghost
  preview snaps to the grid and shows valid (teal) / invalid (coral) placement.
  A piece floats above your finger as you drag.
- Fill a complete **row or column** to clear it (with particles + a little
  screen shake). Clear **2+ lines at once** to trigger a **Wave Surge** 🌊.
- Every Story level has a **Placement Budget** (e.g. "rescue 3 in 22
  placements") shown top-right — it's the calm, self-paced fail resource.
- **Rescue** a friend by clearing the row/column they sit on. Other level types:
  **Clean-up** (clear debris), **Restore** (collect shells), and **Storm** (a
  rescue with a **rising tide** — clearing lines pushes it back; if it reaches a
  friend, they slip away).
- **Fail** (budget hits zero, or the tide reaches a friend) shows a gentle
  **continue offer** for pearls. The 3rd consecutive fail on a level becomes a
  discounted **Comeback Boost**. Winning resets the streak.
- A **board-jam** (no piece fits) offers a free **Tray Refresh** — never a dead
  end.

## What's implemented

- **Core loop:** drag → clear → rescue → budget/continue → win → Sanctuary
  restore, genuinely playable from Level 1.
- **~27 Story levels** across 4 areas (Cove of Beginnings is the fully-built
  first area), mixing the four level types at ~70–75% calm / ~25% Storm, with
  gradual obstacle intros (Crates → Driftwood → Locked Tangles).
- **Boosters** that actually work:
  - In-level: Pebble Hammer 🔨, Wave Bomb 💥, Tide Surge 🌊, Tray Refresh 🔄,
    Calm Wave 🫧 (Storm only).
  - Pre-level **head-start** selection (pre-cleared row, wild block, pre-broken
    crate) — pick up to 3.
  - **Shelby's Gift** earned reward box (fills as you complete levels).
- **Full meta**, all reachable from the bottom nav **Ranks · Shores · Home ·
  Album · Play**:
  - **Home** — diegetic Sanctuary scene with Otto, residents, and tappable
    objects (Pearl Jar, Daily, Tide Pass, Album, Ranks, Friends).
  - **Shores** — area overview (completed / current / locked), shares the
    "current area" source of truth with Home.
  - **Album** — named individuals with personalities, organized by area with
    rarity tiers; rescued friends become residents on Home.
  - **Ranks** — Global / National / Friends leaderboards, locally bot-seeded.
  - **Play (Free Play)** — Drift (endless), Tidal (60s), Zen (no tide), with
    revive-on-stuck and high scores.
  - **Daily reward, Lives** (5 max, +1 / 30 min, gates Story, routes to Free
    Play when empty), **Pearl Jar** (cracks for a simulated $4.99), **Tide
    Pass** (free + premium lanes), **Shop**, **Friends** (invite code + gifting
    only).
- **Economy:** pearls (internal `coins`-style currency), pre-seeded with a
  comfortable balance so every system is explorable. "Buy" buttons simulate
  purchases — no real IAP.

## Instrumentation

A **debug overlay** can be toggled from the ⚙️ settings on the top bar. During a
level it shows live counts of **budget-fail / tide-fail / jam** and
**offers/accepts**, and the same data is `console.log`'d so you can watch the
fail-type distribution while you play. Settings also has debug helpers (+pearls,
+life) and a full progress reset.

## Project structure

```
src/
  data/        levels, pieces, creatures/areas, leaderboard bots (config)
  engine/      board.ts (pure board logic), tray.ts, useLevelEngine.ts (game hook)
  lib/         storage.ts (localStorage wrapper), constants.ts (economy tuning)
  state/       GameState.tsx (persisted meta), Nav.tsx (routing)
  components/  PhoneFrame, TopBar, BottomNav, BoardView, PieceView, useDrag, ui
  screens/     Home, Shores, Album, Ranks, Play, BoosterSelect, Level,
               FreePlayGame, Shop, Daily, TidePass, Friends, PearlJar
```

## Notes & scope

- No backend, no real IAP, no real/illustrated art, no analytics — a
  self-contained runnable web demo, as intended.
- Mid-level board/tray is intentionally **not** persisted (no mid-level resume);
  all meta progress (level, areas, pearls, lives + regen timestamp, Album,
  boosters, Shelby's Gift, fail streak, daily) survives a reload.

Stack: **React + TypeScript + Vite + Tailwind CSS.**
