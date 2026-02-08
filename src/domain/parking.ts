import type { Lot } from './types'
import type { Rect } from './geometry'

export type SurfaceParkingLayout = {
  fits: boolean
  reason?: string
  stalls: Rect[]
  aisle?: Rect
}

export type SurfaceParkingParams = {
  lot: Lot
  behindBuildingZ: number
  spaces: number

  stallWidthFt?: number
  stallDepthFt?: number
  aisleDepthFt?: number
  clearanceFt?: number
}

export function layoutSurfaceParking(p: SurfaceParkingParams): SurfaceParkingLayout {
  const spaces = Math.max(0, Math.floor(p.spaces))
  if (spaces === 0) return { fits: true, stalls: [] }

  const stallW = p.stallWidthFt ?? 9
  const stallD = p.stallDepthFt ?? 18
  const aisleD = p.aisleDepthFt ?? 24
  const clearance = p.clearanceFt ?? 2

  const xMin = 0
  const xMax = p.lot.widthFt

  const zStart = p.behindBuildingZ + clearance
  const zEnd = p.lot.depthFt
  const availableDepth = zEnd - zStart
  const availableWidth = xMax - xMin

  const stallsPerRow = Math.floor(availableWidth / stallW)
  if (stallsPerRow <= 0) {
    return { fits: false, reason: 'Not enough lot width for even one parking stall.', stalls: [] }
  }

  const depthOneRow = stallD + aisleD
  const depthTwoRows = stallD * 2 + aisleD

  let rows = 0
  if (availableDepth >= depthTwoRows) rows = 2
  else if (availableDepth >= depthOneRow) rows = 1

  if (rows === 0) {
    return { fits: false, reason: 'Not enough rear yard depth for parking + aisle.', stalls: [] }
  }

  const capacity = rows * stallsPerRow
  if (spaces > capacity) {
    return { fits: false, reason: `Only ${capacity} spaces fit in the rear yard layout.`, stalls: [] }
  }

  const usedStallsPerRow = Math.min(stallsPerRow, spaces)
  const totalWidthUsed = usedStallsPerRow * stallW
  const xOffset = (availableWidth - totalWidthUsed) / 2

  const stalls: Rect[] = []

  // Rear row at the back property line.
  const rearRowZ1 = zEnd
  const rearRowZ0 = rearRowZ1 - stallD

  let frontRowZ0 = 0
  let frontRowZ1 = 0
  let aisle: Rect | undefined

  if (rows === 2) {
    const aisleZ1 = rearRowZ0
    const aisleZ0 = aisleZ1 - aisleD

    frontRowZ1 = aisleZ0
    frontRowZ0 = frontRowZ1 - stallD

    aisle = {
      x0: xMin + xOffset,
      x1: xMin + xOffset + totalWidthUsed,
      z0: aisleZ0,
      z1: aisleZ1,
    }
  } else {
    // Aisle in front of the rear row.
    const aisleZ0 = rearRowZ0 - aisleD
    const aisleZ1 = rearRowZ0
    aisle = {
      x0: xMin + xOffset,
      x1: xMin + xOffset + totalWidthUsed,
      z0: aisleZ0,
      z1: aisleZ1,
    }
  }

  // Ensure we actually start behind the building.
  if (rearRowZ0 < zStart || (rows === 2 && frontRowZ0 < zStart) || (aisle && aisle.z0 < zStart)) {
    return { fits: false, reason: 'Rear yard depth is constrained by building placement.', stalls: [] }
  }

  let remaining = spaces

  function pushRow(rowZ0: number, rowZ1: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      stalls.push({
        x0: xMin + xOffset + i * stallW,
        x1: xMin + xOffset + (i + 1) * stallW,
        z0: rowZ0,
        z1: rowZ1,
      })
    }
  }

  // Fill rear row first.
  const rearCount = Math.min(usedStallsPerRow, remaining)
  pushRow(rearRowZ0, rearRowZ1, rearCount)
  remaining -= rearCount

  if (rows === 2 && remaining > 0) {
    const frontCount = Math.min(usedStallsPerRow, remaining)
    pushRow(frontRowZ0, frontRowZ1, frontCount)
    remaining -= frontCount
  }

  return { fits: remaining === 0, stalls, aisle }
}

