import { useMemo } from 'react'
import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'
import { quadGeometry, roofHeightAt } from './geometry'
import { FireParticles } from './FireParticles'

// Main living — the heart of the mansion.
// Dimensions from spec: 18w x 14d, floor at y=0, asymmetric roof peaking at
// y=12 over the west (left) side and dropping to y=8 at the east side.
export function MainLiving() {
  const register = useTimeOfDay((s) => s.register)

  const ml = MANSION.mainLiving
  const halfW = ml.width / 2 // 9
  const halfD = ml.depth / 2 // 7
  const peakY = ml.roofPeakHeight // 12
  const lowY = ml.height // 8
  const leftX = -halfW
  const rightX = halfW

  // --- Walls that depend on the roof slope are trapezoids. ---
  // South wall: has a 4u-wide archway opening centred on x=0 for the glass
  // hallway. Split into left trapezoid, right trapezoid, and a lintel above
  // the arch.
  const archHalf = 2
  const archTop = 2.2
  const southWall = useMemo(() => {
    const leftTop = roofHeightAt(-archHalf, leftX, rightX, peakY, lowY)
    const rightTop = roofHeightAt(archHalf, leftX, rightX, peakY, lowY)
    return {
      leftPart: quadGeometry(
        [leftX, 0, halfD],
        [-archHalf, 0, halfD],
        [-archHalf, leftTop, halfD],
        [leftX, peakY, halfD],
      ),
      rightPart: quadGeometry(
        [archHalf, 0, halfD],
        [rightX, 0, halfD],
        [rightX, lowY, halfD],
        [archHalf, rightTop, halfD],
      ),
      lintel: quadGeometry(
        [-archHalf, archTop, halfD],
        [archHalf, archTop, halfD],
        [archHalf, rightTop, halfD],
        [-archHalf, leftTop, halfD],
      ),
    }
  }, [halfD, leftX, rightX, peakY, lowY])

  // East wall: has a low arch opening to the garden (duck height 1.8u, 2u
  // wide) centred at z=0. Split into north-half, south-half, and lintel.
  const gardenArchHalfW = 1
  const gardenArchH = 1.8
  const eastWall = useMemo(
    () => ({
      northHalf: quadGeometry(
        [rightX, 0, -halfD],
        [rightX, 0, -gardenArchHalfW],
        [rightX, lowY, -gardenArchHalfW],
        [rightX, lowY, -halfD],
      ),
      southHalf: quadGeometry(
        [rightX, 0, gardenArchHalfW],
        [rightX, 0, halfD],
        [rightX, lowY, halfD],
        [rightX, lowY, gardenArchHalfW],
      ),
      lintel: quadGeometry(
        [rightX, gardenArchH, -gardenArchHalfW],
        [rightX, gardenArchH, gardenArchHalfW],
        [rightX, lowY, gardenArchHalfW],
        [rightX, lowY, -gardenArchHalfW],
      ),
    }),
    [rightX, halfD, lowY],
  )

  // West wall: full rectangle, tall (y=0 to y=12) — the roof peaks here.
  const westWallGeom = useMemo(
    () =>
      quadGeometry(
        [leftX, 0, halfD],
        [leftX, 0, -halfD],
        [leftX, peakY, -halfD],
        [leftX, peakY, halfD],
      ),
    [leftX, halfD, peakY],
  )

  // Slanted ceiling — asymmetric roof. Single quad from west peak to east low.
  const ceilingGeom = useMemo(
    () =>
      quadGeometry(
        [leftX, peakY, halfD],
        [leftX, peakY, -halfD],
        [rightX, lowY, -halfD],
        [rightX, lowY, halfD],
      ),
    [leftX, rightX, peakY, lowY, halfD],
  )

  // Triangle gable ends above the flat ceiling line on north and south walls —
  // these are already covered by the trapezoid north/south walls. So the
  // ceiling just needs to be the slanted plane.

  // North wall: this is the glass wall. We still need trapezoid geometry to
  // hold the glass panels. Use two panels flanking a central solid fireplace
  // mass, plus a lintel above everything.
  const fireHalfW = 1.5 // fireplace mass half-width
  const northWall = useMemo(() => {
    const fireplaceTop = 3
    const leftTop = roofHeightAt(-fireHalfW, leftX, rightX, peakY, lowY)
    const rightTop = roofHeightAt(fireHalfW, leftX, rightX, peakY, lowY)
    return {
      leftGlass: quadGeometry(
        [leftX, 0, -halfD],
        [-fireHalfW, 0, -halfD],
        [-fireHalfW, leftTop, -halfD],
        [leftX, peakY, -halfD],
      ),
      rightGlass: quadGeometry(
        [fireHalfW, 0, -halfD],
        [rightX, 0, -halfD],
        [rightX, lowY, -halfD],
        [fireHalfW, rightTop, -halfD],
      ),
      fireplaceStone: quadGeometry(
        [-fireHalfW, 0, -halfD],
        [fireHalfW, 0, -halfD],
        [fireHalfW, fireplaceTop, -halfD],
        [-fireHalfW, fireplaceTop, -halfD],
      ),
      overFireLintel: quadGeometry(
        [-fireHalfW, fireplaceTop, -halfD],
        [fireHalfW, fireplaceTop, -halfD],
        [fireHalfW, rightTop, -halfD],
        [-fireHalfW, leftTop, -halfD],
      ),
    }
  }, [leftX, rightX, peakY, lowY, halfD])

  return (
    <group>
      {/* --- Floor: dark polished slate --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[ml.width, ml.depth]} />
        <meshBasicMaterial color={register.slate} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Slightly warmer slate tint near the fireplace — a 6u x 4u disc on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -halfD + 2]}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial
          color={register.slateFireSide}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* --- West wall (walnut, tall) --- */}
      <mesh geometry={westWallGeom}>
        <meshBasicMaterial
          color={register.walnutFireSide}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* --- East wall (walnut, short + garden arch) --- */}
      <mesh geometry={eastWall.northHalf}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={eastWall.southHalf}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={eastWall.lintel}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* --- South wall (walnut trapezoids + lintel over entry arch) --- */}
      <mesh geometry={southWall.leftPart}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={southWall.rightPart}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={southWall.lintel}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* --- North wall — glass panels flanking central stone fireplace --- */}
      <mesh geometry={northWall.leftGlass}>
        <meshBasicMaterial
          color={register.glassTint}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={northWall.rightGlass}>
        <meshBasicMaterial
          color={register.glassTint}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={northWall.fireplaceStone}>
        <meshBasicMaterial
          color={register.matteStone}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={northWall.overFireLintel}>
        <meshBasicMaterial
          color={register.walnutCoolSide}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* --- Slanted ceiling (walnut) --- */}
      <mesh geometry={ceilingGeom}>
        <meshBasicMaterial color={register.walnut} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* --- Fireplace hearth (flush on interior side of stone wall) --- */}
      <mesh position={[0, 0.15, -halfD + 0.4]}>
        <boxGeometry args={[2.4, 0.3, 0.8]} />
        <meshBasicMaterial color={register.matteStone} transparent />
      </mesh>
      {/* Fireplace opening — a dark rectangle cut into the stone mass */}
      <mesh position={[0, 0.85, -halfD + 0.01]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshBasicMaterial color={'#050505'} transparent />
      </mesh>
      {/* Fire particles — live inside the hearth opening */}
      <FireParticles position={[0, 0.4, -halfD + 0.2]} width={1.6} depth={0.5} height={1.1} />
      {/* Fake bloom halo around the fire — additive billboard */}
      <mesh position={[0, 1.0, -halfD + 0.3]}>
        <planeGeometry args={[3.5, 2.6]} />
        <meshBasicMaterial
          color={register.fire}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* --- Pendant fixture: cool white disc hanging at centre --- */}
      <mesh position={[0, peakY - 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
        <meshBasicMaterial color={register.steelFrame} transparent />
      </mesh>
      <mesh position={[0, peakY - 3, 0]}>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshBasicMaterial color={register.pendantCoolWhite} transparent />
      </mesh>
      {/* Pendant halo */}
      <mesh position={[0, peakY - 3, 0]}>
        <sphereGeometry args={[0.8, 12, 10]} />
        <meshBasicMaterial
          color={register.pendantCoolWhite}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* --- Recessed floor strips: thin warm-white emissive along east and west walls --- */}
      <mesh position={[leftX + 0.15, 0.05, 0]}>
        <boxGeometry args={[0.08, 0.06, ml.depth - 0.4]} />
        <meshBasicMaterial
          color={register.recessedWarmWhite}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[rightX - 0.15, 0.05, 0]}>
        <boxGeometry args={[0.08, 0.06, ml.depth - 0.4]} />
        <meshBasicMaterial
          color={register.recessedWarmWhite}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* --- One low table --- */}
      <mesh position={[1.5, 0.2, 1]}>
        <boxGeometry args={[1.4, 0.4, 0.9]} />
        <meshBasicMaterial color={register.walnutFireSide} transparent />
      </mesh>

      {/* --- One object: a dark ceramic vessel --- */}
      <mesh position={[1.5, 0.55, 1]}>
        <cylinderGeometry args={[0.12, 0.18, 0.3, 14]} />
        <meshBasicMaterial color={register.matteStone} transparent />
      </mesh>

      {/* --- One seat by the fire: low bench --- */}
      <mesh position={[-1.6, 0.25, -3.5]} rotation={[0, Math.PI / 6, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.5]} />
        <meshBasicMaterial color={register.walnutFireSide} transparent />
      </mesh>
    </group>
  )
}
