import type { Lot, PresetForm, Ruleset } from './types'

export function getLotPreset(id: string): { id: string; name: string; lot: Lot } | undefined {
  return LOT_PRESETS.find((p) => p.id === id)
}

export function getRuleset(id: string): Ruleset | undefined {
  return RULESETS.find((r) => r.id === id)
}

export function getPresetForm(id: string): PresetForm | undefined {
  return PRESET_FORMS.find((p) => p.id === id)
}

export const LOT_PRESETS: Array<{ id: string; name: string; lot: Lot }> = [
  {
    id: 'lot_50x150',
    name: "Typical 50' x 150'",
    lot: {
      widthFt: 50,
      depthFt: 150,
      isCorner: false,
      streetSide: 'right',
      setbacksFt: { front: 20, rear: 30, sideLeft: 5, sideRight: 5 },
    },
  },
  {
    id: 'lot_37_5x125',
    name: "Typical 37.5' x 125'",
    lot: {
      widthFt: 37.5,
      depthFt: 125,
      isCorner: false,
      streetSide: 'right',
      setbacksFt: { front: 20, rear: 25, sideLeft: 3, sideRight: 3 },
    },
  },
  {
    id: 'lot_corner_50x150',
    name: "Corner 50' x 150'",
    lot: {
      widthFt: 50,
      depthFt: 150,
      isCorner: true,
      streetSide: 'right',
      setbacksFt: { front: 20, rear: 30, sideLeft: 5, sideRight: 5, streetSide: 15 },
    },
  },
]

export const RULESETS: Ruleset[] = [
  {
    id: 'sample_current',
    name: 'Sample Low-Rise Residential',
    versionLabel: 'Current (Sample)',
    notes:
      'Placeholder ruleset for MVP scaffolding. Replace with jurisdiction-specific data + sources in V2.',
    sources: [],
    maxHeightFt: 35,
    maxFAR: 0.9,
    maxLotCoveragePct: 0.4,
    minLotWidthFt: 25,
    minLotAreaSqFt: 2500,
    parkingMinSpacesPerUnit: 1,
    parkingCoverageDebitSqFtPerRequiredSpace: 0,
  },
  {
    id: 'sample_proposed',
    name: 'Sample Low-Rise Residential',
    versionLabel: 'Proposed (Sample: No Parking Minimum)',
    notes:
      'Demonstration ruleset: remove parking minimums but keep massing limits the same.',
    sources: [],
    maxHeightFt: 35,
    maxFAR: 0.9,
    maxLotCoveragePct: 0.4,
    minLotWidthFt: 25,
    minLotAreaSqFt: 2500,
    parkingMinSpacesPerUnit: 0,
    parkingCoverageDebitSqFtPerRequiredSpace: 0,
  },
]

export const PRESET_FORMS: PresetForm[] = [
  {
    id: 'baseline_sfh',
    name: 'Max Single-Family (Baseline)',
    description: 'A simple baseline mass within typical low-rise caps.',
    kind: 'baseline_sfh',
    units: 1,
    stories: 2,
    floorToFloorFt: 10,
    footprintWidthFt: 28,
    footprintDepthFt: 45,
  },
  {
    id: 'two_flat',
    name: 'Classic 2-flat',
    description: 'Two units stacked over two stories.',
    kind: 'stacked_flats',
    units: 2,
    stories: 2,
    floorToFloorFt: 10,
    footprintWidthFt: 30,
    footprintDepthFt: 55,
  },
  {
    id: 'triplex',
    name: 'Missing middle triplex',
    description: 'Three units over three stories.',
    kind: 'stacked_flats',
    units: 3,
    stories: 3,
    floorToFloorFt: 10,
    footprintWidthFt: 30,
    footprintDepthFt: 55,
  },
  {
    id: 'four_flat',
    name: '4-flat',
    description: 'Four units over three stories (larger floor plate).',
    kind: 'stacked_flats',
    units: 4,
    stories: 3,
    floorToFloorFt: 10,
    footprintWidthFt: 34,
    footprintDepthFt: 60,
  },
  {
    id: 'six_flat',
    name: '3-story 6-flat (small apartment)',
    description: 'Six units over three stories (simple massing).',
    kind: 'stacked_flats',
    units: 6,
    stories: 3,
    floorToFloorFt: 10,
    footprintWidthFt: 38,
    footprintDepthFt: 75,
  },
  {
    id: 'townhouse_row',
    name: 'Townhouse row',
    description: 'Four attached townhomes (conceptual massing).',
    kind: 'townhouse',
    units: 4,
    stories: 3,
    floorToFloorFt: 10,
    footprintWidthFt: 40,
    footprintDepthFt: 50,
  },
]
