# Farming in Purria (Vertical Slice)

Playable web prototype that demonstrates the core loop:

1) Select up to **N connected** hex plots on a 7×7 farm.
2) Start a **Texas Hold’em** match (deterministic AI dealer).
3) Win/loss feeds back into **plot buffs**, **meta-pots**, **streaks**, and **progression**.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm run test
```

## Run The Game

- Click connected hexes to build a selection (selection limit is upgradeable).
- Click **Start Hold’em**.
- Play with **Call/Check**, **Fold**, **All‑in**.
- Click **Apply Buffs & Return** to see aura + floating “buff applied” text on the farm.
- Watch **Meta‑Pots** fill/trigger and drop a credit cascade when they hit.
- Click **Upgrades** to purchase:
  - Operations upgrades (selection limit, buff radius)
  - Simulin tier upgrades (buff strength)
  - NPC gifts (unlocks higher contract caps)
- Use the **Dev** panel (bottom-left) to fast‑forward days or end the season.

## Hold’em Engine Integration (Do Not Rewrite)

This project vendors the existing Hold’em logic as a standalone module under:

- `src/services/poker/engine.ts` – `PokerEngine` state machine
- `src/services/poker/evaluator.ts` – hand evaluation (`findBestHand`, `compareHands`)
- `src/services/poker/ai/dealer.ts` – deterministic AI dealer (`createAIDealer`)

The original upstream location in this workspace is:

- `D:\SWE\cc\fipcc002\src\services\poker\engine.ts`

The vertical slice wraps the engine in `src/poker/PokerModal.tsx` and connects outcomes back into the farm via `src/game/logic/buffs.ts` and `src/game/logic/rewards.ts`.

## Persistence

- Saves to `localStorage` with a versioned schema in `src/game/save/schema.ts`.

## Notes

- No real-money gambling framing; all stakes and payouts are **in-game Tulip Credits**.
- Desktop-first UI, responsive down to ~1024px wide.

