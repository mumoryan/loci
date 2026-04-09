import { createXRStore, XR } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import { EntrySequence } from './components/EntrySequence'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas camera={{ fov: 75, position: [0, 1.6, 0] }} style={{ background: '#000' }}>
        <XR store={store}>
          <EntrySequence />
        </XR>
      </Canvas>
    </>
  )
}
