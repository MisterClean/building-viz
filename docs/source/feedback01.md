I read the gist spec. It’s already pointed in a good direction: lot →
zoning envelope → preset building forms → “context mode” → shareable
outputs. That’s exactly the mental pathway you need for a public fight.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))

Where I’d push it is: make it *more persuasive, more trustworthy, and
harder to nitpick*, while keeping the MVP dead simple.

**1) Reframe the “core interaction” around persuasion, not building**

Right now the spec’s center of gravity is a “builder” (“drag unit types…
snap to grid… units stack vertically”).
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
That’s cool, but in a rezoning battle the killer feature is: **“Show me
3 believable examples that comply with the rules and look normal.”**

**Add a “Guided Story Mode” as first-class (even in MVP)**

Instead of dropping users into a blank 3D editor, give them a 30–90
second guided path:

1.  Pick your lot (or pick “Typical Evanston lot”)

2.  Pick a housing type (2-flat / 3-flat / 4-flat / cottage court /
    ADU+house)

3.  Pick “Current rules” vs “Proposed rules”

4.  Show the same camera angle with an A/B slider + callouts: height,
    setbacks, trees, parking

This aligns with your own “strategic thought” section—presets +
context + comparison are the political lever.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))

**Why it matters:** a free-form builder invites argument about corner
cases. A guided story mode forces the conversation onto *outcomes*
(“same height, more homes”).

**2) Expand the zoning model beyond “a box” (but keep it
understandable)**

Your data model lists width/depth, setbacks, lot coverage %, height,
FAR.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
That’s a good start, but opponents will immediately jump to the
“gotchas” that aren’t represented.

**Add these constraints (at least as toggles / “advanced”)**

Even in Evanston’s own district summary for R1–R3, you can see several
constraints that will matter for what “fits” and for credibility:

- **Minimum lot size & minimum lot width** (e.g., R1–R3 minimum width
  shown as 35 ft)

- **Yard requirements with parking prohibitions** (e.g., front yard and
  street side yard parking prohibited in the R1–R3 summary)

- **Impervious surface coverage** (it’s explicitly tracked in the
  summary, with pervious paving discounts)

- **Accessory structure rules** (setbacks and distance from principal
  structure; this matters for coach houses/ADUs)

If your tool ignores these, someone can say “nice animation, but that’s
not legal here,” and you’re suddenly debating technicalities.

**UX trick: “Binding constraint” callout**

Add a panel that says:

- “What stops this building from being bigger?”  
  Example output: “Rear yard setback is binding” or “Parking requirement
  is binding.”

That’s a persuasion weapon because it turns abstract code into a single
sentence.

**3) Make parking *physically real* and code-real**

You already flag parking as politically huge.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
Lean into that harder, but do it in a way that’s indisputable.

**Add two parking layers:**

**A) Geometry layer (visual truth):**

- Draw actual stall rectangles + drive aisle

- Show turning path (even simplified)

- Show “this is how much ground it eats”

**B) Code accounting layer (why it’s binding):**  
There’s an Evanston ordinance change where **building lot coverage
includes 200 sq ft per required parking space when the required space is
provided outside a building**.  
That’s exactly the kind of “wait, parking consumes *zoning capacity*?”
revelation that changes minds.

So your “parking toggle” shouldn’t just add/remove spaces; it should
show:

- spaces required vs provided

- lot coverage consumed by parking per the code rule above

- what you *gain back* if parking minimums are reduced

**Include the ADU parking fact explicitly**

The R1–R3 summary states: **“An ADU does not require an off-street
parking space.”**  
Even if your main fight is multifamily, ADUs are often the “least scary”
on-ramp. Let the tool demonstrate that an extra home can appear
*without* a new curb cut / parking pad.

**4) Context mode needs “street-level camera” and “normal house
baseline”**

Your context mode currently suggests extruded neighbor boxes and
optional trees/sidewalk.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
That’s directionally right, but here’s the upgrade:

**Ship 3 fixed camera presets (no free-orbit required)**

Most non-technical residents struggle with orbit/pan/zoom. Give them:

- **Street view (5–6 ft eye height from sidewalk)**

- **Front elevation (orthographic)**

