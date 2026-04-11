export interface Track {
  title: string
  artist: string
  file: string // path relative to /public
  license: 'non-prod' | 'cc-by'
}

// Default track (index 0) is the best fit for the Hokkaido mansion world.
// non-prod tracks are for PoC / local testing only — replace before distribution.
export const tracks: Track[] = [
  {
    title: 'A Winter Retrospect',
    artist: 'Jon Shuemaker',
    file: '/music/non-prod/Jon Shuemaker - A Winter Retrospect.mp3',
    license: 'non-prod',
  },
  {
    title: 'Mist in the Mountains (Pure Felt Mix)',
    artist: 'Maarten Schellekens',
    file: '/music/non-prod/Maarten Schellekens - Mist in the Mountains (Pure Felt Mix).mp3',
    license: 'non-prod',
  },
  {
    title: 'Night Thoughts',
    artist: 'Jon Shuemaker',
    file: '/music/non-prod/Jon Shuemaker - Night Thoughts.mp3',
    license: 'non-prod',
  },
  {
    title: "Nature's Witnesses",
    artist: 'Jon Shuemaker',
    file: "/music/non-prod/Jon Shuemaker - Nature's Witnesses.mp3",
    license: 'non-prod',
  },
  {
    title: 'The House at the End of the World',
    artist: 'Elijah_K',
    file: '/music/non-prod/Elijah_K - The House at the End of the World.mp3',
    license: 'non-prod',
  },
  {
    title: 'Beginnings',
    artist: 'Musical Meanderings',
    file: '/music/non-prod/Musical Meanderings - Beginnings.mp3',
    license: 'non-prod',
  },
]
