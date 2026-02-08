import { Canvas, useThree } from '@react-three/fiber'
import { memo, useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import type { CameraPreset, UiConfig } from '../app/persist'
import type { Evaluation } from '../domain/evaluate'
import { rectCenter, rectDepth, rectWidth } from '../domain/geometry'
import { OrbitControls, type OrbitControlsHandle } from './OrbitControls'

function canUseWebGL(): boolean {
  if (typeof document === 'undefined') return false
  if (typeof WebGLRenderingContext === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

type Viewport3DProps = {
  label: string
  cameraPreset: CameraPreset
  ui: UiConfig
  evaluation: Evaluation
  controlsEnabled: boolean
}

export const Viewport3D = memo(function Viewport3D(props: Viewport3DProps) {
  const hasWebGL = useMemo(() => canUseWebGL(), [])
  const controlsRef = useRef<OrbitControlsHandle | null>(null)

  if (!hasWebGL) {
    return (
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div>
          <div className="text-sm font-semibold">{props.label}</div>
          <div className="mt-1 text-xs text-black/60">
            WebGL unavailable (this is expected in tests). 3D viewport requires a browser with WebGL enabled.
          </div>
        </div>
      </div>
    )
  }

  return (
    <Canvas
      shadows={false}
      camera={{ position: [0, 60, 160], fov: 50, near: 0.1, far: 2000 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[100, 160, 80]} intensity={0.8} />

      <Scene ui={props.ui} evaluation={props.evaluation} />

      <CameraRig preset={props.cameraPreset} evaluation={props.evaluation} controlsRef={controlsRef} />
      <OrbitControls
        controlsRef={controlsRef}
        enabled={props.controlsEnabled}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={20}
        maxDistance={600}
      />
    </Canvas>
  )
})

function CameraRig(props: {
  preset: CameraPreset
  evaluation: Evaluation
  controlsRef: MutableRefObject<OrbitControlsHandle | null>
}) {
  const { camera } = useThree()

  useEffect(() => {
    const lot = props.evaluation.lot
    const lotCenter = new THREE.Vector3(lot.widthFt / 2, 0, lot.depthFt / 2)

    const b = props.evaluation.placement.footprint
    const buildingCenter = rectCenter(b)
    const buildingTarget = new THREE.Vector3(
      buildingCenter.x,
      props.evaluation.metrics.heightFt * 0.35,
      buildingCenter.z,
    )

    // Use lot size heuristics for camera distance.
    const d = Math.max(80, lot.depthFt * 0.8)

    if (props.preset === 'street') {
      camera.position.set(lotCenter.x, 8, -d * 0.65)
      camera.lookAt(buildingTarget)
    } else if (props.preset === 'front') {
      camera.position.set(
        lotCenter.x,
        Math.max(18, props.evaluation.metrics.heightFt * 0.65),
        -d * 0.55,
      )
      camera.lookAt(buildingTarget)
    } else {
      camera.position.set(lotCenter.x, Math.max(120, lot.depthFt * 0.9), lotCenter.z)
      camera.lookAt(lotCenter)
    }

    const controls = props.controlsRef.current
    if (controls) {
      controls.target.set(lotCenter.x, buildingTarget.y, lotCenter.z)
      controls.update()
    }
  }, [camera, props.evaluation, props.preset])

  return null
}

function Scene(props: { ui: UiConfig; evaluation: Evaluation }) {
  const { evaluation, ui } = props

  const lotW = evaluation.lot.widthFt
  const lotD = evaluation.lot.depthFt

  const lotCenterX = lotW / 2
  const lotCenterZ = lotD / 2

  const streetW = lotW + 120
  const streetD = 60
  const groundW = lotW + 160
  const groundD = lotD + 160

  const envW = evaluation.envelope.x1 - evaluation.envelope.x0
  const envD = evaluation.envelope.z1 - evaluation.envelope.z0

  const building = evaluation.placement.footprint
  const buildingW = rectWidth(building)
  const buildingD = rectDepth(building)
  const buildingH = evaluation.metrics.heightFt
  const buildingCenter = rectCenter(building)

  const hasViolation = evaluation.violations.length > 0

  const lotOutlinePts = useMemo(
    () => [
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(lotW, 0.05, 0),
      new THREE.Vector3(lotW, 0.05, lotD),
      new THREE.Vector3(0, 0.05, lotD),
      new THREE.Vector3(0, 0.05, 0),
    ],
    [lotD, lotW],
  )

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0, lotCenterZ]}>
        <planeGeometry args={[groundW, groundD]} />
        <meshStandardMaterial color="#efe7d7" />
      </mesh>

      {/* Street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0.01, -streetD / 2]}>
        <planeGeometry args={[streetW, streetD]} />
        <meshStandardMaterial color="#2f3440" />
      </mesh>

      {/* Sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0.02, -6]}>
        <planeGeometry args={[streetW, 12]} />
        <meshStandardMaterial color="#cfc6b5" />
      </mesh>

      {/* Lot outline */}
      <Line points={lotOutlinePts} color="#111827" opacity={0.65} transparent lineWidth={1} />

      {/* Envelope wireframe */}
      <mesh
        position={[
          (evaluation.envelope.x0 + evaluation.envelope.x1) / 2,
          evaluation.envelope.maxHeightFt / 2,
          (evaluation.envelope.z0 + evaluation.envelope.z1) / 2,
        ]}
      >
        <boxGeometry args={[envW, evaluation.envelope.maxHeightFt, envD]} />
        <meshBasicMaterial color="#0b1220" wireframe transparent opacity={0.18} />
      </mesh>

      {/* Building mass */}
      <mesh position={[buildingCenter.x, buildingH / 2, buildingCenter.z]}>
        <boxGeometry args={[buildingW, buildingH, buildingD]} />
        <meshStandardMaterial color={hasViolation ? '#b91c1c' : '#0b1220'} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Parking geometry */}
      {evaluation.parkingLayout.stalls.length > 0 ? (
        <group>
          {evaluation.parkingLayout.stalls.map((s, idx) => {
            const w = rectWidth(s)
            const d = rectDepth(s)
            const c = rectCenter(s)
            return (
              <mesh key={idx} position={[c.x, 0.06, c.z]}>
                <boxGeometry args={[w, 0.12, d]} />
                <meshStandardMaterial color="#2563eb" transparent opacity={0.45} />
              </mesh>
            )
          })}
          {evaluation.parkingLayout.aisle ? (
            <mesh
              position={[
                (evaluation.parkingLayout.aisle.x0 + evaluation.parkingLayout.aisle.x1) / 2,
                0.05,
                (evaluation.parkingLayout.aisle.z0 + evaluation.parkingLayout.aisle.z1) / 2,
              ]}
            >
              <boxGeometry
                args={[
                  rectWidth(evaluation.parkingLayout.aisle),
                  0.1,
                  rectDepth(evaluation.parkingLayout.aisle),
                ]}
              />
              <meshStandardMaterial color="#1d4ed8" transparent opacity={0.22} />
            </mesh>
          ) : null}
        </group>
      ) : null}

      {/* Neighbors */}
      {ui.showNeighbors ? (
        <group>
          <NeighborHouse x={-18} z={40} />
          <NeighborHouse x={lotW + 18} z={42} />
          <NeighborHouse x={lotCenterX} z={-70} />
        </group>
      ) : null}

      {/* Trees */}
      {ui.showTrees ? (
        <group>
          <Tree x={lotCenterX - 20} z={-2} />
          <Tree x={lotCenterX} z={-2} />
          <Tree x={lotCenterX + 20} z={-2} />
        </group>
      ) : null}
    </group>
  )
}

function NeighborHouse(props: { x: number; z: number }) {
  return (
    <mesh position={[props.x, 12.5, props.z]}>
      <boxGeometry args={[28, 25, 40]} />
      <meshStandardMaterial color="#64748b" roughness={0.9} />
    </mesh>
  )
}

function Tree(props: { x: number; z: number }) {
  return (
    <group position={[props.x, 0, props.z]}>
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 8, 10]} />
        <meshStandardMaterial color="#7c6f58" roughness={1} />
      </mesh>
      <mesh position={[0, 10, 0]}>
        <sphereGeometry args={[3.6, 10, 10]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>
    </group>
  )
}

// three-stdlib line component wrapper (keeps the scene readable)
function Line(props: { points: THREE.Vector3[]; color: string; opacity: number; transparent: boolean; lineWidth: number }) {
  // Avoid importing drei/Line to keep bundle surface area smaller for MVP.
  // We use a simple THREE.Line here.
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(props.points), [props.points])
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(props.color),
        transparent: props.transparent,
        opacity: props.opacity,
      }),
    [props.color, props.opacity, props.transparent],
  )

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material])

  return <primitive object={line} />
}
