import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Mountains } from './mansion/Mountains'
import { MainLiving } from './mansion/MainLiving'
import { ArrivalAxis } from './mansion/ArrivalAxis'
import { WestWing } from './mansion/WestWing'
import { IndoorGarden } from './mansion/IndoorGarden'
import { Tower } from './mansion/Tower'
import { EngawaTerrace } from './mansion/EngawaTerrace'
import { OnsenPlatform } from './mansion/OnsenPlatform'
import { Orbs } from './mansion/Orbs'

type OpacityCarryingMaterial = THREE.Material & { opacity: number }

interface HokkaidoMansionProps {
  // Shared fade-in opacity ref driven by EntrySequence (0 → 1 during
  // WORLD_FADE_IN). The mansion multiplies every material's designed opacity
  // by this factor so glass, halos, and particles all fade coherently.
  opacityRef: React.RefObject<number>
}

/**
 * The Hokkaido mansion — Loci's default world. Composes every space behind a
 * single opacity fade so the whole world breathes in together during the
 * entry sequence.
 */
export function HokkaidoMansion({ opacityRef }: HokkaidoMansionProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return
    const op = opacityRef.current ?? 0
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of materials) {
        if (!mat || !('opacity' in mat)) continue
        const m = mat as OpacityCarryingMaterial
        // Snapshot the designed opacity on first touch so the fade multiplies
        // against it instead of overwriting it.
        if (m.userData.baseOpacity === undefined) {
          m.userData.baseOpacity = m.opacity
        }
        m.opacity = m.userData.baseOpacity * op
      }
    })
  })

  return (
    <group ref={groupRef}>
      <Mountains />
      <MainLiving />
      <ArrivalAxis />
      <WestWing />
      <IndoorGarden />
      <Tower />
      <EngawaTerrace />
      <OnsenPlatform />
      <Orbs />
    </group>
  )
}
