import { render, screen } from '@testing-library/react'
import { encodeState } from '../app/persist'
import { getDefaultState } from '../app/store'
import PrintApp from './PrintApp'

it('renders a print sheet when URL state is present', () => {
  const state = getDefaultState()
  const encoded = encodeState(state)
  window.history.pushState({}, '', `http://localhost:3000/?print=1&s=${encoded}`)

  render(<PrintApp />)

  expect(screen.getByText('Scenario Print Sheet')).toBeInTheDocument()
  expect(screen.getByText(/Lot:/)).toBeInTheDocument()
})

