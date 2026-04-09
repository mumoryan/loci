import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { ENTRY_TIMING } from '../constants/timing'
import { quotes, Quote } from '../data/quotes'

// --- Phase state machine ---
type SequencePhase =
  | 'DARKNESS'
  | 'QUOTE_FADE_IN'
  | 'QUOTE_HOLD'
  | 'QUOTE_FADE_OUT'
  | 'WORLD_FADE_IN'
  | 'COMPLETE'

// Convert ms to seconds for useFrame elapsed time comparisons
const MS = 1 / 1000

function selectQuote(sessionStartTime: number): Quote {
  // Deterministic per session, avoids same quote twice in a row via localStorage
  const totalQuotes = quotes.length
  const rawIndex = Math.abs(Math.floor(Math.sin(sessionStartTime * 0.001) * 1000)) % totalQuotes

  let lastIndex: number | null = null
  try {
    const stored = localStorage.getItem('loci_last_quote_index')
    if (stored !== null) {
      lastIndex = parseInt(stored, 10)
    }
  } catch {
    // localStorage unavailable (e.g. in headset browser with storage blocked) — ignore
  }

  let index = rawIndex
  if (lastIndex !== null && index === lastIndex) {
    index = (index + 1) % totalQuotes
  }

  try {
    localStorage.setItem('loci_last_quote_index', String(index))
  } catch {
    // ignore
  }

  return quotes[index]
}

// Full-screen black overlay plane — sits at z = -0.5, in front of world but behind text
function DarknessOverlay({ opacity }: { opacity: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => {
    if (matRef.current) {
      matRef.current.opacity = opacity
    }
  }, [opacity])

  return (
    <mesh position={[0, 0, -0.5]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        ref={matRef}
        color="black"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

// Stub world — placeholder until Hokkaido world spec is implemented
function WorldStub({ opacity }: { opacity: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => {
    if (matRef.current) {
      matRef.current.opacity = opacity
    }
  }, [opacity])

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial
          ref={matRef}
          color="#1a1a2e"
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Horizon fog box — simple atmospheric suggestion */}
      <mesh position={[0, 2, -8]}>
        <boxGeometry args={[20, 6, 0.1]} />
        <meshBasicMaterial color="#0d1b2a" transparent opacity={opacity * 0.6} />
      </mesh>
    </group>
  )
}

interface EntrySequenceProps {
  onComplete?: () => void
}

export function EntrySequence({ onComplete }: EntrySequenceProps) {
  const sessionStartTime = useRef(Date.now())
  const quote = useRef<Quote>(selectQuote(sessionStartTime.current))

  const [phase, setPhase] = useState<SequencePhase>('DARKNESS')
  const [darknessOpacity, setDarknessOpacity] = useState(1)
  const [quoteOpacity, setQuoteOpacity] = useState(0)
  const [worldOpacity, setWorldOpacity] = useState(0)

  // Phase start time in seconds (elapsed from useFrame clock)
  const phaseStartRef = useRef<number | null>(null)

  // Stable phase ref for useFrame (avoids stale closure)
  const phaseRef = useRef<SequencePhase>('DARKNESS')
  phaseRef.current = phase

  const setPhaseRef = (p: SequencePhase) => {
    phaseRef.current = p
    setPhase(p)
  }

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() // seconds

    // Initialise phase clock on first frame
    if (phaseStartRef.current === null) {
      phaseStartRef.current = elapsed
    }

    const t = elapsed - phaseStartRef.current // seconds into current phase

    const currentPhase = phaseRef.current

    switch (currentPhase) {
      case 'DARKNESS': {
        const holdS = ENTRY_TIMING.DARKNESS_HOLD_MS * MS
        if (t >= holdS) {
          phaseStartRef.current = elapsed
          setPhaseRef('QUOTE_FADE_IN')
        }
        break
      }

      case 'QUOTE_FADE_IN': {
        const fadeS = ENTRY_TIMING.QUOTE_FADE_IN_MS * MS
        const progress = Math.min(t / fadeS, 1)
        setQuoteOpacity(progress)
        if (progress >= 1) {
          phaseStartRef.current = elapsed
          setPhaseRef('QUOTE_HOLD')
        }
        break
      }

      case 'QUOTE_HOLD': {
        const holdS = ENTRY_TIMING.QUOTE_HOLD_MS * MS
        if (t >= holdS) {
          phaseStartRef.current = elapsed
          setPhaseRef('QUOTE_FADE_OUT')
        }
        break
      }

      case 'QUOTE_FADE_OUT': {
        const fadeS = ENTRY_TIMING.QUOTE_FADE_OUT_MS * MS
        const progress = Math.min(t / fadeS, 1)
        setQuoteOpacity(1 - progress)
        if (progress >= 1) {
          phaseStartRef.current = elapsed
          setPhaseRef('WORLD_FADE_IN')
        }
        break
      }

      case 'WORLD_FADE_IN': {
        const fadeS = ENTRY_TIMING.WORLD_FADE_IN_MS * MS
        const progress = Math.min(t / fadeS, 1)
        // Darkness lifts as world fades in
        setDarknessOpacity(1 - progress)
        setWorldOpacity(progress)
        if (progress >= 1) {
          setPhaseRef('COMPLETE')
          onComplete?.()
        }
        break
      }

      case 'COMPLETE':
        // No-op — sequence finished
        break
    }
  })

  const isComplete = phase === 'COMPLETE'

  return (
    <group>
      {/* World stub — always mounted, opacity controlled by sequence */}
      <WorldStub opacity={worldOpacity} />

      {/* Quote text — troika-three-text via @react-three/drei Text */}
      {!isComplete && (
        <Text
          position={[0, 0, -2]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.4}
          lineHeight={1.5}
          letterSpacing={0.02}
          textAlign="center"
          fillOpacity={quoteOpacity}
          font={undefined}
        >
          {`"${quote.current.text}"\n\n— ${quote.current.author}`}
        </Text>
      )}

      {/* Full-screen darkness overlay — rendered last so it sits on top */}
      {!isComplete && <DarknessOverlay opacity={darknessOpacity} />}
    </group>
  )
}

export default EntrySequence
