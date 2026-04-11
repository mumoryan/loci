import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'
import { SteamParticles } from './SteamParticles'

// Onsen platform — carved rock shelf on the cliff face, accessed via bridge
// from tower L3. 12w x 10d. Dark stone basin, shallow water, rock overhang.
// The most private space in the mansion.
export function OnsenPlatform() {
  const register = useTimeOfDay((s) => s.register)
  const o = MANSION.onsen

  return (
    <group position={o.center}>
      {/* Rock shelf base — broad dark stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[o.width + 2, o.depth + 2]} />
        <meshBasicMaterial
          color={register.onsenStone}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Raised stone basin rim — a border around the water */}
      {[
        [0, 0.15, -o.depth / 2 + 1, o.width - 2, 0.3, 0.6],
        [0, 0.15, o.depth / 2 - 1, o.width - 2, 0.3, 0.6],
        [-o.width / 2 + 1, 0.15, 0, 0.6, 0.3, o.depth - 2],
        [o.width / 2 - 1, 0.15, 0, 0.6, 0.3, o.depth - 2],
      ].map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshBasicMaterial color={register.matteStone} transparent />
        </mesh>
      ))}

      {/* Water plane — inside the basin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <planeGeometry args={[o.width - 3, o.depth - 3]} />
        <meshBasicMaterial
          color={register.onsenWater}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Warm water highlight — additive, evokes the fire's warmth carried down */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        <planeGeometry args={[o.width - 3.5, o.depth - 3.5]} />
        <meshBasicMaterial
          color={register.fire}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rock overhang above — partial cover, angled forward */}
      <mesh position={[0, 5, -o.depth / 2 + 1]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[o.width + 2, 0.6, 5]} />
        <meshBasicMaterial color={register.onsenStone} transparent />
      </mesh>

      {/* Steam particles rising off the water */}
      <SteamParticles
        position={[0, 0.25, 0]}
        width={o.width - 3.5}
        depth={o.depth - 3.5}
        height={4.5}
      />
    </group>
  )
}
