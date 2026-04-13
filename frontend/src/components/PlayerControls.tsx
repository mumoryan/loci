import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, PointerLockControls } from '@react-three/drei'
import { useXR } from '@react-three/xr'

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
 * Desktop-only navigation — WASD/arrows plus PointerLockControls for mouse
 * look. Completely inert when an XR session is active so it never fights the
 * headset's own tracking.
 */
export function PlayerControls() {
  // In @react-three/xr v6, `session` is `XRSession | undefined` (never null),
  // so compare against undefined — `!== null` is always true and inverts the
  // gate.
  const isPresenting = useXR((state) => state.session !== undefined)
  const [, get] = useKeyboardControls<MovementControl>()

  useFrame((state, delta) => {
    if (isPresenting) return

    const { forward, backward, left, right } = get()

    if (forward) state.camera.position.z -= SPEED * delta
    if (backward) state.camera.position.z += SPEED * delta
    if (left) state.camera.position.x -= SPEED * delta
    if (right) state.camera.position.x += SPEED * delta
  })

  if (isPresenting) return null
  return <PointerLockControls />
}
