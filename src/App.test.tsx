import { render, screen } from '@testing-library/react'
import App from './App'

it('renders the app shell', () => {
  const original = (globalThis as unknown as { WebGLRenderingContext?: unknown }).WebGLRenderingContext
  try {
    // Ensure we exercise the WebGL-less fallback path in test environments.
    Object.defineProperty(globalThis, 'WebGLRenderingContext', {
      value: undefined,
      configurable: true,
      writable: true,
    })

  render(<App />)
  expect(screen.getByText('Building-Viz')).toBeInTheDocument()
  expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  expect(screen.getByTestId('viewport')).toBeInTheDocument()
    expect(screen.getByText(/WebGL unavailable/i)).toBeInTheDocument()
  } finally {
    Object.defineProperty(globalThis, 'WebGLRenderingContext', {
      value: original,
      configurable: true,
      writable: true,
    })
  }
})
