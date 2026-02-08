import { Canvas, useThree } from '@react-three/fiber'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
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
  const onControls = useCallback((controls: OrbitControlsHandle | null) => {
    controlsRef.current = controls
  }, [])

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
      shadows
      camera={{ position: [0, 60, 160], fov: 50, near: 0.1, far: 2000 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <fog attach="fog" args={['#e8e0d4', 200, 600]} />
      <color attach="background" args={['#e8e0d4']} />

      {/* Hemisphere light: blue sky + warm earth */}
      <hemisphereLight args={['#d4e4f7', '#a8906e', 0.6]} />

      {/* Primary sun — late morning, front-right */}
      <SunLight lotW={props.evaluation.lot.widthFt} lotD={props.evaluation.lot.depthFt} />

      {/* Weak fill from opposite side */}
      <directionalLight position={[-80, 60, -40]} intensity={0.15} />

      <Scene ui={props.ui} evaluation={props.evaluation} />

      <CameraRig preset={props.cameraPreset} evaluation={props.evaluation} controlsRef={controlsRef} />
      <OrbitControls
        onControls={onControls}
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

/** Dynamic shadow-camera sized to lot */
function SunLight(props: { lotW: number; lotD: number }) {
  const ref = useRef<THREE.DirectionalLight>(null)
  const extent = Math.max(props.lotW, props.lotD) * 0.8

  useEffect(() => {
    const light = ref.current
    if (!light) return
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.camera.left = -extent
    light.shadow.camera.right = extent
    light.shadow.camera.top = extent
    light.shadow.camera.bottom = -extent
    light.shadow.camera.near = 1
    light.shadow.camera.far = 500
    light.shadow.camera.updateProjectionMatrix()
  }, [extent])

  return (
    <directionalLight
      ref={ref}
      position={[props.lotW * 0.7, 120, -props.lotD * 0.3]}
      intensity={0.8}
      castShadow
    />
  )
}

function CameraRig(props: {
  preset: CameraPreset
  evaluation: Evaluation
  controlsRef: MutableRefObject<OrbitControlsHandle | null>
}) {
  const { camera } = useThree()
  const { evaluation, preset, controlsRef } = props

  useEffect(() => {
    const lot = evaluation.lot
    const lotCenter = new THREE.Vector3(lot.widthFt / 2, 0, lot.depthFt / 2)

    const b = evaluation.placement.footprint
    const buildingCenter = rectCenter(b)
    const buildingTarget = new THREE.Vector3(
      buildingCenter.x,
      evaluation.metrics.heightFt * 0.35,
      buildingCenter.z,
    )

    // Use lot size heuristics for camera distance.
    const d = Math.max(80, lot.depthFt * 0.8)

    if (preset === 'street') {
      // Human eye height: ~5.5 ft
      camera.position.set(lotCenter.x, 5.5, -d * 0.65)
      camera.lookAt(buildingTarget)
    } else if (preset === 'front') {
      camera.position.set(
        lotCenter.x,
        Math.max(18, evaluation.metrics.heightFt * 0.65),
        -d * 0.55,
      )
      camera.lookAt(buildingTarget)
    } else {
      camera.position.set(lotCenter.x, Math.max(120, lot.depthFt * 0.9), lotCenter.z)
      camera.lookAt(lotCenter)
    }

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(lotCenter.x, buildingTarget.y, lotCenter.z)
      controls.update()
    }
  }, [camera, controlsRef, evaluation, preset])

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0, lotCenterZ]} receiveShadow>
        <planeGeometry args={[groundW, groundD]} />
        <meshStandardMaterial color="#efe7d7" />
      </mesh>

      {/* Lot lawn surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0.03, lotCenterZ]} receiveShadow>
        <planeGeometry args={[lotW, lotD]} />
        <meshStandardMaterial color="#b8c9a0" />
      </mesh>

      {/* Street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0.01, -streetD / 2]} receiveShadow>
        <planeGeometry args={[streetW, streetD]} />
        <meshStandardMaterial color="#2f3440" />
      </mesh>

      {/* Sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lotCenterX, 0.02, -6]} receiveShadow>
        <planeGeometry args={[streetW, 12]} />
        <meshStandardMaterial color="#cfc6b5" />
      </mesh>

      {/* Curb between sidewalk and street */}
      <mesh position={[lotCenterX, 0.2, -0.2]}>
        <boxGeometry args={[streetW, 0.4, 0.6]} />
        <meshStandardMaterial color="#b8b0a2" />
      </mesh>

      {/* Lot outline */}
      <Line points={lotOutlinePts} color="#111827" opacity={0.65} transparent lineWidth={1} />

      {/* Property pins (survey markers at corners) */}
      <PropertyPin x={0} z={0} />
      <PropertyPin x={lotW} z={0} />
      <PropertyPin x={lotW} z={lotD} />
      <PropertyPin x={0} z={lotD} />

      {/* Envelope — dashed edges */}
      <EnvelopeEdges envelope={evaluation.envelope} />

      {/* Building mass */}
      <BuildingMass
        buildingCenter={buildingCenter}
        buildingW={buildingW}
        buildingD={buildingD}
        buildingH={buildingH}
        stories={evaluation.preset.stories}
        floorToFloorFt={evaluation.preset.floorToFloorFt}
        kind={evaluation.preset.kind}
        units={evaluation.preset.units}
        hasViolation={hasViolation}
      />

      {/* Parking geometry */}
      {evaluation.parkingLayout.stalls.length > 0 ? (
        <ParkingGroup
          parkingLayout={evaluation.parkingLayout}
          buildingFootprint={building}
          lotW={lotW}
        />
      ) : null}

      {/* Neighbors */}
      {ui.showNeighbors ? (
        <group>
          <NeighborHouse x={-18} z={40} w={26} d={36} h={22} roofH={6} />
          <NeighborHouse x={lotW + 18} z={42} w={30} d={42} h={26} roofH={8} />
          <NeighborHouse x={lotCenterX} z={-70} w={24} d={34} h={18} roofH={5} />
        </group>
      ) : null}

      {/* Trees */}
      {ui.showTrees ? (
        <group>
          <Tree x={lotCenterX - 20} z={-2} scale={1.0} />
          <Tree x={lotCenterX} z={-2} scale={1.15} />
          <Tree x={lotCenterX + 20} z={-2} scale={0.9} />
        </group>
      ) : null}
    </group>
  )
}

