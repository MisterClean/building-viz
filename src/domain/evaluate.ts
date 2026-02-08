import { computeEnvelope, envelopeDepthFt, envelopeWidthFt, lotAreaSqFt } from './envelope'
import type { Envelope } from './envelope'
import type { Rect } from './geometry'
import { rectDepth, rectWidth } from './geometry'
import { computeMetrics, type BuildingMetrics } from './metrics'
import { layoutSurfaceParking, type SurfaceParkingLayout } from './parking'
import { placePresetInEnvelope } from './placement'
import type { Lot, PresetForm, Ruleset } from './types'

export type ViolationCode =
  | 'ENVELOPE_INVALID'
  | 'OUTSIDE_ENVELOPE'
  | 'HEIGHT'
  | 'FAR'
  | 'COVERAGE'
  | 'MIN_LOT_WIDTH'
  | 'MIN_LOT_AREA'
  | 'PARKING_UNDERPROVIDED'
  | 'PARKING_DOES_NOT_FIT'

export type Violation = {
  code: ViolationCode
  message: string
}

export type BindingInfo = {
  kind: 'violation' | 'binding'
  label: string
  detail?: string
}

export type Evaluation = {
  envelope: Envelope
  placement: { footprint: Rect }
  metrics: BuildingMetrics
  parkingLayout: SurfaceParkingLayout
  violations: Violation[]
  binding: BindingInfo
}

function push(violations: Violation[], code: ViolationCode, message: string) {
  violations.push({ code, message })
}

export function evaluateScenario(args: {
  lot: Lot
  ruleset: Ruleset
  preset: PresetForm
  providedParkingSpaces: number
  showParkingGeometry: boolean
  applyCoverageDebit: boolean
}): Evaluation {
  const {
    lot,
    ruleset,
    preset,
    providedParkingSpaces,
    showParkingGeometry,
    applyCoverageDebit,
  } = args

  const envelope = computeEnvelope(lot, ruleset)
  const placement = placePresetInEnvelope({ envelope, preset, mode: 'frontAligned' })
  const metrics = computeMetrics({ lot, ruleset, preset, applyCoverageDebit })

  const violations: Violation[] = []

  const envW = envelopeWidthFt(envelope)
  const envD = envelopeDepthFt(envelope)
  if (envW <= 0 || envD <= 0) {
    push(
      violations,
      'ENVELOPE_INVALID',
      'Setbacks leave no buildable area (envelope is invalid).',
    )
  }

  const fp = placement.footprint
  if (
    fp.x0 < envelope.x0 - 1e-6 ||
    fp.x1 > envelope.x1 + 1e-6 ||
    fp.z0 < envelope.z0 - 1e-6 ||
    fp.z1 > envelope.z1 + 1e-6
  ) {
    push(violations, 'OUTSIDE_ENVELOPE', 'Building footprint exceeds the setback envelope.')
  }

  if (metrics.heightFt > ruleset.maxHeightFt + 1e-6) {
    push(
      violations,
      'HEIGHT',
      `Building height (${metrics.heightFt.toFixed(1)} ft) exceeds max height (${ruleset.maxHeightFt.toFixed(1)} ft).`,
    )
  }

  if (metrics.farUsed > ruleset.maxFAR + 1e-6) {
    push(
      violations,
      'FAR',
      `FAR (${metrics.farUsed.toFixed(2)}) exceeds max FAR (${ruleset.maxFAR.toFixed(2)}).`,
    )
  }

  if (metrics.effectiveCoverageUsed > ruleset.maxLotCoveragePct + 1e-6) {
    push(
      violations,
      'COVERAGE',
      `Lot coverage (${(metrics.effectiveCoverageUsed * 100).toFixed(1)}%) exceeds max coverage (${(ruleset.maxLotCoveragePct * 100).toFixed(1)}%).`,
    )
  }

  if (ruleset.minLotWidthFt != null && lot.widthFt + 1e-6 < ruleset.minLotWidthFt) {
    push(
      violations,
      'MIN_LOT_WIDTH',
      `Lot width (${lot.widthFt.toFixed(1)} ft) is below the minimum (${ruleset.minLotWidthFt.toFixed(1)} ft).`,
    )
  }

  if (ruleset.minLotAreaSqFt != null) {
    const area = lotAreaSqFt(lot)
    if (area + 1e-6 < ruleset.minLotAreaSqFt) {
      push(
        violations,
        'MIN_LOT_AREA',
        `Lot area (${area.toFixed(0)} sf) is below the minimum (${ruleset.minLotAreaSqFt.toFixed(0)} sf).`,
      )
    }
  }

  if (providedParkingSpaces + 1e-6 < metrics.requiredParkingSpaces) {
    push(
      violations,
      'PARKING_UNDERPROVIDED',
      `Provided parking (${providedParkingSpaces}) is below required parking (${metrics.requiredParkingSpaces}).`,
    )
  }

  const parkingLayout =
    showParkingGeometry && providedParkingSpaces > 0
      ? layoutSurfaceParking({
          lot,
          behindBuildingZ: placement.footprint.z1,
          spaces: providedParkingSpaces,
        })
      : { fits: true, stalls: [] }

  if (showParkingGeometry && providedParkingSpaces > 0 && !parkingLayout.fits) {
    push(
      violations,
      'PARKING_DOES_NOT_FIT',
      parkingLayout.reason ?? 'Provided parking does not fit in the rear yard layout.',
    )
  }

  const binding = computeBinding({ envelope, placementFootprint: fp, metrics, ruleset, violations })

  return { envelope, placement, metrics, parkingLayout, violations, binding }
}

