import { useMemo } from 'react'
import * as THREE from 'three'
import { useTimeOfDay } from './timeOfDay'

// Hand-picked peaks — deterministic, same every session.
// [x, peakHeightAboveBase]
const FAR_PEAKS: Array<[number, number]> = [
  [-90, 18],
  [-68, 26],
  [-48, 20],
  [-28, 32],
  [-8, 24],
  [14, 36],
  [34, 22],
  [56, 28],
  [78, 20],
  [96, 16],
]

const NEAR_PEAKS: Array<[number, number]> = [
  [-75, 14],
  [-52, 22],
  [-30, 16],
  [-10, 24],
  [12, 18],
  [32, 26],
  [54, 16],
  [76, 20],
]

function buildMountainRange(
  peaks: Array<[number, number]>,
  z: number,
  baseY: number,
): THREE.BufferGeometry {
  // Top edge: alternating peaks and shallow valleys between them.
  const topEdge: Array<[number, number]> = []
  for (let i = 0; i < peaks.length; i++) {
    if (i > 0) {
      const midX = (peaks[i - 1][0] + peaks[i][0]) / 2
      const valleyY = baseY + Math.min(peaks[i - 1][1], peaks[i][1]) * 0.25
      topEdge.push([midX, valleyY])
    }
    topEdge.push([peaks[i][0], baseY + peaks[i][1]])
  }

  const bottomY = baseY - 40
  const positions: number[] = []
  const indices: number[] = []
  const topN = topEdge.length

  for (const [x, y] of topEdge) positions.push(x, y, z)
  for (const [x] of topEdge) positions.push(x, bottomY, z)

  for (let i = 0; i < topN - 1; i++) {
    const t0 = i
    const t1 = i + 1
    const b0 = i + topN
    const b1 = i + 1 + topN
    indices.push(t0, b0, t1)
    indices.push(t1, b0, b1)
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setIndex(indices)
  return geom
}

function buildSkyPlane(
  topHex: string,
  bottomHex: string,
  width: number,
  height: number,
  z: number,
  baseY: number,
): THREE.BufferGeometry {
  const top = new THREE.Color(topHex)
  const bot = new THREE.Color(bottomHex)
  const geom = new THREE.BufferGeometry()
  const y0 = baseY - 20
  const y1 = baseY + height
  // prettier-ignore
  const positions = new Float32Array([
    -width / 2, y0, z,
     width / 2, y0, z,
     width / 2, y1, z,
    -width / 2, y1, z,
  ])
  // prettier-ignore
  const colors = new Float32Array([
    bot.r, bot.g, bot.b,
    bot.r, bot.g, bot.b,
    top.r, top.g, top.b,
    top.r, top.g, top.b,
  ])
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geom.setIndex([0, 1, 2, 0, 2, 3])
  return geom
}

// Snowline mesh — thin white highlight strip along each peak, drawn over the
// mountain silhouette. Cheap approximation of snow-capped peaks.
function buildSnowlineGeometry(
  peaks: Array<[number, number]>,
  z: number,
  baseY: number,
): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  let vIdx = 0
  for (const [px, ph] of peaks) {
    const peakY = baseY + ph
    const sideW = Math.max(2, ph * 0.35)
    const snowDepth = Math.max(1, ph * 0.18)
    positions.push(px - sideW, peakY - snowDepth, z + 0.05)
    positions.push(px + sideW, peakY - snowDepth, z + 0.05)
    positions.push(px, peakY, z + 0.05)
    indices.push(vIdx, vIdx + 1, vIdx + 2)
    vIdx += 3
  }
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setIndex(indices)
  return geom
}

/**
 * The northern backdrop — sky gradient, two mountain ranges, snowcaps.
 * Always visible through the main living glass wall and engawa.
 */
export function Mountains() {
  const register = useTimeOfDay((s) => s.register)

  const skyGeom = useMemo(
    () => buildSkyPlane(register.skyTop, register.skyHorizon, 280, 140, -90, -20),
    [register],
  )
  const farGeom = useMemo(() => buildMountainRange(FAR_PEAKS, -70, -4), [])
  const nearGeom = useMemo(() => buildMountainRange(NEAR_PEAKS, -50, -4), [])
  const farSnowGeom = useMemo(() => buildSnowlineGeometry(FAR_PEAKS, -70, -4), [])
  const nearSnowGeom = useMemo(() => buildSnowlineGeometry(NEAR_PEAKS, -50, -4), [])

  return (
    <group>
      <mesh geometry={skyGeom} renderOrder={-10}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={farGeom} renderOrder={-9}>
        <meshBasicMaterial
          color={register.mountainFar}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={farSnowGeom} renderOrder={-8}>
        <meshBasicMaterial
          color={register.mountainSnowline}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={nearGeom} renderOrder={-7}>
        <meshBasicMaterial
          color={register.mountainNear}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={nearSnowGeom} renderOrder={-6}>
        <meshBasicMaterial
          color={register.mountainSnowline}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
