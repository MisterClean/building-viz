import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { evaluateScenario } from './domain/evaluate'
import { LOT_PRESETS, PRESET_FORMS, RULESETS, getPresetForm, getRuleset } from './domain/presets'
import { encodeState, writeStateToUrl, type PersistedStateV1 } from './app/persist'
import { useAppStore } from './app/store'
import type { Lot } from './domain/types'
const LazyViewport3D = lazy(() =>
  import('./view/Viewport3D').then((m) => ({ default: m.Viewport3D })),
)

function ViewportFallback(props: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-6 text-center">
      <div>
        <div className="text-sm font-semibold">{props.label}</div>
        <div className="mt-1 text-xs text-black/60">
          WebGL unavailable (expected in tests). Open in a browser with WebGL enabled for the 3D view.
        </div>
      </div>
    </div>
  )
}

function clampNumber(n: number, opts: { min?: number; max?: number }): number {
  const min = opts.min ?? -Infinity
  const max = opts.max ?? Infinity
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function num(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function lotPresetValue(lot: Lot): string {
  const key = JSON.stringify(lot)
  const preset = LOT_PRESETS.find((p) => JSON.stringify(p.lot) === key)
  return preset?.id ?? 'custom'
}

function App() {
  const {
    v,
    mode,
    cameraPreset,
    ui,
    scenarioA,
    scenarioB,
    setMode,
    setCameraPreset,
    setUi,
    setLot,
    setLotSetbacks,
    setRulesetId,
    setPresetId,
    setParking,
  } = useAppStore()

  const persisted: PersistedStateV1 = { v, mode, cameraPreset, ui, scenarioA, scenarioB }
  const [copied, setCopied] = useState(false)

  // Keep URL in sync for shareability.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = writeStateToUrl({ url: new URL(window.location.href), state: persisted })
      window.history.replaceState(null, '', next.toString())
    }, 200)
    return () => window.clearTimeout(handle)
  }, [persisted])

  const presetA = getPresetForm(scenarioA.presetId) ?? PRESET_FORMS[0]!
  const presetB = getPresetForm(scenarioB.presetId) ?? PRESET_FORMS[0]!
  const rulesetA = getRuleset(scenarioA.rulesetId) ?? RULESETS[0]!
  const rulesetB = getRuleset(scenarioB.rulesetId) ?? RULESETS[0]!

  const evalA = useMemo(
    () =>
      evaluateScenario({
        lot: scenarioA.lot,
        ruleset: rulesetA,
        preset: presetA,
        providedParkingSpaces: scenarioA.parking.providedSpaces,
        showParkingGeometry: scenarioA.parking.showGeometry,
        applyCoverageDebit: scenarioA.parking.applyCoverageDebit,
      }),
    [scenarioA, rulesetA, presetA],
  )

  const evalB = useMemo(
    () =>
      evaluateScenario({
        lot: scenarioB.lot,
        ruleset: rulesetB,
        preset: presetB,
        providedParkingSpaces: scenarioB.parking.providedSpaces,
        showParkingGeometry: scenarioB.parking.showGeometry,
        applyCoverageDebit: scenarioB.parking.applyCoverageDebit,
      }),
    [scenarioB, rulesetB, presetB],
  )

  async function onCopyLink() {
    const next = writeStateToUrl({ url: new URL(window.location.href), state: persisted })
    const url = next.toString()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1000)
    } catch {
      window.prompt('Copy this URL:', url)
    }
  }

  return (
    <div className="h-full">
      <header className="border-b border-black/10 bg-white/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-wide text-ink">
            Building-Viz
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-black/60">
              <span className="sr-only">Mode</span>
              <select
                className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-xs"
                value={mode}
                onChange={(e) => setMode(e.target.value === 'compare' ? 'compare' : 'single')}
              >
                <option value="single">Single</option>
                <option value="compare">Compare</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-xs hover:bg-white"
              onClick={onCopyLink}
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <div className="hidden text-xs text-black/60 sm:block">
              Conceptual visualization, not legal advice.
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100%-52px)] max-w-7xl grid-cols-1 gap-3 p-3 md:grid-cols-[360px_1fr]">
        <aside
          data-testid="sidebar"
          className="rounded-xl border border-black/10 bg-white/60 p-4 backdrop-blur"
        >
          <h2 className="text-sm font-semibold">Scenario</h2>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-black/70">Lot preset</label>
              <select
                className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                value={lotPresetValue(scenarioA.lot)}
                onChange={(e) => {
                  const preset = LOT_PRESETS.find((p) => p.id === e.target.value)
                  if (!preset) return
                  setLot('A', JSON.parse(JSON.stringify(preset.lot)))
                  setLot('B', JSON.parse(JSON.stringify(preset.lot)))
                }}
              >
                <option value="custom">Custom</option>
                {LOT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-black/50">
                Presets are placeholders until we wire real district datasets.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-black/70">
                Width (ft)
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  value={scenarioA.lot.widthFt}
                  step="0.5"
                  min={0}
                  onChange={(e) => {
                    const widthFt = clampNumber(num(e.target.value), { min: 0 })
                    setLot('A', { ...scenarioA.lot, widthFt })
                    setLot('B', { ...scenarioB.lot, widthFt })
                  }}
                />
              </label>
              <label className="text-xs font-medium text-black/70">
                Depth (ft)
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  value={scenarioA.lot.depthFt}
                  step="0.5"
                  min={0}
                  onChange={(e) => {
                    const depthFt = clampNumber(num(e.target.value), { min: 0 })
                    setLot('A', { ...scenarioA.lot, depthFt })
                    setLot('B', { ...scenarioB.lot, depthFt })
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-black/70">
                Front setback
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  value={scenarioA.lot.setbacksFt.front}
                  step="0.5"
                  min={0}
                  onChange={(e) => {
                    const front = clampNumber(num(e.target.value), { min: 0 })
                    setLotSetbacks('A', { front })
                    setLotSetbacks('B', { front })
                  }}
                />
              </label>
              <label className="text-xs font-medium text-black/70">
                Rear setback
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  value={scenarioA.lot.setbacksFt.rear}
                  step="0.5"
                  min={0}
                  onChange={(e) => {
                    const rear = clampNumber(num(e.target.value), { min: 0 })
                    setLotSetbacks('A', { rear })
                    setLotSetbacks('B', { rear })
                  }}
                />
              </label>
              <label className="text-xs font-medium text-black/70">
                Side (L)
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  value={scenarioA.lot.setbacksFt.sideLeft}
                  step="0.5"
                  min={0}
                  onChange={(e) => {
                    const sideLeft = clampNumber(num(e.target.value), { min: 0 })
                    setLotSetbacks('A', { sideLeft })
                    setLotSetbacks('B', { sideLeft })
                  }}
                />
              </label>
              <label className="text-xs font-medium text-black/70">
                Side (R)
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  value={scenarioA.lot.setbacksFt.sideRight}
                  step="0.5"
                  min={0}
                  onChange={(e) => {
                    const sideRight = clampNumber(num(e.target.value), { min: 0 })
                    setLotSetbacks('A', { sideRight })
                    setLotSetbacks('B', { sideRight })
                  }}
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-black/70">Housing preset</label>
              <select
                className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                value={scenarioA.presetId}
                onChange={(e) => {
                  setPresetId('A', e.target.value)
                  setPresetId('B', e.target.value)
                }}
              >
                {PRESET_FORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-black/50">{presetA.description}</p>
            </div>

            <div className={mode === 'compare' ? 'grid grid-cols-2 gap-2' : ''}>
              <div>
                <label className="text-xs font-medium text-black/70">Ruleset A</label>
                <select
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  value={scenarioA.rulesetId}
                  onChange={(e) => setRulesetId('A', e.target.value)}
                >
                  {RULESETS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.versionLabel}
                    </option>
                  ))}
                </select>
              </div>
              {mode === 'compare' ? (
                <div>
                  <label className="text-xs font-medium text-black/70">Ruleset B</label>
                  <select
                    className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                    value={scenarioB.rulesetId}
                    onChange={(e) => setRulesetId('B', e.target.value)}
                  >
                    {RULESETS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.versionLabel}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <p className="col-span-2 mt-1 text-[11px] text-black/50">
                {rulesetA.notes ?? 'No ruleset notes.'}
              </p>
            </div>

            <div className={mode === 'compare' ? 'grid grid-cols-2 gap-2' : ''}>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-black/70">Parking (A)</label>
                  <label className="flex items-center gap-2 text-[11px] text-black/60">
                    <input
                      type="checkbox"
                      checked={scenarioA.parking.showGeometry}
                      onChange={(e) => setParking('A', { showGeometry: e.target.checked })}
                    />
                    Show
                  </label>
                </div>
                <input
                  className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                  type="number"
                  min={0}
                  step={1}
                  value={scenarioA.parking.providedSpaces}
                  onChange={(e) => setParking('A', { providedSpaces: Math.max(0, Math.floor(num(e.target.value))) })}
                />
              </div>

              {mode === 'compare' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-black/70">Parking (B)</label>
                    <label className="flex items-center gap-2 text-[11px] text-black/60">
                      <input
                        type="checkbox"
                        checked={scenarioB.parking.showGeometry}
                        onChange={(e) => setParking('B', { showGeometry: e.target.checked })}
                      />
                      Show
                    </label>
                  </div>
                  <input
                    className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-2 text-sm"
                    type="number"
                    min={0}
                    step={1}
                    value={scenarioB.parking.providedSpaces}
                    onChange={(e) =>
                      setParking('B', { providedSpaces: Math.max(0, Math.floor(num(e.target.value))) })
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className={`rounded-md border border-black/10 px-2 py-2 text-xs ${
                  cameraPreset === 'street' ? 'bg-black text-white' : 'bg-white/70 hover:bg-white'
                }`}
                onClick={() => setCameraPreset('street')}
              >
                Street
              </button>
              <button
                type="button"
                className={`rounded-md border border-black/10 px-2 py-2 text-xs ${
                  cameraPreset === 'front' ? 'bg-black text-white' : 'bg-white/70 hover:bg-white'
                }`}
                onClick={() => setCameraPreset('front')}
              >
                Front
              </button>
              <button
                type="button"
                className={`rounded-md border border-black/10 px-2 py-2 text-xs ${
                  cameraPreset === 'aerial' ? 'bg-black text-white' : 'bg-white/70 hover:bg-white'
                }`}
                onClick={() => setCameraPreset('aerial')}
              >
                Aerial
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-black/70">
                <input
                  type="checkbox"
                  checked={ui.showNeighbors}
                  onChange={(e) => setUi({ showNeighbors: e.target.checked })}
                />
                Neighbors
              </label>
              <label className="flex items-center gap-2 text-xs text-black/70">
                <input
                  type="checkbox"
                  checked={ui.showTrees}
                  onChange={(e) => setUi({ showTrees: e.target.checked })}
                />
                Trees
              </label>
            </div>
          </div>

          <hr className="my-4 border-black/10" />

          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Stats {mode === 'compare' ? '(A vs B)' : '(A)'}
              </div>
              <div className="mt-2 rounded-lg border border-black/10 bg-white/60 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-black/60">Units</span>
                  <span className="font-semibold">
                    {presetA.units}
                    {mode === 'compare' ? ` → ${presetB.units}` : ''}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-black/60">Height</span>
                  <span className="font-semibold">
                    {evalA.metrics.heightFt.toFixed(0)} ft / {rulesetA.maxHeightFt.toFixed(0)} ft
                    {mode === 'compare'
                      ? ` → ${evalB.metrics.heightFt.toFixed(0)} ft / ${rulesetB.maxHeightFt.toFixed(0)} ft`
                      : ''}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-black/60">FAR</span>
                  <span className="font-semibold">
                    {evalA.metrics.farUsed.toFixed(2)} / {rulesetA.maxFAR.toFixed(2)}
                    {mode === 'compare'
                      ? ` → ${evalB.metrics.farUsed.toFixed(2)} / ${rulesetB.maxFAR.toFixed(2)}`
                      : ''}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-black/60">Coverage</span>
                  <span className="font-semibold">
                    {(evalA.metrics.effectiveCoverageUsed * 100).toFixed(1)}% /{' '}
                    {(rulesetA.maxLotCoveragePct * 100).toFixed(0)}%
                    {mode === 'compare'
                      ? ` → ${(evalB.metrics.effectiveCoverageUsed * 100).toFixed(1)}% / ${(rulesetB.maxLotCoveragePct * 100).toFixed(0)}%`
                      : ''}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-black/60">Parking</span>
                  <span className="font-semibold">
                    {scenarioA.parking.providedSpaces} provided / {evalA.metrics.requiredParkingSpaces} required
                    {mode === 'compare'
                      ? ` → ${scenarioB.parking.providedSpaces} / ${evalB.metrics.requiredParkingSpaces}`
                      : ''}
                  </span>
                </div>

                <div className="mt-3 rounded-md border border-black/10 bg-white/70 p-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-black/60">
                    {evalA.binding.kind === 'violation' ? 'Violation' : 'Binding constraint'}
                  </div>
                  <div className="mt-1 text-xs font-medium">{evalA.binding.label}</div>
                </div>

                {evalA.violations.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-[11px] text-red-800">
                    {evalA.violations.map((v) => (
                      <li key={v.code}>{v.message}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-[11px] text-black/50">No violations detected.</div>
                )}
              </div>
            </div>

            <details className="rounded-lg border border-black/10 bg-white/60 p-3 text-xs">
              <summary className="cursor-pointer select-none text-xs font-semibold">
                Sources
              </summary>
              <div className="mt-2 text-[11px] text-black/60">
                {rulesetA.sources.length === 0
                  ? 'No sources attached to this sample ruleset yet.'
                  : rulesetA.sources.map((s) => (
                      <div key={s.url}>
                        <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                          {s.title}
                        </a>{' '}
                        <span className="text-black/40">(updated {s.lastUpdated})</span>
                      </div>
                    ))}
              </div>
            </details>
          </div>
        </aside>

        <main
          data-testid="viewport"
          className="relative overflow-hidden rounded-xl border border-black/10 bg-white/40 backdrop-blur"
        >
          {typeof WebGLRenderingContext === 'undefined' ? (
            <ViewportFallback label="3D Viewport" />
          ) : mode === 'compare' ? (
            <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
              <div className="relative border-b border-black/10 md:border-b-0 md:border-r">
                <div className="absolute left-3 top-3 z-10 rounded-md border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-semibold">
                  A: {rulesetA.versionLabel}
                </div>
                <Suspense fallback={<ViewportFallback label={`A: ${rulesetA.versionLabel}`} />}>
                  <LazyViewport3D
                    label={`A: ${rulesetA.versionLabel}`}
                    cameraPreset={cameraPreset}
                    ui={ui}
                    evaluation={evalA}
                    controlsEnabled={false}
                  />
                </Suspense>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-3 z-10 rounded-md border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-semibold">
                  B: {rulesetB.versionLabel}
                </div>
                <Suspense fallback={<ViewportFallback label={`B: ${rulesetB.versionLabel}`} />}>
                  <LazyViewport3D
                    label={`B: ${rulesetB.versionLabel}`}
                    cameraPreset={cameraPreset}
                    ui={ui}
                    evaluation={evalB}
                    controlsEnabled={false}
                  />
                </Suspense>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0">
              <div className="absolute left-3 top-3 z-10 rounded-md border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-semibold">
                {rulesetA.versionLabel}
              </div>
              <Suspense fallback={<ViewportFallback label={rulesetA.versionLabel} />}>
                <LazyViewport3D
                  label={rulesetA.versionLabel}
                  cameraPreset={cameraPreset}
                  ui={ui}
                  evaluation={evalA}
                  controlsEnabled
                />
              </Suspense>
              <div className="absolute bottom-2 right-3 z-10 rounded-md border border-black/10 bg-white/60 px-2 py-1 text-[11px] text-black/60">
                URL payload: {encodeState(persisted).length} chars
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
