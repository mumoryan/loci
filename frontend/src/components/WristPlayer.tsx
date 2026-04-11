import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useXR, useXRInputSourceState } from '@react-three/xr'
import * as THREE from 'three'
import { useAudioStore } from '../store/audioStore'
import { tracks } from '../data/tracks'

const PANEL_WIDTH = 0.15
const PANEL_HEIGHT = 0.09
const BTN_SIZE = 0.022
const BTN_Y = -0.018
const PANEL_COLOR = '#1a1a2e'
const BTN_COLOR = '#ffffff'
const BTN_ACTIVE_COLOR = '#88aaff'

// Wrist offset: panel floats just above the back of the left hand
const WRIST_OFFSET = new THREE.Vector3(0, 0.04, -0.02)

interface ButtonProps {
  x: number
  label: string
  onClick: () => void
  active?: boolean
}

function PanelButton({ x, label, onClick, active = false }: ButtonProps) {
  return (
    <group position={[x, BTN_Y, 0.001]}>
      {/* Hit area */}
      <mesh onClick={onClick}>
        <planeGeometry args={[BTN_SIZE * 1.8, BTN_SIZE * 1.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Text
        fontSize={BTN_SIZE}
        color={active ? BTN_ACTIVE_COLOR : BTN_COLOR}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  )
}

export function WristPlayer() {
  const groupRef = useRef<THREE.Group>(null)
  const isInSession = useXR((s) => s.session != null)
  const controllerState = useXRInputSourceState('controller', 'left')

  const currentIndex = useAudioStore((s) => s.currentIndex)
  const isPlaying = useAudioStore((s) => s.isPlaying)
  const isMuted = useAudioStore((s) => s.isMuted)
  const play = useAudioStore((s) => s.play)
  const pause = useAudioStore((s) => s.pause)
  const toggleMute = useAudioStore((s) => s.toggleMute)
  const next = useAudioStore((s) => s.next)
  const prev = useAudioStore((s) => s.prev)

  const track = tracks[currentIndex]

  useFrame(() => {
    if (!groupRef.current || !controllerState?.object) return

    // Snap panel to grip pose each frame
    const grip = controllerState.object
    grip.updateWorldMatrix(true, false)

    groupRef.current.position.setFromMatrixPosition(grip.matrixWorld)
    groupRef.current.quaternion.setFromRotationMatrix(grip.matrixWorld)

    // Offset into wrist-up position in controller local space
    const offset = WRIST_OFFSET.clone().applyQuaternion(groupRef.current.quaternion)
    groupRef.current.position.add(offset)
  })

  return (
    <group ref={groupRef} visible={isInSession}>
      {/* Panel background */}
      <mesh renderOrder={2}>
        <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
        <meshBasicMaterial color={PANEL_COLOR} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Track title */}
      <Text
        position={[0, 0.026, 0.001]}
        fontSize={0.012}
        color={BTN_COLOR}
        anchorX="center"
        anchorY="middle"
        maxWidth={PANEL_WIDTH - 0.01}
        font={undefined}
        renderOrder={3}
      >
        {track.title}
      </Text>

      {/* Artist */}
      <Text
        position={[0, 0.01, 0.001]}
        fontSize={0.009}
        color="#aaaacc"
        anchorX="center"
        anchorY="middle"
        maxWidth={PANEL_WIDTH - 0.01}
        font={undefined}
        renderOrder={3}
      >
        {track.artist}
      </Text>

      {/* Controls row: prev | play/pause | next | mute */}
      <PanelButton x={-0.045} label="◀◀" onClick={prev} />
      <PanelButton x={-0.015} label={isPlaying ? '▐▐' : '▶'} onClick={isPlaying ? pause : play} />
      <PanelButton x={0.015} label="▶▶" onClick={next} />
      <PanelButton x={0.045} label={isMuted ? '○' : '♪'} onClick={toggleMute} active={isMuted} />
    </group>
  )
}
