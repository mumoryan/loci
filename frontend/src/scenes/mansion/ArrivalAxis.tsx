import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'

// Arrival axis — gondola platform → entry vestibule → glass hallway.
// Runs south-to-north along the +Z axis. You walk toward the mountains.
export function ArrivalAxis() {
  const register = useTimeOfDay((s) => s.register)
  const v = MANSION.entryVestibule
  const h = MANSION.glassHallway
  const g = MANSION.gondolaPlatform

  return (
    <group>
      {/* ==================== GLASS HALLWAY ==================== */}
      <group position={h.center}>
        {/* Floor — slate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[h.width, h.depth]} />
          <meshBasicMaterial color={register.slate} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Ceiling — walnut */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h.height, 0]}>
          <planeGeometry args={[h.width, h.depth]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* East glass wall */}
        <mesh position={[h.width / 2, h.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[h.depth, h.height]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* West glass wall — split to leave room for west wing link archway */}
        {/* West wing link archway is at z=0 (the hallway centre), 2u wide, full height */}
        <mesh position={[-h.width / 2, h.height / 2, -h.depth / 4 - 1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[h.depth / 2 - 2, h.height]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[-h.width / 2, h.height / 2, h.depth / 4 + 1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[h.depth / 2 - 2, h.height]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* Lintel over west wing arch — walnut strip */}
        <mesh position={[-h.width / 2, h.height - 0.6, 0]}>
          <boxGeometry args={[0.1, 1.2, 2]} />
          <meshBasicMaterial color={register.walnut} transparent />
        </mesh>
        {/* Recessed floor strip along hallway */}
        <mesh position={[h.width / 2 - 0.15, 0.05, 0]}>
          <boxGeometry args={[0.08, 0.06, h.depth - 0.4]} />
          <meshBasicMaterial
            color={register.recessedWarmWhite}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[-h.width / 2 + 0.15, 0.05, 0]}>
          <boxGeometry args={[0.08, 0.06, h.depth - 0.4]} />
          <meshBasicMaterial
            color={register.recessedWarmWhite}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ==================== WEST WING GLASS LINK ==================== */}
      {/* Short glass corridor from hallway west opening to west wing east wall.
          Runs from x=-2 (hallway west wall) to x=-11 (west wing east wall),
          centered on z=13 (hallway centre). */}
      <group position={[-6.5, 0, 13]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9, 2.2]} />
          <meshBasicMaterial color={register.slate} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Glass roof */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
          <planeGeometry args={[9, 2.2]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* Glass side walls */}
        <mesh position={[0, 1.5, 1.1]}>
          <planeGeometry args={[9, 3]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 1.5, -1.1]}>
          <planeGeometry args={[9, 3]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ==================== ENTRY VESTIBULE ==================== */}
      <group position={v.center}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[v.width, v.depth]} />
          <meshBasicMaterial color={register.slate} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, v.height, 0]}>
          <planeGeometry args={[v.width, v.depth]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* East wall */}
        <mesh position={[v.width / 2, v.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[v.depth, v.height]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* West wall */}
        <mesh position={[-v.width / 2, v.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[v.depth, v.height]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* North wall — opens to hallway, build as two side strips + lintel */}
        <mesh position={[-v.width / 2 + 0.75, v.height / 2, -v.depth / 2]}>
          <planeGeometry args={[1.5, v.height]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[v.width / 2 - 0.75, v.height / 2, -v.depth / 2]}>
          <planeGeometry args={[1.5, v.height]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, v.height - 0.75, -v.depth / 2]}>
          <planeGeometry args={[2, 1.5]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* South wall — contains the front door (slightly offset dark wood) */}
        <mesh position={[-v.width / 2 + 1, v.height / 2, v.depth / 2]}>
          <planeGeometry args={[2, v.height]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[v.width / 2 - 1, v.height / 2, v.depth / 2]}>
          <planeGeometry args={[2, v.height]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Front door panel — dark recessed wood */}
        <mesh position={[0, 1.1, v.depth / 2 - 0.03]}>
          <planeGeometry args={[1, 2.2]} />
          <meshBasicMaterial color={register.matteStone} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Lintel over front door */}
        <mesh position={[0, v.height - 0.4, v.depth / 2]}>
          <planeGeometry args={[1, 1.2]} />
          <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Recessed warm-white strip */}
        <mesh position={[0, 0.05, v.depth / 2 - 0.3]}>
          <boxGeometry args={[v.width - 0.6, 0.06, 0.08]} />
          <meshBasicMaterial
            color={register.recessedWarmWhite}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ==================== GONDOLA PLATFORM ==================== */}
      <group position={g.center}>
        {/* Deck — brushed steel + slate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[g.width, g.depth]} />
          <meshBasicMaterial color={register.gondolaSteel} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Four steel columns */}
        {[
          [-g.width / 2 + 0.2, 0, -g.depth / 2 + 0.2],
          [g.width / 2 - 0.2, 0, -g.depth / 2 + 0.2],
          [-g.width / 2 + 0.2, 0, g.depth / 2 - 0.2],
          [g.width / 2 - 0.2, 0, g.depth / 2 - 0.2],
        ].map(([cx, cy, cz], i) => (
          <mesh key={i} position={[cx, cy + g.height / 2, cz]}>
            <boxGeometry args={[0.2, g.height, 0.2]} />
            <meshBasicMaterial color={register.steelFrame} transparent />
          </mesh>
        ))}
        {/* Glass roof */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, g.height, 0]}>
          <planeGeometry args={[g.width, g.depth]} />
          <meshBasicMaterial
            color={register.glassTint}
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* Gondola car — boxy, glass sides, offset to south end */}
        <group position={[0, 1.0, g.depth / 2 - 1.5]}>
          <mesh>
            <boxGeometry args={[1.6, 2, 2.2]} />
            <meshBasicMaterial
              color={register.gondolaSteel}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Glass windows */}
          <mesh position={[0.81, 0.1, 0]}>
            <planeGeometry args={[1.8, 1.2]} />
            <meshBasicMaterial
              color={register.glassTint}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[-0.81, 0.1, 0]}>
            <planeGeometry args={[1.8, 1.2]} />
            <meshBasicMaterial
              color={register.glassTint}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Top attachment + cable stub */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshBasicMaterial color={register.steelFrame} transparent />
          </mesh>
        </group>
        {/* Cable — long thin cylinder disappearing into the valley */}
        <mesh position={[0, 2.3, g.depth / 2 - 1.5]} rotation={[Math.PI / 6, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 60, 6]} />
          <meshBasicMaterial color={register.steelFrame} transparent />
        </mesh>
      </group>
    </group>
  )
}
