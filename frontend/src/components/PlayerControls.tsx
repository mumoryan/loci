import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, PointerLockControls } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import * as THREE from 'three'

// Units per second. Mansion main living is 18u wide, so 5 u/s crosses it in
// about 3.5 seconds — brisk but not disorienting.
const SPEED = 5

export type MovementControl = 'forward' | 'backward' | 'left' | 'right'

export const KEY_MAP: Array<{ name: MovementControl; keys: string[] }> = [
  { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
]

/**
 * WASD/arrow navigation plus PointerLockControls for mouse look.
 * In VR, moves the XR origin group (since the XR system owns the camera).
 * On desktop, moves the camera directly.
 * PointerLockControls only render outside VR.
 */
export function PlayerControls() {
  const isPresenting = useXR((state) => state.session !== undefined)
  const origin = useXR((state) => state.origin)
  const [, get] = useKeyboardControls<MovementControl>()

  useFrame((state, delta) => {
    const { forward, backward, left, right } = get()
    if (!forward && !backward && !left && !right) return

    const camera = state.camera

    // Camera-relative direction vectors (horizontal plane only)
    const frontVec = new THREE.Vector3()
    camera.getWorldDirection(frontVec)
    frontVec.y = 0
    frontVec.normalize()

    const rightVec = new THREE.Vector3()
    rightVec.crossVectors(frontVec, camera.up).normalize()

    const move = new THREE.Vector3()
    if (forward) move.add(frontVec)
    if (backward) move.sub(frontVec)
    if (right) move.add(rightVec)
    if (left) move.sub(rightVec)

    move.normalize().multiplyScalar(SPEED * delta)

    // In VR the XR system overrides state.camera each frame, so we move the
    // XR origin group instead. On desktop we move the camera directly.
    if (isPresenting && origin) {
      origin.position.add(move)
    } else {
      camera.position.add(move)
    }
  })

  if (isPresenting) return null
  return <PointerLockControls />
}
