# Assumptions

The PRD is intentionally high-level; the following decisions unblock a playable vertical slice.

## Core Loop Shape

- A “match” is implemented as a **single Texas Hold’em hand** (player vs. one deterministic AI dealer).
- The **selection stake** is treated as the match’s in-game risk/reward amount in **Tulip Credits**.

## 7×7 Hex Farm

- The farm is a **7×7 axial (q,r) hex grid** rendered as a parallelogram layout (49 tiles).
- “Connected selection” means each added tile must be adjacent (6-neighbor) to the existing set; removing a tile that would split the set drops disconnected tiles automatically.

## Buff Gradient

- Buffs apply to selected plots and fall off by hex distance within a radius.
- Streaks / daily focus / simulin tiers can increase buff magnitude for wins.

## Meta‑Pots

- Meta-pots fill based on stake, win/loss, streaks, and special triggers.
- When a meta-pot hits its threshold, it pays out that threshold in Tulip Credits and resets by overflow.

## Daily / Season

- A season is **42 real-world days** from `season.startMs`.
- Daily modifiers and the “Mystery Seed” charged tile are derived deterministically from `(seed, dayIndex)`.
- Dev panel shifts time via a day offset for testing.

## Progression

- Upgrades and NPC gifts are simplified but persisted; gifts gate a “contract cap” (max dealer difficulty).