/** Small orange cylinder at lot corners (survey marker convention) */
function PropertyPin(props: { x: number; z: number }) {
  return (
    <mesh position={[props.x, 0.3, props.z]}>
      <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
      <meshStandardMaterial color="#e87830" roughness={0.6} />
    </mesh>
  )
}

/** Dashed-line envelope using EdgesGeometry */
function EnvelopeEdges(props: { envelope: Evaluation['envelope'] }) {
  const { envelope } = props
  const envW = envelope.x1 - envelope.x0
  const envD = envelope.z1 - envelope.z0
  const envH = envelope.maxHeightFt

  const lineRef = useRef<THREE.LineSegments>(null)

  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(envW, envH, envD)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [envW, envH, envD])

  const dashedMat = useMemo(
    () =>
      new THREE.LineDashedMaterial({
        color: '#6b7280',
        transparent: true,
        opacity: 0.4,
        dashSize: 2,
        gapSize: 1.5,
      }),
    [],
  )

  // computeLineDistances is required for dashed lines
  useEffect(() => {
    const line = lineRef.current
    if (line) line.computeLineDistances()
  }, [edgesGeo])

  return (
    <lineSegments
      ref={lineRef}
      geometry={edgesGeo}
      material={dashedMat}
      position={[
        (envelope.x0 + envelope.x1) / 2,
        envH / 2,
        (envelope.z0 + envelope.z1) / 2,
      ]}
    />
  )
}

