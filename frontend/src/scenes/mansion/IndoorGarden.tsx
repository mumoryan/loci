import { useMemo } from 'react'
import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'

// Indoor garden — the hinge space between main living and tower base.
// Low ceiling (3u) makes it feel compressed and intimate. Moss, bamboo, and
// a shallow water channel. The only organic room in the mansion.
export function IndoorGarden() {
  const register = useTimeOfDay((s) => s.register)
  const g = MANSION.indoorGarden
  const halfW = g.width / 2
  const halfD = g.depth / 2

  // Deterministic bamboo stalk positions
  const bambooStalks = useMemo(
    () =>
      [
        [-3, 0, -1.5],
        [-2.2, 0, 2.2],
        [-1.2, 0, -2.6],
        [0.8, 0, 2.4],
        [1.8, 0, -1.8],
        [3.2, 0, 1.2],
      ] as Array<[number, number, number]>,
    [],
  )

  return (
    <group position={g.center}>
      {/* Stone base floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[g.width, g.depth]} />
        <meshBasicMaterial color={register.gardenStone} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* Moss patches — slight elevation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.005, 1]}>
        <planeGeometry args={[4.5, 3]} />
        <meshBasicMaterial color={register.moss} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.2, 0.005, -1.4]}>
        <planeGeometry args={[3.8, 2.6]} />
        <meshBasicMaterial color={register.moss} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Stone path — linear dark stone running west-east through the garden */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[g.width, 1.1]} />
        <meshBasicMaterial color={register.matteStone} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Shallow water channel — thin dark plane running north-south */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.02, 0]}>
        <planeGeometry args={[0.6, g.depth - 1]} />
        <meshBasicMaterial
          color={register.onsenWater}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bamboo stalks — thin vertical cylinders */}
      {bambooStalks.map(([x, , z], i) => (
        <mesh key={i} position={[x, g.height / 2 - 0.2, z]}>
          <cylinderGeometry args={[0.04, 0.05, g.height - 0.4, 6]} />
          <meshBasicMaterial color={register.bamboo} transparent />
        </mesh>
      ))}

      {/* Ceiling — low, walnut */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, g.height, 0]}>
        <planeGeometry args={[g.width, g.depth]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* North wall */}
      <mesh position={[0, g.height / 2, -halfD]}>
        <planeGeometry args={[g.width, g.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, g.height / 2, halfD]}>
        <planeGeometry args={[g.width, g.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* West wall — walnut with low arch opening to main living (at z=0, 1.8 tall x 2 wide) */}
      <mesh position={[-halfW, g.height / 2, -halfD / 2 - 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[halfD - 0.5, g.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-halfW, g.height / 2, halfD / 2 + 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[halfD - 0.5, g.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-halfW, g.height - 0.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2, 1.2]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* East wall — intentionally absent. The space opens to tower base. */}

      {/* Soft warm downlight — hidden source, placed ceiling-level */}
      <mesh position={[0, g.height - 0.1, 0]}>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshBasicMaterial color={register.gardenDownlight} transparent />
      </mesh>
      <mesh position={[0, g.height - 0.5, 0]}>
        <sphereGeometry args={[0.9, 12, 10]} />
        <meshBasicMaterial
          color={register.gardenDownlight}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
