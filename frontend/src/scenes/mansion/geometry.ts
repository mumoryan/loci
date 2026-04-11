import * as THREE from 'three'

type V3 = [number, number, number]

// Quad geometry from four CCW-wound corner vertices. Two triangles, shared
// normal. Use for walls, ceilings, and anything that isn't a simple box.
export function quadGeometry(v0: V3, v1: V3, v2: V3, v3: V3): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  const positions = new Float32Array([...v0, ...v1, ...v2, ...v3])
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setIndex([0, 1, 2, 0, 2, 3])
  geom.computeVertexNormals()
  return geom
}

// Triangle geometry from three CCW-wound vertices.
export function triangleGeometry(v0: V3, v1: V3, v2: V3): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  geom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([...v0, ...v1, ...v2]), 3),
  )
  geom.setIndex([0, 1, 2])
  geom.computeVertexNormals()
  return geom
}

// Linear interpolation, useful for sampling roof slope.
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Sample the asymmetric main-living roof slope at a given x coordinate.
// Peak y=peakY at x=leftX, drops to y=lowY at x=rightX.
export function roofHeightAt(
  x: number,
  leftX: number,
  rightX: number,
  peakY: number,
  lowY: number,
): number {
  const t = (x - leftX) / (rightX - leftX)
  return lerp(peakY, lowY, Math.max(0, Math.min(1, t)))
}
