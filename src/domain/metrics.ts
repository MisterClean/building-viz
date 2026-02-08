import { lotAreaSqFt } from './envelope'
import type { Lot, PresetForm, Ruleset } from './types'

export type BuildingMetrics = {
  footprintAreaSqFt: number
  gfaSqFt: number
  heightFt: number
  farUsed: number
  coverageUsed: number

  requiredParkingSpaces: number
  parkingCoverageDebitSqFt: number
  effectiveCoverageUsed: number
}

export function computeMetrics(args: {
  lot: Lot
  ruleset: Ruleset
  preset: PresetForm
  applyCoverageDebit: boolean
}): BuildingMetrics {
  const { lot, ruleset, preset, applyCoverageDebit } = args
  const lotArea = lotAreaSqFt(lot)

  const footprintAreaSqFt = preset.footprintWidthFt * preset.footprintDepthFt
  const gfaSqFt = footprintAreaSqFt * preset.stories
  const heightFt = preset.stories * preset.floorToFloorFt
  const farUsed = lotArea === 0 ? 0 : gfaSqFt / lotArea
  const coverageUsed = lotArea === 0 ? 0 : footprintAreaSqFt / lotArea

  const parkingMin = ruleset.parkingMinSpacesPerUnit ?? 0
  const requiredParkingSpaces = Math.ceil(preset.units * parkingMin)

  const debitPer =
    applyCoverageDebit && (ruleset.parkingCoverageDebitSqFtPerRequiredSpace ?? 0) > 0
      ? ruleset.parkingCoverageDebitSqFtPerRequiredSpace ?? 0
      : 0
  const parkingCoverageDebitSqFt = requiredParkingSpaces * debitPer
  const effectiveCoverageUsed =
    lotArea === 0 ? 0 : (footprintAreaSqFt + parkingCoverageDebitSqFt) / lotArea

  return {
    footprintAreaSqFt,
    gfaSqFt,
    heightFt,
    farUsed,
    coverageUsed,
    requiredParkingSpaces,
    parkingCoverageDebitSqFt,
    effectiveCoverageUsed,
  }
}

