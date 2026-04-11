# Hokkaido Mansion — Design Document
_Loci default world. Human-authored. Last updated: Session 02._

---

## Spirit & tone

The Hokkaido mansion is a personal sanctuary built into the upslope of an
unnamed Hokkaido mountain. The back of the structure is embedded in rock.
The front cantilevers over a cliff. It exists for one person only. The snow
outside has never been walked in.

The defining emotional moment: **early evening, fire lit, mountains darkening,
orbs glowing.** Everything in the design serves this moment.

---

## The seven design anchors

1. **Built for one.** One low table. One seat by the fire. No signs of other life.
2. **The fire is the heartbeat.** The fireplace in the main living space is the
   thermal and emotional centre. Everything orients around it.
3. **Cold outside, warm inside.** Fire amber vs mountain blue — neither wins,
   they coexist. This tension is the defining visual quality of the evening register.
4. **Silence has texture.** Hard slate floors, high ceilings, no soft furnishings.
   The space makes you aware of the quiet. Your thoughts feel louder here.
5. **The view is infinite but unreachable.** Mountains always visible, never
   reachable. The engawa and onsen are the closest you get.
6. **Notes belong here.** Negative space is deliberate. Rooms without obvious
   purpose invite the user to define them with their own thoughts.
7. **Beauty earns the notes.** The space must be genuinely worth remarking on.
   "This is cozy" only gets said if it's true.

---

## Design philosophy

**Avant-garde structure, realistic texture.** The engineering is deliberately
impossible — a cantilevered mansion on a cliff, a glass tower with exterior
staircases, a bridge to a cliff platform. The materials and textures are
photorealistic. Structural rules do not apply. Aesthetic rules do.

**Asymmetry is intentional.** Every unusual angle responds to something —
the mountain slope, the cliff edge, the view. Nothing is random.

**Glass hallways as connective tissue.** You are always aware of the outside,
even when moving between rooms. The mountain view bleeds into every transition.

**The gondola is structural candy.** You never ride it. It makes the world
feel like it was built for reasons beyond the game — that someone chose this
mountain, ran a cable up from the valley, built something permanent here.

---

## Spatial overview

```
UPPER LEVEL (tower)
  ├── Tower L5          open sky platform · highest point
  ├── Tower L4          study / archive room
  └── Tower L3          bridge level → onsen platform

GROUND LEVEL
  ├── Gondola platform  south exterior · cantilevered steel + glass roof
  ├── Entry vestibule   front door · transition from gondola
  ├── Glass hallway     arrival axis · branches to wings
  ├── West wing         reading alcove · low ceiling · intimate
  ├── Main living       entry point · double height · asymmetric roof · fireplace
  ├── Engawa terrace    north exterior · open deck · snow · faces mountains
  ├── Indoor garden     hinge space · moss · bamboo · water · low ceiling
  └── Tower L1-L2       base · connects to garden · interior stair

CLIFF LEVEL (below ground)
  └── Onsen platform    carved rock shelf · steam · cliff edge · total silence
```

---

## The spatial journey

The mansion is designed to be explored in a sequence that changes your state
of mind at each transition:

```
Gondola platform (south, outside, arrival)
  → front door (south face, entry vestibule)
    → glass hallway (mountain view ahead, wings branch left/right)
      → MAIN LIVING (fire, asymmetric roof, mountain view)
        → engawa (sliding glass, snow deck, open air, mountains)
        → garden passage (low arch, organic, compressed)
          → tower base (suddenly vast, shaft above)
            → exterior stair (exposed, mountain air, all levels visible)
              → tower L3 → bridge → ONSEN (cliff edge, steam, silence)
              → tower L4 (study, enclosed)
              → tower L5 (open sky, highest point)
        → glass link left → WEST WING (reading alcove, intimate)
        → glass link right → TOWER BASE
```

Each transition is a deliberate change in enclosure, light, and temperature.
Notes left in each space will feel distinct from notes left anywhere else.

---

## Arrival axis

The mansion has a clear north-south axis:

- **South:** gondola platform, front door, entry — arrival
- **North:** glass wall, engawa, mountains — destination

You walk from arrival toward the view. The mountains are the payoff at the
end of the axis. This is the organizing principle of the ground floor.

---

## Key spaces — character notes

**Main living**
The heart. Double height. Asymmetric triangle roof pitching hard left (peak
at y=12u over the left side, drops to right). Fireplace on the north wall,
centred. One low table. One object. The glass wall faces the mountains.
Orbs float here — this is where most notes will live.

**Glass hallway**
Floor-to-ceiling glass on both sides. You see the mountain slope on one side,
the cliff drop on the other, as you walk. Not a corridor — a transition that
is itself an experience.

**Indoor garden**
The only organic room in an otherwise hard-edged structure. Low ceiling —
compressed, intimate. Moss, bamboo, a shallow water channel. The contrast
with the rest of the mansion is deliberate. Notes left here feel different.

**Glass tower**
Five levels. Glass and dark steel frame — transparent, you see all levels
simultaneously from inside. The exterior staircase wraps the outside of the
tower — both exterior and interior stairs exist. Structurally absurd.
Visually unforgettable. Notes left mid-stair, between levels, feel exposed.

**Onsen platform**
A carved rock shelf on the cliff face. Accessed via bridge from tower L3.
Partially sheltered by a rock overhang. Steam visible from main living through
the glass wall. The most private space in the mansion. You have to want to
find it. Total silence except wind.

