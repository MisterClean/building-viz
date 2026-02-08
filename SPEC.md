# Building-Viz: Multifamily Lot Visualizer (MVP-First Spec)

## Source Docs
- Original input spec: `docs/source/spec-original.md`
- Feedback memo: `docs/source/feedback01.md` (original DOCX preserved as `docs/source/feedback01.docx`)

## Summary
Build a browser-based 3D visualizer that helps non-technical users understand what kinds of small multifamily housing can fit on a residential lot under zoning constraints. The core output is *persuasive, trustworthy scenarios* (with context + comparison), not a free-form “apartment Tetris” builder.

The app renders:
- A lot (dimensions + street context)
- A buildable envelope derived from zoning (setbacks, height, FAR, lot coverage)
- A baseline single-family massing and selected “missing middle” preset forms
- Parking layouts and their zoning impact (where applicable)
- Real-time stats, violations, and a “binding constraint” explanation
- Side-by-side comparisons (“Current rules” vs “Proposed rules”) with shareable URLs and print-ready exports

This is an advocacy tool first; it must be hard to nitpick and easy to explain.

## Primary Goal
Enable residents, advocates, and decision-makers to quickly see: “Under these rules, *this* is what fits on a typical lot, and it looks like this in context.”

## Non-Goals (For MVP)
- Detailed architectural design (unit plans, facades, code compliance)
- Parcel/GIS integration (Cook County / municipal datasets)
- Full zoning/building code implementation (eg, egress, light/air, fire separation)
- Detailed turning-path simulation for vehicles (a simplified visual is OK)

## Personas
1. Advocates/Organizers: create visuals for meetings and public comment.
2. Curious residents: explore “what could go here?”
3. Alderpersons/commissioners: understand physical implications of code changes.
4. Developers (secondary): rough massing studies (not a replacement for architects).

## Core Flows
### Flow A: Guided Scenario (First-Run Friendly)
Goal: 30–90 seconds from landing page to a persuasive comparison image.
1. Choose a lot preset (or enter custom dimensions).
2. Choose a housing type preset (2-flat / 3-flat / 4-flat / townhomes / cottage court / ADU).
3. Choose “Current” vs “Proposed” (or enable Compare Mode).
4. View street-level context + stats + callouts.
5. Export: shareable link and print sheet.

### Flow B: Explore and Iterate
1. Toggle context elements (neighbors, trees, sidewalk, parking).
2. Adjust rule toggles (parking minimums on/off, coverage debit, etc.).
3. Switch camera presets (street / front elevation / aerial).
4. Compare scenarios side-by-side.

## MVP Scope (What We Implement First)
### MVP = Scenario Player + Comparer
No free-form drag-and-drop unit placement in MVP.

Required in MVP:
- Lot inputs:
  - Presets: “Typical 50x150”, “Typical 37.5’”, “Corner lot”
  - Custom lot width/depth
  - Setback inputs (front/side/rear, plus street-side for corner lots)
- Zoning envelope:
  - Derived buildable volume rendered as translucent wireframe
  - Constraints: height, FAR, lot coverage, setbacks
  - Optional advanced toggles (UI can hide under “Advanced”):
    - Minimum lot width and minimum lot area checks
- Preset forms:
  - 6–10 one-click building presets (massing only), including:
    - Baseline: “Max Single-Family (baseline)”
    - “Classic 2-flat”
    - “Missing middle triplex”
    - “4-flat”
    - “3-story 6-flat (small apartment)”
    - “Townhouse row”
    - “ADU / coach house” (if included, treat as separate accessory mass)
    - “Mixed-use: retail + residential above” (optional; can be V2 if needed)
- Context mode:
  - Simple street scene: ground plane, sidewalk/parkway, neighboring SFH massing boxes
  - Street trees (simple cylinders/cones) optional toggle
  - Three fixed camera presets:
    - Street view (eye-level, perspective)
    - Front elevation (orthographic)
    - Aerial (orthographic or high-FOV perspective)
