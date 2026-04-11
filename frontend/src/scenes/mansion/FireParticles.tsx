import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTimeOfDay } from './timeOfDay'

const PARTICLE_COUNT = 36

interface FireParticlesProps {
  position: [number, number, number]
  width: number
  depth: number
  height: number
}

// Amber instanced particles rising from the hearth. Additive blended for a
// cheap bloom feel — no post-processing, no dynamic lighting.
export function FireParticles({ position, width, depth, height }: FireParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const register = useTimeOfDay((s) => s.register)

  // Per-particle state held in refs so we don't allocate each frame.
  const state = useMemo(() => {
    const arr: Array<{
      x: number
      z: number
      phase: number
      speed: number
      scale: number
    }> = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * width,
        z: (Math.random() - 0.5) * depth,
        phase: Math.random(),
        speed: 0.25 + Math.random() * 0.25,
        scale: 0.05 + Math.random() * 0.09,
      })
    }
    return arr
  }, [width, depth])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.getElapsedTime()
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = state[i]
      // Each particle rises, loops at top, with a slight horizontal sway.
      const localT = (t * p.speed + p.phase) % 1
      const y = localT * height
      const sway = Math.sin(t * 2 + p.phase * 10) * 0.06
      dummy.position.set(p.x + sway, y, p.z)
      // Fade-out via scale near the top (no per-instance opacity with basic mat)
      const lifeScale = p.scale * (1 - Math.max(0, (localT - 0.7) / 0.3) * 0.9)
      dummy.scale.setScalar(lifeScale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      position={position}
    >
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial
        color={register.fire}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
