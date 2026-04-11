import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { MANSION } from './constants'
import { useTimeOfDay } from './timeOfDay'
import { quadGeometry } from './geometry'

// Glass tower — 8x8 footprint, 20u tall, 5 levels. Dark steel frame corners,
// semi-transparent glass panels on each level, interior floor plates, and a
// helical exterior staircase that wraps the outside. Bridge at L3 leads to
// the onsen platform on the cliff shelf.
export function Tower() {
  const register = useTimeOfDay((s) => s.register)
  const t = MANSION.tower
  const halfW = t.width / 2
  const halfD = t.depth / 2

  // --- Exterior staircase: a helical series of step boxes orbiting the tower ---
  const STEPS_PER_TURN = 14
  const TURNS = 5
  const TOTAL_STEPS = STEPS_PER_TURN * TURNS
  const STAIR_RADIUS = halfW + 0.9

  const stepMeshRef = useRef<THREE.InstancedMesh>(null)
  const stepDummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const mesh = stepMeshRef.current
    if (!mesh) return
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const progress = i / TOTAL_STEPS
      const angle = progress * TURNS * Math.PI * 2
      const y = progress * t.totalHeight + 0.05
      const x = Math.cos(angle) * STAIR_RADIUS
      const z = Math.sin(angle) * STAIR_RADIUS
      stepDummy.position.set(x, y, z)
      stepDummy.rotation.set(0, -angle, 0)
      stepDummy.scale.set(1.1, 0.08, 0.42)
      stepDummy.updateMatrix()
      mesh.setMatrixAt(i, stepDummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [TOTAL_STEPS, t.totalHeight, stepDummy])

  // --- Frame corner columns ---
  const columns = useMemo(
    () =>
      [
        [-halfW, -halfD],
        [halfW, -halfD],
        [-halfW, halfD],
        [halfW, halfD],
      ] as Array<[number, number]>,
    [halfW, halfD],
  )

  // --- Bridge geometry: diagonal ramp from tower L3 (y=12) northward and down to onsen (y=-4) ---
  const bridgeGeom = useMemo(() => {
    // Bridge starts at tower north face at y=12 and lands at cliff level
    // (y=-4) offset further north. Length ~8u horizontally.
    const startY = 12
    const endY = -4
    const startZ = -halfD
    const endZ = -halfD - 7
    const bridgeW = 1.2
    return quadGeometry(
      [-bridgeW, startY, startZ],
      [bridgeW, startY, startZ],
      [bridgeW, endY, endZ],
      [-bridgeW, endY, endZ],
    )
  }, [halfD])

  // Bridge rails — simple thin cylinders along both edges
  const bridgeRailGeom = useMemo(() => {
    // Same two slopes, offset in Y by 1
    return {
      left: quadGeometry(
        [-1.2, 13, -halfD],
        [-1.18, 13, -halfD],
        [-1.18, -3, -halfD - 7],
        [-1.2, -3, -halfD - 7],
      ),
      right: quadGeometry(
        [1.18, 13, -halfD],
        [1.2, 13, -halfD],
        [1.2, -3, -halfD - 7],
        [1.18, -3, -halfD - 7],
      ),
    }
  }, [halfD])

  return (
    <group position={t.center}>
      {/* ---------------- Corner frame columns ---------------- */}
      {columns.map(([cx, cz], i) => (
        <mesh key={i} position={[cx, t.totalHeight / 2, cz]}>
          <boxGeometry args={[0.25, t.totalHeight, 0.25]} />
          <meshBasicMaterial color={register.steelFrame} transparent />
        </mesh>
      ))}

      {/* ---------------- Floor plates at each level ---------------- */}
      {Array.from({ length: t.levels }).map((_, level) => {
        const y = level * t.levelHeight
        const isBase = level === 0
        return (
          <mesh key={level} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
            <planeGeometry args={[t.width, t.depth]} />
            <meshBasicMaterial
              color={isBase ? register.slate : register.walnut}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Roof at L5 — open sky platform, no solid roof, but thin frame top */}
      <mesh position={[0, t.totalHeight, 0]}>
        <boxGeometry args={[t.width + 0.1, 0.08, t.depth + 0.1]} />
        <meshBasicMaterial color={register.steelFrame} transparent />
      </mesh>

      {/* ---------------- Glass wall panels per level ---------------- */}
      {Array.from({ length: t.levels }).map((_, level) => {
        const y = level * t.levelHeight + t.levelHeight / 2
        const isL5 = level === t.levels - 1
        const isL1 = level === 0
        return (
          <group key={level}>
            {/* North face — at L3, this face has the bridge opening; keep glass anyway */}
            {!isL5 && (
              <mesh position={[0, y, -halfD]}>
                <planeGeometry args={[t.width, t.levelHeight]} />
                <meshBasicMaterial
                  color={register.glassTint}
                  transparent
                  opacity={0.18}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}
            {/* South face */}
            {!isL5 && (
              <mesh position={[0, y, halfD]}>
                <planeGeometry args={[t.width, t.levelHeight]} />
                <meshBasicMaterial
                  color={register.glassTint}
                  transparent
                  opacity={0.18}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}
            {/* East face */}
            {!isL5 && (
              <mesh position={[halfW, y, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[t.depth, t.levelHeight]} />
                <meshBasicMaterial
                  color={register.glassTint}
                  transparent
                  opacity={0.18}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}
            {/* West face — base level has opening to garden */}
            {!isL5 && !isL1 && (
              <mesh position={[-halfW, y, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[t.depth, t.levelHeight]} />
                <meshBasicMaterial
                  color={register.glassTint}
                  transparent
                  opacity={0.18}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Cool white edge strip along the floor plate perimeter */}
            <mesh position={[0, y - t.levelHeight / 2 + 0.05, -halfD + 0.15]}>
              <boxGeometry args={[t.width - 0.4, 0.05, 0.05]} />
              <meshBasicMaterial
                color={register.towerStrip}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, y - t.levelHeight / 2 + 0.05, halfD - 0.15]}>
              <boxGeometry args={[t.width - 0.4, 0.05, 0.05]} />
              <meshBasicMaterial
                color={register.towerStrip}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        )
      })}

      {/* ---------------- L4 Study — a desk and stool ---------------- */}
      <group position={[0, 12, 0]}>
        <mesh position={[0, 0.4, -2]}>
          <boxGeometry args={[2.4, 0.1, 1.2]} />
          <meshBasicMaterial color={register.walnutFireSide} transparent />
        </mesh>
        <mesh position={[-1, 0.2, -2]}>
          <boxGeometry args={[0.1, 0.4, 1]} />
          <meshBasicMaterial color={register.walnutFireSide} transparent />
        </mesh>
        <mesh position={[1, 0.2, -2]}>
          <boxGeometry args={[0.1, 0.4, 1]} />
          <meshBasicMaterial color={register.walnutFireSide} transparent />
        </mesh>
        <mesh position={[0, 0.25, -0.9]}>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 10]} />
          <meshBasicMaterial color={register.walnut} transparent />
        </mesh>
      </group>

      {/* ---------------- Helical exterior staircase ---------------- */}
      <instancedMesh
        ref={stepMeshRef}
        args={[undefined, undefined, TOTAL_STEPS]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={register.steelFrame} transparent />
      </instancedMesh>

      {/* ---------------- Bridge from L3 to onsen ---------------- */}
      <mesh geometry={bridgeGeom}>
        <meshBasicMaterial color={register.steelFrame} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bridgeRailGeom.left}>
        <meshBasicMaterial color={register.steelFrame} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bridgeRailGeom.right}>
        <meshBasicMaterial color={register.steelFrame} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
