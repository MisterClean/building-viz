import { Suspense, lazy, useMemo } from 'react'
import { decodeState, type PersistedStateV1 } from '../app/persist'
import { evaluateScenario } from '../domain/evaluate'
import { PRESET_FORMS, RULESETS, getPresetForm, getRuleset } from '../domain/presets'
import { ParkingDiagram } from './ParkingDiagram'

const LazyViewport3D = lazy(() =>
  import('../view/Viewport3D').then((m) => ({ default: m.Viewport3D })),
)

function ViewportFallback(props: { label: string }) {
  return (
    <div className="grid h-full place-items-center rounded-lg border border-black/10 bg-white p-6 text-center">
      <div>
        <div className="text-sm font-semibold">{props.label}</div>
        <div className="mt-1 text-xs text-black/60">
          WebGL unavailable. Open in a browser with WebGL enabled to render the 3D views for printing.
        </div>
      </div>
    </div>
  )
}

export default function PrintApp() {
  const state = useMemo(() => readStateFromLocation(), [])

  if (!state) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-lg font-semibold">Print Sheet</h1>
        <p className="mt-2 text-sm text-black/60">
          Missing or invalid scenario state. Open the editor first and use the “Print sheet” button.
        </p>
      </div>
    )
  }

  const scenarioA = state.scenarioA
  const scenarioB = state.scenarioB

  const presetA = getPresetForm(scenarioA.presetId) ?? PRESET_FORMS[0]!
  const presetB = getPresetForm(scenarioB.presetId) ?? PRESET_FORMS[0]!
  const rulesetA = getRuleset(scenarioA.rulesetId) ?? RULESETS[0]!
  const rulesetB = getRuleset(scenarioB.rulesetId) ?? RULESETS[0]!

  const evalA = evaluateScenario({
    lot: scenarioA.lot,
    ruleset: rulesetA,
    preset: presetA,
    providedParkingSpaces: scenarioA.parking.providedSpaces,
    showParkingGeometry: scenarioA.parking.showGeometry,
    applyCoverageDebit: scenarioA.parking.applyCoverageDebit,
  })

  const evalB = evaluateScenario({
    lot: scenarioB.lot,
    ruleset: rulesetB,
    preset: presetB,
    providedParkingSpaces: scenarioB.parking.providedSpaces,
    showParkingGeometry: scenarioB.parking.showGeometry,
    applyCoverageDebit: scenarioB.parking.applyCoverageDebit,
  })

  const isCompare = state.mode === 'compare'

  return (
    <div className="mx-auto max-w-6xl bg-white p-6 text-ink">
      <div className="no-print flex items-center justify-between gap-3">
        <a
          className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
          href={backToEditorUrl()}
        >
          Back to editor
        </a>
        <button
          type="button"
          className="rounded-md border border-black/10 bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      <header className="mt-4 border-b border-black/10 pb-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-black/60">Building-Viz</div>
        <h1 className="mt-1 text-xl font-semibold">Scenario Print Sheet</h1>
        <div className="mt-1 text-sm text-black/60">
          Lot: {scenarioA.lot.widthFt} ft x {scenarioA.lot.depthFt} ft • Preset: {presetA.name}
        </div>
        <div className="mt-1 text-[11px] text-black/50">Conceptual visualization, not legal advice.</div>
      </header>

      <div className={`mt-5 grid grid-cols-1 gap-6 ${isCompare ? 'lg:grid-cols-2' : ''}`}>
        <ScenarioSection label="A" rulesetLabel={rulesetA.versionLabel} evaluation={evalA} />
        {isCompare ? (
          <ScenarioSection label="B" rulesetLabel={rulesetB.versionLabel} evaluation={evalB} />
        ) : null}
      </div>
    </div>
  )
}

