export type StreetSide = 'left' | 'right'

export type LotSetbacksFt = {
  front: number
  rear: number
  sideLeft: number
  sideRight: number
  streetSide?: number
}

export type Lot = {
  widthFt: number
  depthFt: number
  isCorner: boolean
  streetSide: StreetSide
  setbacksFt: LotSetbacksFt
}

export type RulesetSource = {
  title: string
  url: string
  lastUpdated: string
}

export type Ruleset = {
  id: string
  name: string
  versionLabel: string
  notes?: string
  sources: RulesetSource[]

  maxHeightFt: number
  maxFAR: number
  maxLotCoveragePct: number

  minLotWidthFt?: number
  minLotAreaSqFt?: number

  parkingMinSpacesPerUnit?: number
  parkingCoverageDebitSqFtPerRequiredSpace?: number
}

export type PresetKind =
  | 'baseline_sfh'
  | 'stacked_flats'
  | 'townhouse'
  | 'courtyard'
  | 'adu'
  | 'mixed_use'

export type PresetForm = {
  id: string
  name: string
  description: string
  kind: PresetKind

  units: number
  stories: number
  floorToFloorFt: number

  footprintWidthFt: number
  footprintDepthFt: number
}

export type ParkingConfig = {
  providedSpaces: number
  showGeometry: boolean
  applyCoverageDebit: boolean
}

export type Scenario = {
  lot: Lot
  ruleset: Ruleset
  preset: PresetForm
  parking: ParkingConfig
}