- **Aerial (simple)**

And make the comparison mode use *identical camera + FOV* to prevent
“you cheated with the angle” accusations.

**Baseline: show what SFH zoning already allows**

If you want to convince SFH neighborhoods, show:

- A “maxed-out single-family house” under the same envelope

- Next to a 2/3/4-flat that is the *same height and setbacks*

The R1–R3 summary includes a **35 ft / 2½ story max height** that many
people already accept as “normal house scale.”  
So bake in a “typical/maximum house massing” button.

**5) Add “trust hooks”: sources, versioning, and receipts**

This tool will be attacked on legitimacy. You need the interface to
calmly win that fight.

**Put zoning sources inside the UI**

For every preset district / rule set, add a “Sources” drawer with:

- document name

- last updated date

- link

Evanston’s own district handout is dated/updated (example: “Updated
November 2023” on the R1–R3 PDF).  
Surfacing that inside the tool buys credibility.

**Support “rule versions” (current vs draft vs proposed)**

Evanston has publicly discussed a draft zoning districts/map as part of
a zoning rewrite process. ([City of
Evanston](https://www.cityofevanston.org/Home/Components/News/News/6449/249?npage=11))  
Even if your immediate campaign is “current vs our proposal,” build the
*data model* so you can swap in:

- Current code

- City draft

- Advocacy proposal(s)

This prevents rewrites every time the city posts a new draft.

**6) Tighten the “Unit blocks” concept so it can’t be ridiculed**

Right now “unit types” are described as draggable 1-story blocks with
footprints.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
That’s likely to produce uncanny, unrealistic buildings (and then people
argue about “nobody builds like that”).

Two alternatives that keep it simple:

**Option A: “Floor plate + core” model (recommended)**

- Choose building type (stacked flats, corridor, townhomes)

- Pick \# of floors

- Pick unit mix (studio/1/2/3BR) as counts, not shapes

- The geometry is a believable shell; units are a stats output

**Option B: Keep blocks, but only for massing modules**

Use “modules” like:

- 12’ bay

- stair core block

- corridor strip  
  This reads more like construction logic than “Tetris apartments.”

**7) Export should generate *advocacy-ready one-pagers*, not just
screenshots**

You already list screenshot + shareable URL.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
Add one more export type that’s huge for meetings:

**“Print sheet” export (PDF/image)**

Auto-compose:

- Street view render

- Front elevation

- Key stats (height, setbacks, lot coverage, units)

- Parking diagram

- Source citations / disclaimers

This lets you hand a skeptic something they can’t easily dismiss as “a
random rendering.”

**8) Data + licensing: don’t assume “parcel integration” is free to
redistribute**

Your V3 mentions integrating Evanston parcel data / Cook County GIS.
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))  
Be careful: Evanston’s own Maps page includes a disclaimer that
reproduction/redistribution of datasets/products is forbidden except for
consultants working for the city (and other limitations/warranty
language). ([City of
Evanston](https://www.cityofevanston.org/about-evanston/maps))

So in the spec, explicitly call out:

- **Data sources + licenses**

- Whether you’re storing geometry or just querying it live

- Whether you’ll rely on Cook County open data instead of
  Evanston-provided cadastral layers

This is the kind of boring detail that prevents a nasty surprise
mid-campaign.

**9) MVP scope tweak: make it “Scenario player + comparer,” not
“builder-lite”**

Your MVP list is close, but I’d rewrite it with a sharper objective:
**“Create 10 shareable scenarios that survive hostile scrutiny.”**
([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))

**MVP I’d ship (feature bullets)**

- Lot presets (50×150, 37.5×125, corner)
  ([Gist](https://gist.github.com/MisterClean/4d855df3f9d34ba6e08972fdaebda8c5))

- District preset(s) with a visible source link (start with R1–R3
  handout numbers)

- Envelope visualization + baseline SFH max massing

- 6–10 preset housing forms (2-flat, 3-flat, 4-flat, ADU/coach house,
  small apartment, townhomes)

- Comparison mode with A/B slider + fixed camera

- Parking diagram with geometry + “coverage debit” logic

- Shareable URL + “print sheet” export