function computeBinding(args: {
  envelope: Envelope
  placementFootprint: Rect
  metrics: BuildingMetrics
  ruleset: Ruleset
  violations: Violation[]
}): BindingInfo {
  const { envelope, placementFootprint, metrics, ruleset, violations } = args

  if (violations.length > 0) {
    // Priority order already aligns with persuasion: start with “does it fit” then the headline caps.
    const priority: ViolationCode[] = [
      'OUTSIDE_ENVELOPE',
      'HEIGHT',
      'FAR',
      'COVERAGE',
      'PARKING_DOES_NOT_FIT',
      'PARKING_UNDERPROVIDED',
      'MIN_LOT_WIDTH',
      'MIN_LOT_AREA',
      'ENVELOPE_INVALID',
    ]
    const top = priority
      .map((code) => violations.find((v) => v.code === code))
      .find(Boolean)

    return {
      kind: 'violation',
      label: top?.message ?? violations[0]!.message,
    }
  }

  const envW = envelopeWidthFt(envelope)
  const envD = envelopeDepthFt(envelope)

  const widthUse = envW > 0 ? rectWidth(placementFootprint) / envW : 0
  const depthUse = envD > 0 ? rectDepth(placementFootprint) / envD : 0
  const heightUse = ruleset.maxHeightFt > 0 ? metrics.heightFt / ruleset.maxHeightFt : 0
  const farUse = ruleset.maxFAR > 0 ? metrics.farUsed / ruleset.maxFAR : 0
  const covUse =
    ruleset.maxLotCoveragePct > 0
      ? metrics.effectiveCoverageUsed / ruleset.maxLotCoveragePct
      : 0

  const candidates: Array<{ key: string; pct: number; label: string }> = [
    { key: 'width', pct: widthUse, label: `Envelope width is tight (${(widthUse * 100).toFixed(0)}% used).` },
    { key: 'depth', pct: depthUse, label: `Envelope depth is tight (${(depthUse * 100).toFixed(0)}% used).` },
    { key: 'height', pct: heightUse, label: `Height is tight (${(heightUse * 100).toFixed(0)}% used).` },
    { key: 'far', pct: farUse, label: `FAR is tight (${(farUse * 100).toFixed(0)}% used).` },
    { key: 'coverage', pct: covUse, label: `Lot coverage is tight (${(covUse * 100).toFixed(0)}% used).` },
  ]

  candidates.sort((a, b) => b.pct - a.pct)
  const best = candidates[0]
  return { kind: 'binding', label: best ? best.label : 'No binding constraint.' }
}

