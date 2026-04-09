# Spec: Frontend Scaffold
_Status: ready | Created: 2026-04-09 | Agent: frontend-implementer_

---

## What This Is

Bootstrap the frontend project so it can be served locally and on Quest.
This creates the package configuration, bundler setup, and app entry point
that mounts the existing `EntrySequence` component inside a WebXR-ready R3F canvas.

---

## Files to Create

```
frontend/package.json               Bun/npm manifest — all dependencies
frontend/tsconfig.json              TypeScript strict config
frontend/vite.config.ts             Vite dev server + HTTPS (required for WebXR)
frontend/index.html                 HTML entry point
frontend/src/main.tsx               App root — mounts Canvas + XR + EntrySequence
frontend/src/App.tsx                App component — XR session management wrapper
```

No changes to the three files created by entry-sequence spec.

---

## Dependencies (exact packages)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "three": "^0.169.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/xr": "^6.2.0",
    "@react-three/drei": "^9.115.0",
    "troika-three-text": "^0.52.4",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.169.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

---

## Acceptance Criteria

- [ ] `bun install` succeeds with no errors
- [ ] `bun run dev` starts a local HTTPS dev server (required for WebXR)
- [ ] Visiting the dev server URL in a desktop browser shows a black canvas (entry sequence starts)
- [ ] No TypeScript errors (`bun run typecheck`)
- [ ] No lint errors (`bun run lint` — configure eslint with react + typescript rules)
- [ ] The `<EntrySequence />` component is mounted and reachable at the root route
- [ ] WebXR enter-VR button present when running on a WebXR-capable browser
- [ ] `bun run build` produces a `frontend/dist/` bundle

---

## Vite Config Requirements

- HTTPS enabled via `@vitejs/plugin-basic-ssl` or `vite-plugin-mkcert` (WebXR requires a secure context)
- Port: 5173
- Host: `0.0.0.0` so Quest browser can reach the dev machine over LAN
- React plugin enabled

---

## TypeScript Config Requirements

- `strict: true`
- `jsx: "react-jsx"`
- `moduleResolution: "bundler"`
- `target: "ES2020"`
- Include: `src/**/*`

---

## main.tsx Requirements

- Renders `<App />` into `document.getElementById('root')`
- No logic — delegation only

---

## App.tsx Requirements

- Wraps `<Canvas>` from `@react-three/fiber`
- Uses `<XR>` from `@react-three/xr` v6 inside `<Canvas>`
- Mounts `<EntrySequence />` inside the XR/Canvas tree
- Provides an "Enter VR" button outside the canvas using `createXRStore` from `@react-three/xr` v6
- Camera: `fov={75}`, positioned at `[0, 1.6, 0]` (standing eye height)
- Background: black (`#000000`)
- No post-processing

### @react-three/xr v6 API (use exactly this pattern)
```tsx
import { createXRStore, XR } from '@react-three/xr'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas>
        <XR store={store}>
          <EntrySequence />
        </XR>
      </Canvas>
    </>
  )
}
```

---

## Package Scripts

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "typecheck": "tsc --noEmit",
  "lint": "eslint src --ext .ts,.tsx",
  "preview": "vite preview"
}
```

---

## index.html Requirements

- Single `<div id="root">` mount point
- `<script type="module" src="/src/main.tsx">` entry
- Canvas should fill the full viewport: `body { margin: 0; background: #000; }`

---

## Out of Scope for This Spec

- Hokkaido world implementation
- Audio
- Note orbs
- Backend API connection
- Production deployment
