import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { z } from 'zod'
import { getPresetForm, getRuleset } from '../domain/presets'
import type { Lot, ParkingConfig, StreetSide } from '../domain/types'

export type CameraPreset = 'street' | 'front' | 'aerial'
export type AppMode = 'single' | 'compare'

export type ScenarioConfig = {
  lot: Lot
  rulesetId: string
  presetId: string
  parking: ParkingConfig
}

export type UiConfig = {
  showNeighbors: boolean
  showTrees: boolean
}

export type PersistedStateV1 = {
  v: 1
  mode: AppMode
  cameraPreset: CameraPreset
  ui: UiConfig
  scenarioA: ScenarioConfig
  scenarioB: ScenarioConfig
}

const StreetSideSchema: z.ZodType<StreetSide> = z.enum(['left', 'right'])

const LotSetbacksSchema = z.object({
  front: z.number().finite(),
  rear: z.number().finite(),
  sideLeft: z.number().finite(),
  sideRight: z.number().finite(),
  streetSide: z.number().finite().optional(),
})

const LotSchema: z.ZodType<Lot> = z.object({
  widthFt: z.number().finite(),
  depthFt: z.number().finite(),
  isCorner: z.boolean(),
  streetSide: StreetSideSchema,
  setbacksFt: LotSetbacksSchema,
})

const ParkingSchema: z.ZodType<ParkingConfig> = z.object({
  providedSpaces: z.number().int().min(0),
  showGeometry: z.boolean(),
  applyCoverageDebit: z.boolean(),
})

const ScenarioSchema: z.ZodType<ScenarioConfig> = z.object({
  lot: LotSchema,
  rulesetId: z.string(),
  presetId: z.string(),
  parking: ParkingSchema,
})

const PersistedSchema: z.ZodType<PersistedStateV1> = z.object({
  v: z.literal(1),
  mode: z.enum(['single', 'compare']),
  cameraPreset: z.enum(['street', 'front', 'aerial']),
  ui: z.object({
    showNeighbors: z.boolean(),
    showTrees: z.boolean(),
  }),
  scenarioA: ScenarioSchema,
  scenarioB: ScenarioSchema,
})

export function encodeState(state: PersistedStateV1): string {
  const json = JSON.stringify(state)
  return compressToEncodedURIComponent(json)
}

export function decodeState(encoded: string): PersistedStateV1 | null {
  const json = decompressFromEncodedURIComponent(encoded)
  if (!json) return null

  const raw = JSON.parse(json) as unknown
  const parsed = PersistedSchema.safeParse(raw)
  if (!parsed.success) return null

  return normalizeState(parsed.data)
}

export function normalizeState(state: PersistedStateV1): PersistedStateV1 {
  function normalizeScenario(s: ScenarioConfig): ScenarioConfig {
    const rulesetId = getRuleset(s.rulesetId) ? s.rulesetId : 'sample_current'
    const presetId = getPresetForm(s.presetId) ? s.presetId : 'two_flat'
    return { ...s, rulesetId, presetId }
  }

  return {
    ...state,
    scenarioA: normalizeScenario(state.scenarioA),
    scenarioB: normalizeScenario(state.scenarioB),
  }
}

export function readStateFromUrl(url: URL): PersistedStateV1 | null {
  const encoded = url.searchParams.get('s')
  if (!encoded) return null
  return decodeState(encoded)
}

export function writeStateToUrl(args: { url: URL; state: PersistedStateV1 }): URL {
  const next = new URL(args.url)
  next.searchParams.set('s', encodeState(args.state))
  return next
}

