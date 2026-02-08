import type { Evaluation } from '../domain/evaluate'
import { rectCenter, rectDepth, rectWidth } from '../domain/geometry'

export function ParkingDiagram(props: { evaluation: Evaluation }) {
  const lot = props.evaluation.lot
  const stalls = props.evaluation.parkingLayout.stalls
  const aisle = props.evaluation.parkingLayout.aisle
  const b = props.evaluation.placement.footprint
  const env = props.evaluation.envelope

  const vb = `0 0 ${lot.widthFt} ${lot.depthFt}`
  const buildingC = rectCenter(b)

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-black/60">
        Parking Diagram (Plan)
      </div>
      <svg className="mt-2 h-44 w-full" viewBox={vb} preserveAspectRatio="xMidYMid meet">
        <rect x={0} y={0} width={lot.widthFt} height={lot.depthFt} fill="#fbfaf7" stroke="#111827" strokeOpacity={0.25} />

        {/* Envelope */}
        <rect
          x={env.x0}
          y={env.z0}
          width={env.x1 - env.x0}
          height={env.z1 - env.z0}
          fill="none"
          stroke="#0b1220"
          strokeOpacity={0.35}
          strokeDasharray="2 2"
        />

        {/* Building */}
        <rect
          x={b.x0}
          y={b.z0}
          width={rectWidth(b)}
          height={rectDepth(b)}
          fill="#0b1220"
          fillOpacity={0.25}
          stroke="#0b1220"
          strokeOpacity={0.55}
        />
        <circle cx={buildingC.x} cy={buildingC.z} r={1.4} fill="#0b1220" fillOpacity={0.55} />

        {/* Aisle */}
        {aisle ? (
          <rect
            x={aisle.x0}
            y={aisle.z0}
            width={rectWidth(aisle)}
            height={rectDepth(aisle)}
            fill="#1d4ed8"
            fillOpacity={0.12}
            stroke="#1d4ed8"
            strokeOpacity={0.25}
          />
        ) : null}

        {/* Stalls */}
        {stalls.map((s, idx) => (
          <rect
            key={idx}
            x={s.x0}
            y={s.z0}
            width={rectWidth(s)}
            height={rectDepth(s)}
            fill="#2563eb"
            fillOpacity={0.32}
            stroke="#2563eb"
            strokeOpacity={0.6}
          />
        ))}
      </svg>

      {props.evaluation.parkingLayout.fits ? null : (
        <div className="mt-2 text-[11px] text-red-800">
          {props.evaluation.parkingLayout.reason ?? 'Parking layout does not fit.'}
        </div>
      )}
    </div>
  )
}

