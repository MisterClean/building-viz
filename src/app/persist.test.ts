import { decodeState, encodeState } from './persist'
import { getDefaultState } from './store'

it('round-trips URL state', () => {
  const state = getDefaultState()
  const encoded = encodeState(state)
  const decoded = decodeState(encoded)
  expect(decoded).toEqual(state)
})

it('falls back when referenced ids are missing', () => {
  const state = getDefaultState()
  state.scenarioA.rulesetId = 'nope'
  state.scenarioA.presetId = 'nope'
  const decoded = decodeState(encodeState(state))
  expect(decoded?.scenarioA.rulesetId).toBe('sample_current')
  expect(decoded?.scenarioA.presetId).toBe('two_flat')
})