- Comparison mode:
  - Side-by-side A/B (“Current zoning allows” vs “Proposed allows”)
  - Identical camera preset selection for both sides to avoid “angle cheating”
  - Delta stats: +units, +/-FAR used, +/-coverage, +/-parking
- Parking (politically critical):
  - Surface parking layout visualization (stall rectangles + aisle)
  - Parking stats: required vs provided, ratio (spaces/unit)
  - Optional “parking consumes zoning capacity” toggle:
    - A configurable “coverage debit per required space” value (default off unless a ruleset enables it)
- Real-time stats panel:
  - Units, stories, building height
  - Total gross floor area (GFA)
  - FAR used / remaining
  - Lot coverage used / remaining
  - Parking: spaces required/provided, ratio
  - Density estimate (units/acre) (derived)
  - “Binding constraint” callout:
    - If in compliance: which constraint is closest to binding
    - If violating: primary violation (“Height exceeds max”, “Outside envelope”, etc.)
- Sharing and exports:
  - Shareable URL encoding full app state
  - Screenshot export (canvas snapshot)
  - Print sheet export:
    - A print-friendly layout containing:
      - Street view image
      - Front elevation image
      - Key stats + violations
      - Parking diagram
      - Sources/disclaimer block

### V2 (Next)
- Evanston zoning district presets with real numbers and embedded sources
- “What-if” toggles (parking minimum removed, FAR increased, etc.)
- More realistic context scene (street width, setbacks of neighbors, etc.)
- Optional free-form builder (drag/drop modules) if needed

### V3 (Future)
- Rough feasibility/cost overlays
- “How many people could live here” estimate overlay
- Parcel/GIS integration (subject to licensing constraints)
- Embeddable widget

## Data Model
### Lot
- `widthFt: number`
- `depthFt: number`
- `isCorner: boolean`
- `setbacksFt`:
  - `front: number`
  - `rear: number`
  - `sideLeft: number`
  - `sideRight: number`
  - `streetSide?: number` (corner lots)

Derived:
- `areaSqFt = widthFt * depthFt`
- `areaAcres = areaSqFt / 43560`

### Ruleset (Zoning Constraints)
Minimum supported constraints:
- Setbacks (from lot config)
- `maxHeightFt: number` (and optional `maxStories`)
- `maxLotCoveragePct: number` (0–1)
- `maxFAR: number`

Advanced (toggleable, optional):
- `minLotWidthFt?: number`
- `minLotAreaSqFt?: number`
- `parkingMinSpacesPerUnit?: number` (or per bedroom in the future)
- `parkingCoverageDebitSqFtPerRequiredSpace?: number` (optional rule; defaults to 0 unless enabled)

Metadata (trust hooks):
- `id`, `name`
- `versionLabel` (eg “Current”, “Draft”, “Proposal A”)
- `sources[]`: `{ title, url, lastUpdated }`
- `notes` (disclaimers)

### Preset Form
Massing-first model (MVP):
- `id`, `name`, `description`
- `units: number`
- `stories: number`
- `floorToFloorFt` (default 10)
- `footprint`:
  - Either fixed `{ widthFt, depthFt }`
  - Or “fit strategy” that scales/clamps to available envelope width/depth
- `kind`: `baseline_sfh | stacked_flats | townhouse | courtyard | adu | mixed_use`

Optional components (V2+):
- Core (stairs/elevator)
- Corridor type (single-loaded/double-loaded)
- Retail plinth

### Parking
MVP:
- `providedSpaces: number`
- Geometry assumptions (configurable constants):
  - stall: 9x18 ft
  - aisle: 24 ft
- Layout algorithm:
  - Pack stalls in rows behind building within remaining yard area
  - If not enough depth/width, show violation (“Parking doesn’t fit”)

## Derived Calculations
### Envelope
Compute buildable rectangle in plan:
- `envelopeX0 = sideLeft`
- `envelopeX1 = widthFt - sideRight`
- `envelopeZ0 = front`
- `envelopeZ1 = depthFt - rear`
- If `isCorner`, enforce `streetSide` on the street-side boundary (implementation detail: choose sideRight as street-side for MVP with a toggle/selector in V2).