**Engawa terrace**
North face, directly off the main living space via sliding glass panel.
Open air, snow underfoot, weathered deck wood, no railing on the cliff edge.
The mountains are directly in front of you. This is as close as you get.

**West wing reading alcove**
Low ceiling (h=4u vs main living h=8u). The compression is intentional —
intimate after the grandeur of the main space. Accessed via glass link so
you never lose the view even entering the most enclosed room.

**Gondola platform**
South exterior. Cantilevered steel and glass roof shelter. One gondola car
visible at the boarding area. Cable disappears down into the valley below
the cliff line — implying a world outside this one. You never ride it.

---

## Key dimensions (Three.js units, 1u ≈ 1m)

| Space | Width | Depth | Height |
|-------|-------|-------|--------|
| Main living | 18 | 14 | 8 (double) |
| Glass hallway | 4 | 12 | 4 |
| West wing | 8 | 10 | 4 |
| Indoor garden | 10 | 8 | 3 (low) |
| Tower footprint | 8 | 8 | 20 (5 levels) |
| Engawa terrace | 16 | 5 | open |
| Onsen platform | 12 | 10 | open |
| Gondola platform | 10 | 8 | open (roof) |
| Entry vestibule | 5 | 5 | 4 |

Tower levels: L1 y=0–4, L2 y=4–8, L3 y=8–12, L4 y=12–16, L5 y=16–20
Bridge exits tower at y=12 (L3), lands on onsen platform at cliff level.
Lower study accessible from south room stair at y=-4.

---

## Materials

| Surface | Material | Notes |
|---------|----------|-------|
| Interior walls | Dark walnut panels | Baked diffuse, MeshBasicMaterial |
| Interior floor | Dark polished slate | Subtle reflection |
| Exterior deck (engawa) | Weathered deck wood | Snow accumulation mesh |
| Tower | Dark steel frame + glass | Semi-transparent panels |
| Glass hallways | Full glass walls + roof | Additive blend, no refraction |
| Fireplace surround | Dark matte stone | Flush with walnut wall |
| Garden floor | Moss + flat stone path | Particle system for moss |
| Onsen | Dark stone basin | Water plane, steam particles |
| Gondola structure | Brushed steel + glass | Static geometry |

---

## Lighting — evening register (primary)

| Source | Color | Notes |
|--------|-------|-------|
| Fireplace | Amber #C8783A | Baked hemisphere — no dynamic shadows |
| Recessed floor strips | Warm white #D4904A | Low, edge of walls |
| Pendant fixture | Cool white #DDEEFF | Main living, above centre |
| Mountain ambient | Blue-grey #8AB0CC | Fills cool side of walnut |
| Orbs | Warm amber emissive | Additive halo mesh behind each |
| Tower interior | Cool white strip lights | Each level edge |
| Garden | Soft warm downlight | Hidden source, organic feel |

No dynamic shadows. No UnrealBloomPass. Fake bloom only on all emissive objects.

---

## Time-of-day registers

| Time | Dominant light | Fire | Orbs | Mountain |
|------|---------------|------|------|----------|
| Morning | Cool blue-white | Low ember | Subtle | Sharp, snow bright |
| Afternoon | Neutral warm | Unlit | Minimal | Yellow on peaks |
| Evening | Amber + blue tension | Dominant | Warm, strong | Silhouette, deep blue |

Driven by real device clock. No manual override in V1.

---

## Transitions between spaces

| Transition | Type | Notes |
|-----------|------|-------|
| Entry vestibule → glass hallway | Open archway | No door |
| Glass hallway → main living | Open archway | Wide, 4u |
| Glass hallway → west wing link | Open | Glass sides visible |
| Glass hallway → tower link | Open | Glass sides visible |
| Main living → engawa | Sliding glass panel | Animates on approach |
| Main living → garden | Low arch | Must duck slightly — intentional |
| Garden → tower base | Open | Space suddenly expands |
| Tower L3 → bridge | Open walkway | Exposed, no walls |
| Bridge → onsen | Step down | Rock surface, steam |
| Lower study | Heavy door | Push-to-open interaction |

All doorways minimum 1.2u wide, 2.2u tall. Open archways where noted.

---

## Orb behaviour

- Spawn position: 1.5m in front of user at eye height (where created)
- Drift: 0.02 units/s sinusoidal — alive but not distracting
- Proximity reveal: text appears at 2m radius
- Brightness: increases as user approaches
- Notes cluster spatially near where created — spatial memory

---

## Implementation order

1. Main living geometry (walls, floor, ceiling, asymmetric triangle roof)
2. Glass wall + mountain backdrop (low-poly mesh + sky plane)
3. Fireplace geometry (static, no fire yet)
4. Evening lighting rig
5. Entry vestibule + front door geometry
6. Glass hallway (north-south axis)
7. Glass links (east/west branches)
8. West wing reading alcove
9. Engawa terrace (exterior deck + snow plane)
10. Indoor garden (low ceiling, moss plane, bamboo geometry)
11. Tower geometry (5 levels, glass panels, steel frame)
12. Exterior staircase (wraps tower outside)
13. Bridge geometry (tower L3 to cliff)
14. Onsen platform (cliff shelf, water plane)
15. Gondola platform + car + cable geometry
16. Fire particle system
17. Steam particle system (onsen)
18. Time-of-day interpolation
19. Orb spawn and proximity system

---

_Hokkaido mansion · Loci default world · Session 02 · March 2026_
