import { LOT_PRESETS, PRESET_FORMS, RULESETS } from './presets'
import { computeEnvelope } from './envelope'
import { layoutSurfaceParking } from './parking'
import { placePresetInEnvelope } from './placement'

function byId<T extends { id: string }>(arr: T[], id: string): T {
  const v = arr.find((x) => x.id === id)
  if (!v) throw new Error(`Missing preset: ${id}`)
  return v
}

it('lays out surface parking behind a typical 2-flat', () => {
  const lot = byId(LOT_PRESETS, 'lot_50x150').lot
  const ruleset = byId(RULESETS, 'sample_current')
  const preset = byId(PRESET_FORMS, 'two_flat')

  const env = computeEnvelope(lot, ruleset)
  const placement = placePresetInEnvelope({ envelope: env, preset })

  const layout = layoutSurfaceParking({
    lot,
    behindBuildingZ: placement.footprint.z1,
    spaces: 2,
  })

  expect(layout.fits).toBe(true)
  expect(layout.stalls).toHaveLength(2)
  expect(layout.aisle).toBeDefined()
})

