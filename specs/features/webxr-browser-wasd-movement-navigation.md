
# Spec: Desktop navigation (WASD + mouse look)

## Status
- [ ] Frontend implementation
- [ ] Human review

## What this is
Non-VR fallback navigation for the browser window. Allows the scene to be
explored on a desktop or laptop without a headset. Must automatically disable
when a VR session is active — never fights headset tracking.

## Acceptance criteria
- [ ] W/A/S/D and arrow keys move the camera through the scene
- [ ] Click to lock pointer, mouse drag to look around (pointer lock)
- [ ] Controls are completely disabled when `isPresenting` is true (VR active)
- [ ] Movement speed feels natural for the mansion scale (~5 units/sec)
- [ ] No new dependencies — uses `@react-three/drei` only
- [ ] No console errors in browser or headset

## Implementation

### Dependencies
Already available — no installs needed:
- `KeyboardControls` from `@react-three/drei`
- `useKeyboardControls` from `@react-three/drei`
- `PointerLockControls` from `@react-three/drei`
- `useXR` from `@react-three/xr`
- `useFrame` from `@react-three/fiber`

### Files to create
- `frontend/src/components/PlayerControls.tsx`

### Files to modify
- `frontend/src/App.tsx` (or root scene file) — wrap scene with
  `KeyboardControls`, add `PlayerControls` and `PointerLockControls`

### KeyboardControls wrapper
Wrap the scene root with `KeyboardControls`. This provides keyboard state
to all children via context — no prop drilling needed.

```tsx
import { KeyboardControls } from '@react-three/drei'

const keyMap = [
  { name: 'forward',  keys: ['ArrowUp',    'w', 'W'] },
  { name: 'backward', keys: ['ArrowDown',  's', 'S'] },
  { name: 'left',     keys: ['ArrowLeft',  'a', 'A'] },
  { name: 'right',    keys: ['ArrowRight', 'd', 'D'] },
]

// Wrap your Canvas children:
<KeyboardControls map={keyMap}>
  <YourScene />
</KeyboardControls>
```

### PlayerControls component

```tsx
// frontend/src/components/PlayerControls.tsx
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useXR } from '@react-three/xr'

const SPEED = 5 // units per second — adjust if mansion feels too fast/slow

export function PlayerControls() {
  const { isPresenting } = useXR()
  const [, get] = useKeyboardControls()

  useFrame((state, delta) => {
    if (isPresenting) return // disabled in VR — headset handles movement

    const { forward, backward, left, right } = get()

    if (forward)  state.camera.position.z -= SPEED * delta
    if (backward) state.camera.position.z += SPEED * delta
    if (left)     state.camera.position.x -= SPEED * delta
    if (right)    state.camera.position.x += SPEED * delta
  })

  return null
}
```

### PointerLockControls (mouse look)
Add inside the scene, guarded by `isPresenting`. Click anywhere in the canvas
to lock the pointer — then drag to look around. Escape to release.

```tsx
import { PointerLockControls } from '@react-three/drei'
import { useXR } from '@react-three/xr'

function MouseLook() {
  const { isPresenting } = useXR()
  if (isPresenting) return null
  return <PointerLockControls />
}
```

### Final scene structure

```tsx
<KeyboardControls map={keyMap}>
  <Canvas>
    <XR>
      <PlayerControls />
      <MouseLook />
      {/* rest of scene */}
    </XR>
  </Canvas>
</KeyboardControls>
```

## Implementation notes
- `SPEED = 5` is a starting value — may need tuning once tested in the
  actual mansion scene. The mansion is ~18u wide so 5u/s feels brisk but
  not disorienting.
- `PointerLockControls` will conflict with `OrbitControls` if both are
  present — remove any existing `OrbitControls` before adding this.
- Movement is camera-axis-aligned (not direction-of-look). This is intentional
  for a first pass — strafe left/right, forward/back relative to world axes.
  If direction-of-look movement is preferred, use the camera's quaternion to
  transform the direction vector.
- Do not add jumping or gravity — this is a contemplation space, not a game.

## Human review
To be completed in browser window (not headset) by Ryan.
- [ ] WASD movement feels natural at mansion scale
- [ ] Mouse look is responsive and not jittery
- [ ] Controls correctly disable when entering VR session
- [ ] No perceptible frame drop during movement