import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 48

interface SteamParticlesProps {
  position: [number, number, number]
  width: number
  depth: number
  height: number
}

// White particles rising slowly from the onsen water. Opacity falls off
// with altitude. Additive blending — reads as steam without shaders.
export function SteamParticles({ position, width, depth, height }: SteamParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const state = useMemo(() => {
    const arr: Array<{
      x: number
      z: number
      phase: number
      speed: number
      scale: number
      driftSeed: number
    }> = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * width,
        z: (Math.random() - 0.5) * depth,
        phase: Math.random(),
        speed: 0.08 + Math.random() * 0.08,
        scale: 0.4 + Math.random() * 0.5,
        driftSeed: Math.random() * 100,
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
      const localT = (t * p.speed + p.phase) % 1
      const y = localT * height
      const driftX = Math.sin(t * 0.3 + p.driftSeed) * 0.4
      const driftZ = Math.cos(t * 0.25 + p.driftSeed) * 0.4
      dummy.position.set(p.x + driftX, y, p.z + driftZ)
      const widthScale = p.scale * (1 + localT * 0.8)
      dummy.scale.setScalar(widthScale)
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
      <sphereGeometry args={[0.6, 6, 5]} />
      <meshBasicMaterial
        color={'#d0d8e0'}
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
