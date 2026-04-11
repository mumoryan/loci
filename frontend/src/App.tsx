import { createXRStore, XR } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import { EntrySequence } from './components/EntrySequence'
import { WristPlayer } from './components/WristPlayer'
import { useAudioStore } from './store/audioStore'

const store = createXRStore()

export function App() {
  const audioPlay = useAudioStore((s) => s.play)

  return (
    <>
      <button onClick={() => { audioPlay(); store.enterVR() }}>Enter VR</button>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 0] }}
        gl={{ toneMapping: NoToneMapping }}
        style={{ background: '#000000' }}
      >
        <XR store={store}>
          <EntrySequence />
          <WristPlayer />
        </XR>
      </Canvas>
    </>
  )
}