/** Building mass with floor lines, roof parapet, violation overlay, and townhouse party walls */
function BuildingMass(props: {
  buildingCenter: { x: number; z: number }
  buildingW: number
  buildingD: number
  buildingH: number
  stories: number
  floorToFloorFt: number
  kind: string
  units: number
  hasViolation: boolean
}) {
  const { buildingCenter, buildingW, buildingD, buildingH, stories, floorToFloorFt, kind, units, hasViolation } = props
  const parapetH = 0.6

  return (
    <group>
      {/* Main building body */}
      <mesh position={[buildingCenter.x, buildingH / 2, buildingCenter.z]} castShadow receiveShadow>
        <boxGeometry args={[buildingW, buildingH, buildingD]} />
        <meshStandardMaterial color="#e8e2d8" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Floor lines — thin horizontal bands at each intermediate story */}
      {stories > 1
        ? Array.from({ length: stories - 1 }, (_, i) => {
            const y = (i + 1) * floorToFloorFt
            return (
              <mesh key={`floor-${i}`} position={[buildingCenter.x, y, buildingCenter.z]}>
                <boxGeometry args={[buildingW + 0.2, 0.15, buildingD + 0.2]} />
                <meshBasicMaterial color="#9a9080" />
              </mesh>
            )
          })
        : null}

      {/* Roof parapet */}
      <mesh position={[buildingCenter.x, buildingH + parapetH / 2, buildingCenter.z]} castShadow>
        <boxGeometry args={[buildingW + 0.4, parapetH, buildingD + 0.4]} />
        <meshStandardMaterial color="#d5cfc5" roughness={0.9} />
      </mesh>

      {/* Townhouse party walls */}
      {kind === 'townhouse' && units > 1
        ? Array.from({ length: units - 1 }, (_, i) => {
            const unitW = buildingW / units
            const wallX = buildingCenter.x - buildingW / 2 + (i + 1) * unitW
            return (
              <mesh key={`party-${i}`} position={[wallX, buildingH / 2, buildingCenter.z]}>
                <boxGeometry args={[0.15, buildingH + 0.1, buildingD + 0.15]} />
                <meshBasicMaterial color="#9a9080" />
              </mesh>
            )
          })
        : null}

      {/* Violation overlay — translucent red on top of normal-colored building */}
      {hasViolation ? (
        <mesh position={[buildingCenter.x, buildingH / 2, buildingCenter.z]}>
          <boxGeometry args={[buildingW + 0.1, buildingH + 0.1, buildingD + 0.1]} />
          <meshStandardMaterial color="#dc2626" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  )
}

/** Parking: asphalt stalls with white borders, aisle, and driveway */
function ParkingGroup(props: {
  parkingLayout: Evaluation['parkingLayout']
  buildingFootprint: { x0: number; x1: number; z0: number; z1: number }
  lotW: number
}) {
  const { parkingLayout, buildingFootprint, lotW } = props

  // Driveway: grey strip from lot front edge to parking aisle area
  const driveX = lotW / 2
  const driveZ0 = 0
  const driveZ1 = buildingFootprint.z1 + 2 // extends past building to where parking starts
  const driveW = 12

  return (
    <group>
      {/* Driveway */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[driveX, 0.04, (driveZ0 + driveZ1) / 2]}
        receiveShadow
      >
        <planeGeometry args={[driveW, driveZ1 - driveZ0]} />
        <meshStandardMaterial color="#8a8580" />
      </mesh>

      {/* Stalls — white border underneath, dark asphalt on top */}
      {parkingLayout.stalls.map((s, idx) => {
        const w = rectWidth(s)
        const d = rectDepth(s)
        const c = rectCenter(s)
        const inset = 0.15
        return (
          <group key={idx}>
            {/* White border */}
            <mesh position={[c.x, 0.05, c.z]}>
              <boxGeometry args={[w, 0.1, d]} />
              <meshStandardMaterial color="#e8e4e0" />
            </mesh>
            {/* Asphalt top */}
            <mesh position={[c.x, 0.07, c.z]} receiveShadow>
              <boxGeometry args={[w - inset * 2, 0.1, d - inset * 2]} />
              <meshStandardMaterial color="#4a4845" />
            </mesh>
          </group>
        )
      })}

      {/* Aisle */}
      {parkingLayout.aisle ? (
        <mesh
          position={[
            (parkingLayout.aisle.x0 + parkingLayout.aisle.x1) / 2,
            0.04,
            (parkingLayout.aisle.z0 + parkingLayout.aisle.z1) / 2,
          ]}
          receiveShadow
        >
          <boxGeometry
            args={[
              rectWidth(parkingLayout.aisle),
              0.08,
              rectDepth(parkingLayout.aisle),
            ]}
          />
          <meshStandardMaterial color="#555048" transparent opacity={0.8} />
        </mesh>
      ) : null}
    </group>
  )
}

/** Neighbor house with pitched roof */
function NeighborHouse(props: { x: number; z: number; w: number; d: number; h: number; roofH: number }) {
  const { x, z, w, d, h, roofH } = props

  const roofShape = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, 0)
    shape.lineTo(0, roofH)
    shape.lineTo(w / 2, 0)
    shape.closePath()
    return shape
  }, [w, roofH])

  const roofGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(roofShape, {
      steps: 1,
      depth: d,
      bevelEnabled: false,
    })
    return geo
  }, [roofShape, d])

  return (
    <group position={[x, 0, z]}>
      {/* House body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#c8c0b4" roughness={0.9} />
      </mesh>
      {/* Pitched roof */}
      <mesh
        geometry={roofGeo}
        position={[0, h, -d / 2]}
        castShadow
      >
        <meshStandardMaterial color="#8a7e70" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Tree with cone canopy and varied scale */
function Tree(props: { x: number; z: number; scale: number }) {
  return (
    <group position={[props.x, 0, props.z]} scale={props.scale}>
      {/* Trunk */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 8, 8]} />
        <meshStandardMaterial color="#7c6f58" roughness={1} />
      </mesh>
      {/* Canopy — cone instead of sphere */}
      <mesh position={[0, 11, 0]} castShadow>
        <coneGeometry args={[4, 10, 8]} />
        <meshStandardMaterial color="#6b8c5a" roughness={0.9} />
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