function ScenarioSection(props: { label: string; rulesetLabel: string; evaluation: ReturnType<typeof evaluateScenario> }) {
  const { evaluation } = props

  return (
    <section className="break-inside-avoid">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {props.label}: {props.rulesetLabel}
        </div>
        <div className="text-xs text-black/60">
          Units: {evaluation.preset.units} • Stories: {evaluation.preset.stories}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-56">
          {typeof WebGLRenderingContext === 'undefined' ? (
            <ViewportFallback label="Street view" />
          ) : (
            <Suspense fallback={<ViewportFallback label="Street view" />}>
              <LazyViewport3D
                label="Street view"
                cameraPreset="street"
                ui={{ showNeighbors: true, showTrees: true }}
                evaluation={evaluation}
                controlsEnabled={false}
              />
            </Suspense>
          )}
          <div className="mt-1 text-[11px] text-black/50">Street view</div>
        </div>
        <div className="h-56">
          {typeof WebGLRenderingContext === 'undefined' ? (
            <ViewportFallback label="Front elevation" />
          ) : (
            <Suspense fallback={<ViewportFallback label="Front elevation" />}>
              <LazyViewport3D
                label="Front elevation"
                cameraPreset="front"
                ui={{ showNeighbors: false, showTrees: false }}
                evaluation={evaluation}
                controlsEnabled={false}
              />
            </Suspense>
          )}
          <div className="mt-1 text-[11px] text-black/50">Front elevation</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatsCard evaluation={evaluation} />
        <ParkingDiagram evaluation={evaluation} />
      </div>

      <div className="mt-3 rounded-lg border border-black/10 bg-white p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-black/60">Sources</div>
        <div className="mt-2 text-[11px] text-black/60">
          {evaluation.ruleset.sources.length === 0 ? (
            <div>No sources attached to this ruleset.</div>
          ) : (
            evaluation.ruleset.sources.map((s) => (
              <div key={s.url}>
                <span className="font-medium">{s.title}</span>{' '}
                <span className="text-black/40">(updated {s.lastUpdated})</span>{' '}
                <span className="text-black/40">{s.url}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function StatsCard(props: { evaluation: ReturnType<typeof evaluateScenario> }) {
  const e = props.evaluation
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-black/60">Key Stats</div>
      <div className="mt-2 text-xs">
        <Row k="Height" v={`${e.metrics.heightFt.toFixed(0)} ft (max ${e.ruleset.maxHeightFt.toFixed(0)} ft)`} />
        <Row k="FAR" v={`${e.metrics.farUsed.toFixed(2)} (max ${e.ruleset.maxFAR.toFixed(2)})`} />
        <Row
          k="Coverage"
          v={`${(e.metrics.effectiveCoverageUsed * 100).toFixed(1)}% (max ${(e.ruleset.maxLotCoveragePct * 100).toFixed(0)}%)`}
        />
        <Row
          k="Parking"
          v={`${e.preset.units} units • ${e.metrics.requiredParkingSpaces} required • ${e.parkingLayout.stalls.length} shown`}
        />
      </div>

      <div className="mt-3 rounded-md border border-black/10 bg-black/5 p-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-black/60">
          {e.binding.kind === 'violation' ? 'Violation' : 'Binding constraint'}
        </div>
        <div className="mt-1 text-xs font-medium">{e.binding.label}</div>
      </div>

      {e.violations.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-[11px] text-red-800">
          {e.violations.map((v) => (
            <li key={v.code}>{v.message}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-[11px] text-black/50">No violations detected.</div>
      )}
    </div>
  )
}

function Row(props: { k: string; v: string }) {
  return (
    <div className="mt-1 flex items-baseline justify-between gap-4">
      <span className="text-black/60">{props.k}</span>
      <span className="font-semibold">{props.v}</span>
    </div>
  )
}

function readStateFromLocation(): PersistedStateV1 | null {
  try {
    const url = new URL(window.location.href)
    const encoded = url.searchParams.get('s')
    if (!encoded) return null
    return decodeState(encoded)
  } catch {
    return null
  }
}

function backToEditorUrl(): string {
  const url = new URL(window.location.href)
  url.searchParams.delete('print')
  return url.toString()
}

