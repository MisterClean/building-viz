import { create } from 'zustand'
import { LOT_PRESETS } from '../domain/presets'
import type { Lot } from '../domain/types'
import type { AppMode, CameraPreset, PersistedStateV1, ScenarioConfig, UiConfig } from './persist'
import { normalizeState, readStateFromUrl } from './persist'

type Actions = {
  setMode(mode: AppMode): void
  setCameraPreset(preset: CameraPreset): void
  setUi(next: Partial<UiConfig>): void

  setScenario(which: 'A' | 'B', next: Partial<ScenarioConfig>): void
  setLot(which: 'A' | 'B', next: Lot): void
  setLotSetbacks(which: 'A' | 'B', next: Partial<Lot['setbacksFt']>): void
  setRulesetId(which: 'A' | 'B', id: string): void
  setPresetId(which: 'A' | 'B', id: string): void
  setParking(which: 'A' | 'B', next: Partial<ScenarioConfig['parking']>): void

  replaceState(next: PersistedStateV1): void
}

export type AppState = PersistedStateV1 & Actions

function cloneLot(lot: Lot): Lot {
  return JSON.parse(JSON.stringify(lot)) as Lot
}

export function getDefaultState(): PersistedStateV1 {
  const lot = cloneLot(LOT_PRESETS[0]!.lot)
  return {
    v: 1,
    mode: 'single',
    cameraPreset: 'street',
    ui: { showNeighbors: true, showTrees: true },
    scenarioA: {
      lot,
      rulesetId: 'sample_current',
      presetId: 'two_flat',
      parking: { providedSpaces: 2, showGeometry: true, applyCoverageDebit: false },
    },
    scenarioB: {
      lot: cloneLot(lot),
      rulesetId: 'sample_proposed',
      presetId: 'two_flat',
      parking: { providedSpaces: 0, showGeometry: false, applyCoverageDebit: false },
    },
  }
}

function getInitialState(): PersistedStateV1 {
  const fallback = getDefaultState()
  if (typeof window === 'undefined') return fallback

  try {
    const url = new URL(window.location.href)
    const fromUrl = readStateFromUrl(url)
    return fromUrl ? normalizeState(fromUrl) : fallback
  } catch {
    return fallback
  }
}

export const useAppStore = create<AppState>((set) => ({
  ...getInitialState(),

  setMode: (mode) => set({ mode }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setUi: (next) => set((s) => ({ ui: { ...s.ui, ...next } })),

  setScenario: (which, next) =>
    set((s) => {
      const key = which === 'A' ? 'scenarioA' : 'scenarioB'
      return { [key]: { ...s[key], ...next } } as Partial<AppState>
    }),

  setLot: (which, lot) =>
    set((s) => {
      const key = which === 'A' ? 'scenarioA' : 'scenarioB'
      return { [key]: { ...s[key], lot } } as Partial<AppState>
    }),

  setLotSetbacks: (which, next) =>
    set((s) => {
      const key = which === 'A' ? 'scenarioA' : 'scenarioB'
      return {
        [key]: { ...s[key], lot: { ...s[key].lot, setbacksFt: { ...s[key].lot.setbacksFt, ...next } } },
      } as Partial<AppState>
    }),

  setRulesetId: (which, rulesetId) =>
    set((s) => {
      const key = which === 'A' ? 'scenarioA' : 'scenarioB'
      return { [key]: { ...s[key], rulesetId } } as Partial<AppState>
    }),

  setPresetId: (which, presetId) =>
    set((s) => {
      const key = which === 'A' ? 'scenarioA' : 'scenarioB'
      return { [key]: { ...s[key], presetId } } as Partial<AppState>
    }),

  setParking: (which, next) =>
    set((s) => {
      const key = which === 'A' ? 'scenarioA' : 'scenarioB'
      return { [key]: { ...s[key], parking: { ...s[key].parking, ...next } } } as Partial<AppState>
    }),

  replaceState: (next) => set(normalizeState(next)),
}))

