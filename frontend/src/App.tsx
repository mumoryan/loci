import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { NoToneMapping } from 'three'
import { EntrySequence } from './components/EntrySequence'
import { WristPlayer } from './components/WristPlayer'
import { PlayerControls, KEY_MAP } from './components/PlayerControls'
import { useAudioStore } from './store/audioStore'

const store = createXRStore()

export function App() {
  const audioPlay = useAudioStore((s) => s.play)

  // Unlock audio on first canvas interaction (browser autoplay policy
  // requires a user gesture before audio can play).
  const handleCanvasClick = () => {
    audioPlay()
  }

  return (
    <KeyboardControls map={KEY_MAP}>
      <button onClick={() => { audioPlay(); store.enterVR() }}>Enter VR</button>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 1.6, 5] }}
        gl={{ toneMapping: NoToneMapping }}
        style={{ background: '#000000' }}
        onClick={handleCanvasClick}
      >
        <XR store={store}>
          <XROrigin />
          <PlayerControls />
          <EntrySequence />
          <WristPlayer />
        </XR>
      </Canvas>
    </KeyboardControls>
  )
}
