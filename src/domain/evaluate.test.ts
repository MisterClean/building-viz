import { LOT_PRESETS, PRESET_FORMS, RULESETS } from './presets'
import { evaluateScenario } from './evaluate'

function byId<T extends { id: string }>(arr: T[], id: string): T {
  const v = arr.find((x) => x.id === id)
  if (!v) throw new Error(`Missing preset: ${id}`)
  return v
}

it('evaluates a compliant 2-flat scenario', () => {
  const lot = byId(LOT_PRESETS, 'lot_50x150').lot
  const ruleset = byId(RULESETS, 'sample_current')
  const preset = byId(PRESET_FORMS, 'two_flat')

  const out = evaluateScenario({
    lot,
    ruleset,
    preset,
    providedParkingSpaces: 2,
    showParkingGeometry: false,
    applyCoverageDebit: false,
  })

  expect(out.violations).toHaveLength(0)
  expect(out.binding.kind).toBe('binding')
  expect(out.binding.label).toContain('Envelope width')
})

it('flags a FAR violation for an oversized preset', () => {
  const lot = byId(LOT_PRESETS, 'lot_50x150').lot
  const ruleset = byId(RULESETS, 'sample_current')
  const preset = byId(PRESET_FORMS, 'six_flat')

  const out = evaluateScenario({
    lot,
    ruleset,
    preset,
    providedParkingSpaces: 6,
    showParkingGeometry: false,
    applyCoverageDebit: false,
  })

  expect(out.violations.map((v) => v.code)).toContain('FAR')
  expect(out.binding.kind).toBe('violation')
})

