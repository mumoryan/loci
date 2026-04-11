# Music

Audio files are gitignored and must be sourced and placed here locally.

## Sources

- [Free Music Archive — Ambient](https://freemusicarchive.org/genre/Ambient/?page=2)

## Naming conventions

Files are prefixed by license tier to make usage intent explicit at a glance:

| Prefix | License | Usage |
|---|---|---|
| `non-prod_` | Unlicensed / unverified | PoC and local testing only — never ship |
| `cc-by_` | CC BY 4.0 | Generally safe to distribute — verify attribution requirements before production |

## Adding a track

1. Download the file and rename it with the appropriate prefix
2. Place it in this directory (`frontend/public/music/`)