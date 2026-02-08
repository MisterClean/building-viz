import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import type { MutableRefObject } from 'react'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'

export type OrbitControlsHandle = OrbitControlsImpl

type Props = {
  enabled: boolean
  enableDamping?: boolean
  dampingFactor?: number
  maxPolarAngle?: number
  minDistance?: number
  maxDistance?: number
  controlsRef?: MutableRefObject<OrbitControlsHandle | null>
}

export function OrbitControls(props: Props) {
  const { camera, gl } = useThree()

  const controls = useMemo(() => new OrbitControlsImpl(camera, gl.domElement), [camera, gl.domElement])

  useEffect(() => {
    controls.enabled = props.enabled
    controls.enableDamping = props.enableDamping ?? false
    controls.dampingFactor = props.dampingFactor ?? 0.1
    if (props.maxPolarAngle != null) controls.maxPolarAngle = props.maxPolarAngle
    if (props.minDistance != null) controls.minDistance = props.minDistance
    if (props.maxDistance != null) controls.maxDistance = props.maxDistance

    if (props.controlsRef) props.controlsRef.current = controls

    return () => {
      if (props.controlsRef && props.controlsRef.current === controls) props.controlsRef.current = null
      controls.dispose()
    }
  }, [
    controls,
    props.controlsRef,
    props.dampingFactor,
    props.enableDamping,
    props.enabled,
    props.maxDistance,
    props.maxPolarAngle,
    props.minDistance,
  ])

  useFrame(() => {
    if (!props.enabled) return
    controls.update()
  })

  return null
}

