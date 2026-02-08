import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'

export type OrbitControlsHandle = OrbitControlsImpl

type Props = {
  enabled: boolean
  enableDamping?: boolean
  dampingFactor?: number
  maxPolarAngle?: number
  minDistance?: number
  maxDistance?: number
  onControls?: (controls: OrbitControlsHandle | null) => void
}

export function OrbitControls(props: Props) {
  const { camera, gl } = useThree()
  const {
    enabled,
    enableDamping,
    dampingFactor,
    maxPolarAngle,
    minDistance,
    maxDistance,
    onControls,
  } = props
  const domElement = gl.domElement

  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  useEffect(() => {
    const controls = new OrbitControlsImpl(camera, domElement)
    controlsRef.current = controls
    onControls?.(controls)

    return () => {
      controls.dispose()
      controlsRef.current = null
      onControls?.(null)
    }
  }, [camera, domElement, onControls])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    controls.enabled = enabled
    controls.enableDamping = enableDamping ?? false
    controls.dampingFactor = dampingFactor ?? 0.1
    if (maxPolarAngle != null) controls.maxPolarAngle = maxPolarAngle
    if (minDistance != null) controls.minDistance = minDistance
    if (maxDistance != null) controls.maxDistance = maxDistance
  }, [
    dampingFactor,
    enableDamping,
    enabled,
    maxDistance,
    maxPolarAngle,
    minDistance,
  ])

  useFrame(() => {
    if (!enabled) return
    controlsRef.current?.update()
  })

  return null
}
