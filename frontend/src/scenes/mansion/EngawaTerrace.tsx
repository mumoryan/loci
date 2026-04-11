import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'

// Engawa terrace — north exterior deck off the main living sliding glass
// panel. 16w x 5d. Weathered deck wood underneath a thin layer of snow.
// No railing on the cliff edge.
export function EngawaTerrace() {
  const register = useTimeOfDay((s) => s.register)
  const e = MANSION.engawa

  return (
    <group position={e.center}>
      {/* Deck wood base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[e.width, e.depth]} />
        <meshBasicMaterial color={register.deckWood} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* Deck plank lines — thin dark strips running east-west */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -e.depth / 2 + 0.5 + i * 0.9]}>
          <planeGeometry args={[e.width, 0.04]} />
          <meshBasicMaterial color={'#1a120a'} transparent side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Snow accumulation — slightly elevated plane, covers most of the deck,
          thinner near the glass wall (south edge) where it's more sheltered */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0.3]}>
        <planeGeometry args={[e.width - 0.6, e.depth - 0.8]} />
        <meshBasicMaterial
          color={register.snow}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Snow drifts — two thicker patches at the corners */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-e.width / 2 + 1.2, 0.08, -e.depth / 2 + 1]}>
        <planeGeometry args={[2.2, 2]} />
        <meshBasicMaterial
          color={register.snow}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[e.width / 2 - 1.2, 0.08, -e.depth / 2 + 1]}>
        <planeGeometry args={[2.2, 2]} />
        <meshBasicMaterial
          color={register.snow}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Thin ambient strip of cliff rock just beyond the deck — north edge drop-off hint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -e.depth / 2 - 0.2]}>
        <planeGeometry args={[e.width + 2, 0.4]} />
        <meshBasicMaterial
          color={register.matteStone}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
