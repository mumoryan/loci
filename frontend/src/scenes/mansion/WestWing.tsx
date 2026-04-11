import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'

// West wing reading alcove — 8w x 10d x 4h. The low ceiling is intentional:
// compression after the grandeur of the main living room. Accessed from the
// glass hallway via the west glass link.
export function WestWing() {
  const register = useTimeOfDay((s) => s.register)
  const w = MANSION.westWing
  const halfW = w.width / 2
  const halfD = w.depth / 2

  return (
    <group position={w.center}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w.width, w.depth]} />
        <meshBasicMaterial color={register.slate} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* Ceiling — low, walnut */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, w.height, 0]}>
        <planeGeometry args={[w.width, w.depth]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* West wall */}
      <mesh position={[-halfW, w.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[w.depth, w.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* East wall — split around the link archway (on z=0, leading back east) */}
      <mesh position={[halfW, w.height / 2, -halfD / 2 - 1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[halfD - 1, w.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[halfW, w.height / 2, halfD / 2 + 1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[halfD - 1, w.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[halfW, w.height - 0.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2, 1.2]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* North wall */}
      <mesh position={[0, w.height / 2, -halfD]}>
        <planeGeometry args={[w.width, w.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, w.height / 2, halfD]}>
        <planeGeometry args={[w.width, w.height]} />
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Reading chair — low-slung, facing the north wall (quiet space) */}
      <group position={[0, 0, 1]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.9]} />
          <meshBasicMaterial color={register.walnutFireSide} transparent />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.75, 0.4]}>
          <boxGeometry args={[0.8, 1.1, 0.1]} />
          <meshBasicMaterial color={register.walnutFireSide} transparent />
        </mesh>
      </group>

      {/* Side table with single book */}
      <mesh position={[0.7, 0.3, 0.7]}>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshBasicMaterial color={register.walnut} transparent />
      </mesh>
      <mesh position={[0.7, 0.62, 0.7]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.25, 0.05, 0.18]} />
        <meshBasicMaterial color={register.walnutFireSide} transparent />
      </mesh>

      {/* Recessed warm floor strip along north wall */}
      <mesh position={[0, 0.05, -halfD + 0.15]}>
        <boxGeometry args={[w.width - 0.4, 0.06, 0.08]} />
        <meshBasicMaterial
          color={register.recessedWarmWhite}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
