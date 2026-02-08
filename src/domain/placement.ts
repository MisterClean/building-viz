import type { Envelope } from './envelope'
import type { PresetForm } from './types'
import type { Rect } from './geometry'

export type BuildingPlacement = {
  footprint: Rect
}

export function placePresetInEnvelope(args: {
  envelope: Envelope
  preset: PresetForm
  mode?: 'frontAligned'
}): BuildingPlacement {
  const { envelope, preset } = args

  const w = preset.footprintWidthFt
  const d = preset.footprintDepthFt

  const envW = envelope.x1 - envelope.x0
  const envD = envelope.z1 - envelope.z0

  const xCenter = (envelope.x0 + envelope.x1) / 2
  const x0 = xCenter - w / 2
  const x1 = xCenter + w / 2

  // Default to front-aligned placement for a more realistic yard/parking situation.
  const z0 =
    d <= envD ? envelope.z0 : (envelope.z0 + envelope.z1) / 2 - d / 2
  const z1 = z0 + d

  return { footprint: { x0, x1, z0, z1 } }
}

