import { create } from 'zustand'
import * as THREE from 'three'
import { MORNING, AFTERNOON, EVENING, Register } from './constants'

// Interpolates every string field of a register as a colour.
function lerpRegister(a: Register, b: Register, t: number): Register {
  const result: Record<string, string> = {}
  const ca = new THREE.Color()
  const cb = new THREE.Color()
  for (const key of Object.keys(a) as Array<keyof Register>) {
    ca.set(a[key])
    cb.set(b[key])
    ca.lerp(cb, t)
    result[key] = '#' + ca.getHexString()
  }
  return result as unknown as Register
}

// Compute the current register by blending keyframes based on real device clock.
// Keyframes: morning peak at 04:00, afternoon at 12:00, evening at 19:00.
function computeRegister(): Register {
  const now = new Date()
  const hour = now.getHours() + now.getMinutes() / 60

  if (hour >= 4 && hour < 12) {
    return lerpRegister(MORNING, AFTERNOON, (hour - 4) / 8)
  }
  if (hour >= 12 && hour < 19) {
    return lerpRegister(AFTERNOON, EVENING, (hour - 12) / 7)
  }
  // Evening → next-day morning, wrapping through midnight.
  const wrapped = hour < 4 ? hour + 24 : hour
  return lerpRegister(EVENING, MORNING, Math.min((wrapped - 19) / 9, 1))
}

interface TimeOfDayState {
  register: Register
  refresh: () => void
}

export const useTimeOfDay = create<TimeOfDayState>((set) => ({
  register: computeRegister(),
  refresh: () => set({ register: computeRegister() }),
}))

// Refresh every minute. The register interpolates smoothly over hours, so this
// cadence is plenty fast and stays outside the 4ms per-eye frame budget.
if (typeof window !== 'undefined') {
  setInterval(() => {
    useTimeOfDay.getState().refresh()
  }, 60_000)
}
