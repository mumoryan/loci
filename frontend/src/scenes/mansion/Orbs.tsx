import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTimeOfDay } from './timeOfDay'

// Seed orb positions, one per key space. Each orb represents where a future
// note would live — notes cluster spatially near where they were created.
const SEED_POSITIONS: Array<[number, number, number]> = [
  // Main living — cluster by fire and by the low table
  [-0.5, 1.5, -3.8],
  [1.2, 1.6, 0.6],
  [2.8, 1.4, -1.2],
  // West wing reading alcove
  [-15.2, 1.5, 13.3],
  [-14.6, 1.3, 12.6],
  // Indoor garden — low ceiling, orbs ride just under the beams
  [13.0, 1.5, 0.8],
  [15.2, 1.4, -1.2],
  // Tower — one per level you can stand on
  [24, 2.3, -1.5],
  [24.2, 6.4, -2.5],
  [24, 10.5, -2],
  [23.6, 14.5, -1.8],
  // Engawa terrace
  [3.0, 1.6, -10.0],
  // Onsen — sit with your thoughts
  [24, 0.8, -18],
  // Glass hallway
  [0, 1.5, 13],
]

const ORB_COUNT = SEED_POSITIONS.length
const DRIFT_AMPLITUDE = 0.02
const PROXIMITY_FULL = 2 // metres — text reveal distance per spec
const PROXIMITY_NONE = 6

// Instanced orbs: each orb is a small amber core with an additive halo.
export function Orbs() {
  const register = useTimeOfDay((s) => s.register)
  const coreRef = useRef<THREE.InstancedMesh>(null)
  const haloRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()

  const phases = useMemo(() => SEED_POSITIONS.map(() => Math.random() * Math.PI * 2), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cameraWorld = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const core = coreRef.current
    const halo = haloRef.current
    if (!core || !halo) return
    const t = clock.getElapsedTime()
    camera.getWorldPosition(cameraWorld)

    for (let i = 0; i < ORB_COUNT; i++) {
      const [x, y, z] = SEED_POSITIONS[i]
      const phase = phases[i]
      // Small sinusoidal drift — alive but not distracting
      const dx = Math.sin(t * 0.4 + phase) * DRIFT_AMPLITUDE * 4
      const dy = Math.sin(t * 0.6 + phase * 1.3) * DRIFT_AMPLITUDE * 3
      const dz = Math.cos(t * 0.35 + phase * 0.7) * DRIFT_AMPLITUDE * 4

      const px = x + dx
      const py = y + dy
      const pz = z + dz

      // Proximity falloff — brighter as the user approaches
      const dist = cameraWorld.distanceTo(new THREE.Vector3(px, py, pz))
      const proximity = Math.max(
        0,
        Math.min(1, (PROXIMITY_NONE - dist) / (PROXIMITY_NONE - PROXIMITY_FULL)),
      )

      // Core — constant size, slight pulse
      dummy.position.set(px, py, pz)
      const corePulse = 1 + Math.sin(t * 1.2 + phase) * 0.05
      dummy.scale.setScalar(corePulse * (0.6 + proximity * 0.6))
      dummy.updateMatrix()
      core.setMatrixAt(i, dummy.matrix)

      // Halo — grows with proximity for fake bloom effect
      const haloScale = 1.5 + proximity * 2.5 + Math.sin(t * 0.9 + phase) * 0.1
      dummy.scale.setScalar(haloScale)
      dummy.updateMatrix()
      halo.setMatrixAt(i, dummy.matrix)
    }
    core.instanceMatrix.needsUpdate = true
    halo.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* Core — small emissive sphere */}
      <instancedMesh ref={coreRef} args={[undefined, undefined, ORB_COUNT]}>
        <sphereGeometry args={[0.06, 12, 10]} />
        <meshBasicMaterial
          color={register.orbWarm}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      {/* Halo — larger, low-opacity additive billboard */}
      <instancedMesh ref={haloRef} args={[undefined, undefined, ORB_COUNT]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshBasicMaterial
          color={register.orbWarm}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  )
}