Height:
- `envelopeMaxY = maxHeightFt`

### Building Metrics
Given a chosen preset form:
- `footprintAreaSqFt = footprintWidth * footprintDepth`
- `gfaSqFt = footprintAreaSqFt * stories`
- `heightFt = stories * floorToFloorFt`
- `farUsed = gfaSqFt / lotAreaSqFt`
- `coverageUsed = footprintAreaSqFt / lotAreaSqFt`

Parking:
- `requiredSpaces = ceil(units * parkingMinSpacesPerUnit)` (MVP)
- `coverageDebitSqFt = requiredSpaces * parkingCoverageDebitSqFtPerRequiredSpace` (optional)
- `effectiveCoverageSqFt = footprintAreaSqFt + coverageDebitSqFt`
- `effectiveCoverageUsed = effectiveCoverageSqFt / lotAreaSqFt`

### Compliance and Violations
Violations to detect:
- Outside envelope footprint (setbacks)
- Height exceeds max
- FAR exceeds max
- Lot coverage exceeds max (and effective coverage if debit enabled)
- Min lot width/area (advanced)
- Parking doesn’t physically fit (if parking visualization enabled)

### Binding Constraint
When compliant:
- Compute the highest “percent used” among FAR, coverage, height, and envelope fit margin.
When violating:
- Identify the primary violation(s) in priority order:
  1. Outside envelope
  2. Height
  3. FAR
  4. Coverage
  5. Parking fit
  6. Min lot width/area

## UI Requirements
### Layout
- Left: controls + stats
- Right: 3D viewport(s)
- Mobile: controls collapse into drawer; viewport remains primary

### Controls (MVP)
- Mode: Single | Compare
- Lot preset and custom inputs
- Ruleset picker (start with “Sample ruleset” + placeholders; add real Evanston presets in V2)
- Housing preset picker
- Parking:
  - Provided spaces
  - Toggle show/hide parking geometry
  - Toggle “coverage debit” (if ruleset supports)
- Context toggles:
  - Neighbors on/off
  - Trees on/off
- Camera preset buttons
- Export buttons:
  - Share link
  - Screenshot
  - Print sheet
- Sources drawer (can show “No sources yet” for sample ruleset, but must exist)

### 3D Viewport
Must render:
- Ground + lot outline
- Envelope wireframe
- Baseline SFH (when selected) and/or selected preset mass
- Neighbor massing boxes (toggle)
- Parking rectangles (toggle)
- Visual violation highlighting (red tint + labels in UI)

## Sharing / Persistence
### URL State
Encode full app state in the URL (query param `s=`), so scenarios can be shared as a single link.
Requirements:
- Back/forward compatible (update history on major changes; replaceState for minor)
- Round-trip safe (decode -> state -> encode should be stable)
- Versioned payload (include `v: number` in state to support migrations)

## Testing Requirements
Minimum automated tests for MVP:
- Pure domain:
  - Envelope calculations
  - Metrics (GFA/FAR/coverage/height)
  - Violations detection
  - URL encode/decode round-trip
- UI:
  - Selecting a preset updates stats
  - Compare mode renders two panels and delta stats

## Technical Stack
- React + TypeScript + Vite
- 3D: React Three Fiber + Three.js (+ Drei helpers)
- State: Zustand
- Styling: Tailwind
- Tests: Vitest + React Testing Library (jsdom)
- Optional later: Playwright e2e

## Quality / Trust Requirements
- Clear disclaimer: “Conceptual visualization; not legal advice.”
- Sources shown for any real ruleset (title + URL + last updated date).
- Rulesets must be versioned (“Current”, “Draft”, “Proposal A”).
- Avoid uncanny or easily ridiculed geometry:
  - MVP massing should look like believable building shells, not unit-shaped blocks.

## Data/Licensing Note (Future)
Before shipping parcel/GIS integration, document data sources and redistribution rights. Prefer open data sources or live queries where licensing restricts republishing.
