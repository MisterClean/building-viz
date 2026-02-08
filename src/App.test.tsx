import { render, screen } from '@testing-library/react'
import App from './App'

it('renders the app shell', () => {
  render(<App />)
  expect(screen.getByText('Building-Viz')).toBeInTheDocument()
  expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  expect(screen.getByTestId('viewport')).toBeInTheDocument()
})

