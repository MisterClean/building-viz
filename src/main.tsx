import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PrintApp from './print/PrintApp.tsx'

const isPrint = (() => {
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get('print') === '1'
  } catch {
    return false
  }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPrint ? <PrintApp /> : <App />}
  </StrictMode>,
)
