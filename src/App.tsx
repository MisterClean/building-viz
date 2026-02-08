function App() {
  return (
    <div className="h-full">
      <header className="border-b border-black/10 bg-white/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-wide text-ink">
            Building-Viz
          </div>
          <div className="text-xs text-black/60">
            Conceptual visualization, not legal advice.
          </div>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100%-52px)] max-w-7xl grid-cols-1 gap-3 p-3 md:grid-cols-[360px_1fr]">
        <aside
          data-testid="sidebar"
          className="rounded-xl border border-black/10 bg-white/60 p-4 backdrop-blur"
        >
          <h2 className="text-sm font-semibold">Scenario</h2>
          <p className="mt-1 text-xs text-black/60">
            App scaffold is in place. Next commit adds the zoning model,
            presets, and 3D viewport.
          </p>
        </aside>

        <main
          data-testid="viewport"
          className="relative overflow-hidden rounded-xl border border-black/10 bg-white/40 backdrop-blur"
        >
          <div className="absolute inset-0 grid place-items-center">
            <div className="max-w-md px-6 text-center">
              <div className="text-sm font-semibold">3D Viewport</div>
              <div className="mt-1 text-xs text-black/60">
                React Three Fiber scene lands next.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
