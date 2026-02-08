import type { Lot, Ruleset } from './types'

export type Envelope = {
  x0: number
  x1: number
  z0: number
  z1: number
  maxHeightFt: number
}

export function lotAreaSqFt(lot: Lot): number {
  return lot.widthFt * lot.depthFt
}

export function computeEnvelope(lot: Lot, ruleset: Ruleset): Envelope {
  const s = lot.setbacksFt

  const streetSideSetback = lot.isCorner ? (s.streetSide ?? 0) : 0
  const effectiveLeft =
    lot.isCorner && lot.streetSide === 'left'
      ? Math.max(s.sideLeft, streetSideSetback)
      : s.sideLeft
  const effectiveRight =
    lot.isCorner && lot.streetSide === 'right'
      ? Math.max(s.sideRight, streetSideSetback)
      : s.sideRight

  return {
    x0: effectiveLeft,
    x1: lot.widthFt - effectiveRight,
    z0: s.front,
    z1: lot.depthFt - s.rear,
    maxHeightFt: ruleset.maxHeightFt,
  }
}

export function envelopeWidthFt(env: Envelope): number {
  return env.x1 - env.x0
}

export function envelopeDepthFt(env: Envelope): number {
  return env.z1 - env.z0
}

