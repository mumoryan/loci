import { create } from 'zustand'
import { tracks } from '../data/tracks'
import { AUDIO } from '../constants/audio'

interface AudioState {
  currentIndex: number
  isPlaying: boolean
  isMuted: boolean
  // Internal — the Audio element is kept here so it outlives component mounts
  _audio: HTMLAudioElement | null
}

interface AudioActions {
  play: () => void
  pause: () => void
  toggleMute: () => void
  next: () => void
  prev: () => void
  /** Called each frame during the entry fade-in to ramp volume */
  setVolume: (v: number) => void
}

function createAudio(index: number): HTMLAudioElement {
  const el = new Audio(tracks[index].file)
  el.loop = true
  el.volume = 0
  return el
}

export const useAudioStore = create<AudioState & AudioActions>((set, get) => ({
  currentIndex: 0,
  isPlaying: false,
  isMuted: false,
  _audio: null,

  play() {
    let audio = get()._audio
    if (!audio) {
      audio = createAudio(get().currentIndex)
      set({ _audio: audio })
    }
    audio.play().catch(() => {
      // Autoplay blocked — will retry on next user gesture
    })
    set({ isPlaying: true })
  },

  pause() {
    get()._audio?.pause()
    set({ isPlaying: false })
  },

  toggleMute() {
    const audio = get()._audio
    const next = !get().isMuted
    if (audio) audio.muted = next
    set({ isMuted: next })
  },

  next() {
    const { currentIndex, isPlaying, _audio } = get()
    const nextIndex = (currentIndex + 1) % tracks.length
    if (_audio) {
      _audio.pause()
      _audio.src = tracks[nextIndex].file
      _audio.volume = AUDIO.DEFAULT_VOLUME
      if (isPlaying) _audio.play().catch(() => {})
    }
    set({ currentIndex: nextIndex })
  },

  prev() {
    const { currentIndex, isPlaying, _audio } = get()
    // If more than 3s in, restart current track
    if (_audio && _audio.currentTime > 3) {
      _audio.currentTime = 0
      return
    }
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length
    if (_audio) {
      _audio.pause()
      _audio.src = tracks[prevIndex].file
      _audio.volume = AUDIO.DEFAULT_VOLUME
      if (isPlaying) _audio.play().catch(() => {})
    }
    set({ currentIndex: prevIndex })
  },

  setVolume(v: number) {
    const audio = get()._audio
    if (audio) audio.volume = Math.max(0, Math.min(1, v))
  },
}))
