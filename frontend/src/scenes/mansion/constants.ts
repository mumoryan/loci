// Hokkaido mansion — shared dimensions, layout, and colour constants.
// Units are Three.js units (1u ≈ 1m). Coordinate system:
//   +Y up · -Z north (mountains) · +Z south (gondola arrival)
//   -X west (reading alcove) · +X east (garden, tower)
// User starts near the south edge of main living, facing -Z.

export const MANSION = {
  mainLiving: {
    width: 18,
    depth: 14,
    height: 8,
    roofPeakHeight: 12, // peak at west side
    center: [0, 0, 0] as [number, number, number],
  },
  glassHallway: {
    width: 4,
    depth: 12,
    height: 4,
    center: [0, 0, 13] as [number, number, number],
  },
  entryVestibule: {
    width: 5,
    depth: 5,
    height: 4,
    center: [0, 0, 21.5] as [number, number, number],
  },
  gondolaPlatform: {
    width: 10,
    depth: 8,
    height: 4, // roof height
    center: [0, 0, 28] as [number, number, number],
  },
  westWing: {
    width: 8,
    depth: 10,
    height: 4,
    center: [-15, 0, 13] as [number, number, number],
    // Glass link runs from west side of hallway to east side of west wing
    link: {
      fromX: -2, // hallway west wall
      toX: -11, // west wing east wall
      width: 3, // link height-wise
      z: 13,
    },
  },
  indoorGarden: {
    width: 10,
    depth: 8,
    height: 3,
    center: [14, 0, 0] as [number, number, number],
  },
  tower: {
    width: 8,
    depth: 8,
    totalHeight: 20,
    levels: 5,
    levelHeight: 4,
    center: [24, 0, -2] as [number, number, number],
  },
  engawa: {
    width: 16,
    depth: 5,
    center: [0, 0, -9.5] as [number, number, number], // just north of main living
  },
  onsen: {
    width: 12,
    depth: 10,
    center: [24, -4, -18] as [number, number, number], // cliff shelf north of tower
  },
  // Bridge exits tower at y=12 (L3), lands on onsen platform at cliff level y=-4
  bridge: {
    fromX: 24,
    fromZ: -6, // tower north edge
    toX: 24,
    toZ: -13, // onsen south edge
    startY: 12,
    endY: -4,
    width: 2,
  },
} as const

// Evening register — the primary and defining light
export const EVENING = {
  // Baked surface tints (MeshBasicMaterial)
  walnut: '#2a1a10',
  walnutFireSide: '#4a2a14', // warmed by fireplace
  walnutCoolSide: '#1a1e2a', // lit by mountain ambient
  slate: '#14161a',
  slateFireSide: '#241812',
  deckWood: '#3a2e20',
  steelFrame: '#1a1a20',
  matteStone: '#0a0a0c',
  moss: '#2a4a2a',
  bamboo: '#3a4a28',
  gardenStone: '#2a2a28',
  onsenStone: '#18161a',
  onsenWater: '#0a1820',
  snow: '#c8d4e0',
  glassTint: '#6a8ca8',
  gondolaSteel: '#1a1e24',

  // Emissive / light sources (additive halo meshes = fake bloom)
  fire: '#c8783a',
  recessedWarmWhite: '#d4904a',
  pendantCoolWhite: '#ddeeff',
  mountainAmbient: '#8ab0cc',
  orbWarm: '#ffb066',
  towerStrip: '#c8d8ff',
  gardenDownlight: '#e8b878',

  // Sky / mountain backdrop
  skyTop: '#0b1624',
  skyHorizon: '#2a3a52',
  mountainFar: '#1a2438',
  mountainNear: '#0e1624',
  mountainSnowline: '#3a4a64',
} as const

// Morning register — cool, crisp
export const MORNING = {
  ...EVENING,
  walnut: '#3a2818',
  walnutFireSide: '#3a2818', // fire is low ember, no warming
  walnutCoolSide: '#2a3044',
  slate: '#20242c',
  fire: '#6a3820', // low ember
  recessedWarmWhite: '#8a7a60',
  pendantCoolWhite: '#e8f0ff',
  mountainAmbient: '#b8d0e8',
  orbWarm: '#d8a888',
  skyTop: '#4a6a8c',
  skyHorizon: '#c8d8e8',
  mountainFar: '#6a7a94',
  mountainNear: '#3a4a64',
  mountainSnowline: '#e8f0f8',
} as const

// Afternoon register — neutral warm
export const AFTERNOON = {
  ...EVENING,
  walnut: '#32201a',
  walnutFireSide: '#32201a',
  walnutCoolSide: '#2a2a34',
  slate: '#1a1c22',
  fire: '#1a1a1c', // unlit
  recessedWarmWhite: '#5a4a3a', // minimal
  pendantCoolWhite: '#dde0e8',
  mountainAmbient: '#a8b8c8',
  orbWarm: '#b88858',
  skyTop: '#3a5a7c',
  skyHorizon: '#98b0c4',
  mountainFar: '#4a5a74',
  mountainNear: '#2a3648',
  mountainSnowline: '#b8c8d4',
} as const

// Register type is widened from `typeof EVENING` to plain strings so MORNING
// and AFTERNOON (different literal values) are assignable to the same type.
export type Register = { readonly [K in keyof typeof EVENING]: string }

// Convenience — index by name
export const REGISTERS = {
  morning: MORNING,
  afternoon: AFTERNOON,
  evening: EVENING,
} as const

export type TimeOfDay = keyof typeof REGISTERS
