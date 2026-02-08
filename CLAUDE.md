# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A browser-based 3D visualizer for showing what small multifamily housing can fit on a residential lot under zoning-like constraints. It's an advocacy tool: the goal is persuasive, trustworthy comparisons (not an architectural design tool). The consolidated spec lives in `SPEC.md`.

## Commands

```bash
npm run dev          # Vite dev server at http://127.0.0.1:5173
npm run build        # typecheck (tsc -b) + production build
npm run lint         # eslint
npm run typecheck    # tsc -b only
npm test             # vitest (CI mode, runs once)
npm run test:watch   # vitest watch mode
npm run coverage     # vitest with coverage
npm start            # production server (serves dist/ on port 3000, for Railway)
```

CI runs lint, test, then build (see `.github/workflows/ci.yml`).

## Architecture

### Layer Separation

The app has a strict layered architecture:

- **`src/domain/`** — Pure calculation logic, no React, no side effects. All zoning math lives here. This is the most important layer to keep correct and well-tested.
- **`src/app/`** — Zustand store (`store.ts`) and URL persistence (`persist.ts`). State is serialized to the URL query param `s=` via lz-string compression + Zod validation.
- **`src/view/`** — React Three Fiber 3D rendering. `Viewport3D.tsx` is the main scene component.
- **`src/print/`** — Print sheet route, a separate React tree rendered when `?print=1` is in the URL.

### Key Data Flow

1. **Presets** (`domain/presets.ts`): Lot presets, rulesets (zoning constraints), and building preset forms are all static arrays looked up by ID.
2. **Evaluation** (`domain/evaluate.ts`): `evaluateScenario()` is the core function. It takes a lot + ruleset + preset + parking config and returns an `Evaluation` containing: envelope, placement, metrics, parking layout, violations, and binding constraint info.
3. **Store** (`app/store.ts`): Zustand store holds two scenario configs (A and B) for compare mode. Initial state is read from the URL on load.
4. **URL State** (`app/persist.ts`): Full app state round-trips through the URL. Encoded with `lz-string`, validated with Zod schemas. The `PersistedStateV1` type is the canonical shape.
5. **Rendering**: `App.tsx` reads store state, calls `evaluateScenario()` for each scenario, and passes `Evaluation` objects to `Viewport3D`.

### Routing

There's no router library. `main.tsx` checks `?print=1` and renders either `<App />` (editor) or `<PrintApp />` (print sheet). The print sheet reads state from the URL's `s=` param.

### Domain Module Breakdown

- `types.ts` — Core types: `Lot`, `Ruleset`, `PresetForm`, `ParkingConfig`, `Scenario`
- `envelope.ts` — Computes the buildable envelope (setback-derived rectangle + max height)
- `geometry.ts` — Simple `Rect` helpers (width, depth, area, center)
- `placement.ts` — Places a preset building form within the envelope (front-aligned, centered)
- `metrics.ts` — Computes `BuildingMetrics`: GFA, FAR, coverage, parking requirements
- `parking.ts` — Lays out surface parking stalls in the rear yard
- `evaluate.ts` — Orchestrates all the above, runs violation checks, computes binding constraint

### 3D Scene

Uses React Three Fiber (not Drei, to keep bundle small). The `Viewport3D` component renders: ground plane, street, sidewalk, lot outline, envelope wireframe, building mass, parking stalls, neighbor houses, and trees. Camera presets (street/front/aerial) are set imperatively via `useEffect` + `OrbitControls`.

### Production Server

`server.mjs` is a zero-dependency Node HTTP server that serves `dist/` with SPA fallback. Used for Railway deployment. Cache-busts `index.html`, aggressively caches hashed assets.

## Testing

Tests use Vitest + jsdom. Domain tests are in `src/domain/*.test.ts`, persistence tests in `src/app/persist.test.ts`, and component tests in `src/*.test.tsx`.

WebGL is not available in jsdom, so 3D viewport tests get a fallback message. UI component tests that touch `App.tsx` will see the fallback text instead of a canvas.

Run a single test file: `npx vitest run src/domain/evaluate.test.ts`

## Conventions

- Tailwind for styling; custom color `text-ink` is `#0b1220` (set in `index.css` on `body`).
- Scenario A/B pattern: the store holds `scenarioA` and `scenarioB`; setters take `'A' | 'B'` as the first argument.
- Lot dimensions are always used in `A` and `B` simultaneously (changing lot width updates both scenarios).
- All domain functions are pure — they take explicit arguments and return values. No global state access.
- The `Evaluation` type is the bridge between domain logic and rendering — both `Viewport3D` and `PrintApp` consume it.
