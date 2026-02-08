# Multifamily Visualizer: Original Input Spec (Source)

Date captured: 2026-02-08

This file preserves the raw spec text that was provided as input for consolidation into `/Users/mmclean/dev/website/building-viz/SPEC.md`.

## Core Concept
A browser-based 3D visualizer that lets users define a residential lot, apply zoning constraints, and then build out multi-unit housing forms within those constraints, seeing in real-time what actually fits, what it looks like, and how it compares to existing SFH context.

## Key User Personas
1. Advocates/Organizers: preparing visuals for public meetings, showing “this is what a 4-flat actually looks like on your block”
1. Curious residents: “what could go on the empty lot near me?”
1. Alderpersons/commissioners: need to quickly grasp the physical implications of zoning code changes
1. Developers (secondary): rough massing studies before hiring an architect

## Data Model
### Lot Configuration
- Lot width, depth (feet)
- Front/side/rear setbacks (editable, with Evanston defaults per zoning district)
- Max lot coverage %
- Max building height (feet or stories)
- FAR limit

### Building Envelope
The 3D “box” you’re allowed to build in, derived from the above. This should render as a translucent wireframe so users can see the constraint volume.

### Unit Types (draggable building blocks)
- Studio (~350-450 sf)
- 1BR (~550-700 sf)
- 2BR (~800-1000 sf)
- 3BR (~1100-1400 sf)
- Each has a footprint (width × depth) and a height (1 story)
- Could have variants: “wide/shallow” vs “narrow/deep”

### Building Components (non-unit space)
- Stairs/elevator core
- Common hallway
- Ground-floor retail (optional)
- Parking (surface, tuck-under, structured)
  - Making parking tradeoffs visible is key
- Shared amenity space

### Preset Forms (one-click templates)
- “Classic Chicago 2-flat”
- “3-story 6-flat”
- “Courtyard building”
- “Small lot cottage cluster”
- “Mixed-use: retail + residential above”
- “Missing middle triplex”
- “Townhouse row”

## Key Views / Interactions
### Build Mode
- 3D perspective view with orbit/pan/zoom (Three.js or similar)
- Translucent envelope overlay showing max buildable volume
- Drag unit types from a sidebar palette into the envelope; they snap to grid
- Units stack vertically (floors) and tile horizontally
- Real-time stats panel:
  - total units
  - total sf
  - FAR used/remaining
  - lot coverage %
  - parking ratio
  - estimated density (units/acre)
- Violations highlighted in red (exceeds height, FAR, setback, etc.)

### Context Mode
- Drop the building onto a street scene with neighboring SFH for scale comparison
- Even a simple version of this (extruded boxes representing adjacent houses at typical Evanston scale, 30’ wide, 2 stories) would be compelling
- Optional: street trees, sidewalk, parkway strip to make it feel real

### Comparison Mode
- Side-by-side: “Current zoning allows THIS → Proposed zoning allows THIS”
- Show the delta: +X units, same height, same setbacks

### Export/Share
- Screenshot / shareable URL with encoded state
- “Share this scenario” for embedding in presentations or public comment

## Technical Stack Thoughts
| Layer | Option |
| --- | --- |
| 3D rendering | Three.js or React Three Fiber (R3F) |
| UI framework | React + Tailwind |
| State management | Zustand (lightweight, good with R3F) |
| Drag and drop | dnd-kit or custom raycasting in Three.js |
| Persistence | URL-encoded state for sharing; optional DB later |
| Deployment | Vercel or Netlify |

R3F is probably the sweet spot, it keeps everything in React-land so the sidebar controls and the 3D viewport share state naturally.

## Evanston-Specific Features
- Zoning district presets: R1, R2, R3, R4, R5, R6, B1, etc. with real setbacks/FAR/height pulled from the current code
- “What if” mode: toggle between current zoning and a proposed change to see the difference
- Lot size presets:
  - “Typical 50×150 Evanston lot”
  - “Typical 37.5’ lot”
  - “Corner lot”
- Parking toggle: show how much buildable space parking consumes

## MVP vs. Full Vision
### MVP (buildable in weeks)
- Fixed lot input (dimensions + setbacks)
- Envelope visualization
- Preset building forms only (no free drag-and-drop yet)
- Stats panel (units, FAR, height)
- Side-by-side with a generic SFH for scale
- Shareable URL

### V2
- Drag-and-drop unit placement
- Evanston zoning district presets with real numbers
- Context street scene
- Comparison mode (current vs. proposed)

### V3
- Rough cost/feasibility estimates
- “How many people could live here” overlay
- Integration with actual Evanston parcel data (Cook County GIS)
- Embeddable widget for advocacy sites

## Strategic Thought
The most powerful thing this tool can do politically isn’t the free-form builder, it’s the presets + context view.

Most opponents of rezoning are operating on vibes and fear. If you can show someone: “Here’s your block. Here’s a 3-flat. It’s the same height as your house. It fits within the same setbacks. Six families live there instead of one.” that’s the moment that moves votes.

Prioritize the comparison/context mode over the drag-and-drop builder for the Evanston fight specifically.

