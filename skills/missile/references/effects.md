# Effects arsenal

Recipes for the WebGL signature moments. Versions and APIs verified on 2026-10-01; the liquid glass recipe was run in headless Chromium on that date. Pick one moment from the catalog in design-rules.md, then build it from the matching recipe here.

## Rules for every effect

1. One WebGL moment per page. Browsers cap live WebGL contexts at about sixteen, and every effect below owns at least one.
2. Poster first. Render a static fallback on the server (a CSS gradient in the same colors, an image, an SVG) and mount the effect on top after hydration. The page is complete at rest without the effect.
3. Load lazily. The effect lives in a Client Component, imported with `dynamic(() => import('./x'), { ssr: false })` from inside another Client Component, or through the library's own lazy-load flag.
4. Budget. Cap the device pixel ratio at 1.5. Pause when off-screen. Re-run Lighthouse right after adding the effect; if performance drops more than ten points, simplify or defer it now, not in Polish.
5. Respect preferences. `prefers-reduced-motion: reduce` gets the poster or a frozen frame. `prefers-reduced-transparency: reduce` gets opaque surfaces instead of glass.
6. Words stay in the DOM. Never put text that must be read inside a canvas; keep real headings and buttons above it.
7. Phones count. Check at 390 px with CPU throttling. If the effect cannot hold a steady frame rate there, the phone gets the poster.

## Picking table

| You want | Use | Cost | Maintained |
|---|---|---|---|
| A moving color atmosphere behind the hero | ShaderGradient, or Paper Shaders `MeshGradient` for a lighter build without three.js | S | Yes |
| A real 3D object or scene | React Three Fiber with drei | M to L | Yes |
| Controls that refract the page behind them | liquid-glass-js, vendored | S to M | No, last commit 2025-06 |
| A glass object inside a 3D scene | drei `MeshTransmissionMaterial` | M | Yes |
| A live liquid metal logo | Paper Shaders `LiquidMetal` | S | Yes |
| A liquid metal logo as video or PNG | liquid-logo hosted tool | S | No, last commit 2025-03; it works |
| A custom liquid metal shader | liquid-logo's GLSL, vendored | M | You own it |
| A scene a designer builds | Spline | M | Yes |

## Recipe 1: ShaderGradient atmosphere

`ruucm/shadergradient`, MIT, `@shadergradient/react` 2.4.20. Moving 3D gradients rendered through React Three Fiber.

```bash
pnpm add @shadergradient/react @react-three/fiber three three-stdlib camera-controls
pnpm add -D @types/three
```

React Three Fiber 9 with React 19 is required on the Next.js App Router. Version 8 does not work there.

```tsx
// src/components/atmosphere.tsx
'use client'
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

export default function Atmosphere() {
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      pixelDensity={1}
      fov={45}
      lazyLoad
    >
      <ShaderGradient
        control="query"
        urlString="https://www.shadergradient.co/customize?animate=on&cDistance=3.6&cPolarAngle=90&color1=%2352ff89&color2=%23dbba95&color3=%23d0bce1&lightType=3d&shader=defaults&type=plane&uFrequency=5.5&uSpeed=0.4&uStrength=4"
      />
    </ShaderGradientCanvas>
  )
}
```

How to work: open shadergradient.co/customize, set the three colors from DESIGN.md, choose `plane`, `sphere` or `waterPlane`, copy the URL, paste it as `urlString`. Or drive it with props instead (`type`, `color1`, `color2`, `color3`, `uSpeed`, `uStrength`, `uDensity`, `uFrequency`, `grain`, `lightType`, `envPreset`, `cDistance`, `cPolarAngle`, `animate`).

Mount it from a Client Component with `dynamic(() => import('./atmosphere'), { ssr: false })` inside a `position: relative` section whose CSS background is a gradient of the same three colors. That gradient is the poster.

Budget: `pixelDensity` 1, never above 1.5. `uSpeed` at 0.3 or below reads as calm. `grain="on"` adds texture for free. Reduced motion: `animate="off"`.

Lighter alternative: `pnpm add @paper-design/shaders-react` and use `MeshGradient` or `GrainGradient`. No three.js in the bundle. Each shader at shaders.paper.design has a live editor and a copyable React snippet; copy the props from there rather than guessing them.

## Recipe 2: React Three Fiber scene

`pmndrs/react-three-fiber`, MIT. `@react-three/fiber` 9.8.1 pairs with React 19 (version 8 pairs with React 18; never mix). `@react-three/drei` 10.7.9, `three` 0.186.

```bash
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

```tsx
// src/components/hero-scene.tsx
'use client'
import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Float, PerformanceMonitor } from '@react-three/drei'

export default function HeroScene() {
  const [dpr, setDpr] = useState(1.5)
  return (
    <Canvas dpr={dpr} camera={{ position: [0, 0, 6], fov: 35 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <Suspense fallback={null}>
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
          <mesh>
            <torusKnotGeometry args={[1, 0.32, 220, 32]} />
            <meshStandardMaterial color="#f04e1a" metalness={0.6} roughness={0.25} />
          </mesh>
        </Float>
        <Environment preset="city" />
        <ContactShadows position={[0, -1.8, 0]} opacity={0.35} blur={2.4} />
      </Suspense>
    </Canvas>
  )
}
```

Building blocks from drei that earn their cost: `Environment` (lighting from a preset in one line), `Float` (idle motion), `ContactShadows` (grounding), `PresentationControls` (drag to rotate, snaps back), `ScrollControls` with `useScroll` (scroll-driven camera), `useGLTF` (models), `Html` (DOM pinned to 3D), `PerformanceMonitor` (drop quality when frames slip).

Glass in 3D: replace the material with drei's `<MeshTransmissionMaterial thickness={0.6} roughness={0.05} chromaticAberration={0.04} samples={6} resolution={512} />`. It renders the scene an extra time, so keep `samples` low and `resolution` at 512 or below.

Models: compress before shipping with `npx gltfjsx model.glb --transform`, load with `useGLTF('/models/model-transformed.glb')`, and call `useGLTF.preload` for the hero model.

Budget: `dpr` 1.5 at most; under 100k triangles; textures 1024 px or smaller; one environment and at most one extra light. A scene that does not move uses `frameloop="demand"`. A scene below the fold switches `frameloop` between `"always"` and `"never"` from an intersection observer. Post-processing (`@react-three/postprocessing`) only when the moment is the bloom.

Poster: once the scene looks right, capture it with the browser sensor and place that image behind the canvas so the largest contentful paint is an image, not a WebGL frame.

## Recipe 3: Liquid glass controls

`dashersw/liquid-glass-js`, MIT. Apple-style glass with real refraction: a `Container` pill and `Button`s that bend and blur what is behind them. Shapes are `rounded`, `circle` and `pill`.

Know these four facts before using it:

- It is not on npm. The npm package named `liquid-glass-js` is a different project by another author. Vendor the files.
- It has not changed since 2025-06-12 and has no dispose method. Borrow it, own it, mount it once.
- It refracts a one-time html2canvas snapshot of `document.body`, shifted by scroll position. A video, an animated shader, or content that loads later will not appear in the glass. Use it over still content: type, images, CSS gradients.
- Its buttons are `div`s. Add the keyboard semantics yourself (shown below).

Vendor it as one module. The two classes reference each other and a global `html2canvas`, so a single module scope with an import satisfies both:

```bash
mkdir -p src/vendor/liquid-glass && cd src/vendor/liquid-glass
base=https://raw.githubusercontent.com/dashersw/liquid-glass-js/main
curl -sLO $base/container.js && curl -sLO $base/button.js && curl -sLO $base/glass.css && curl -sLO $base/LICENSE
{ echo "import html2canvas from 'html2canvas'"; cat container.js; echo; cat button.js; echo; echo "export { Container, Button }"; } > index.js
rm container.js button.js
cd - && pnpm add html2canvas
```

```ts
// src/vendor/liquid-glass/index.d.ts
type Shape = 'rounded' | 'circle' | 'pill'
export class Container {
  constructor(options?: { borderRadius?: number; type?: Shape; tintOpacity?: number })
  element: HTMLElement
  addChild<T>(child: T): T
  removeChild(child: unknown): void
  updateSizeFromDOM(): void
  static instances: Container[]
  static pageSnapshot: HTMLCanvasElement | null
}
export class Button extends Container {
  constructor(options?: { text?: string; size?: number; type?: Shape; tintOpacity?: number; warp?: boolean; onClick?: (text: string) => void })
}
```

```tsx
// src/components/glass-bar.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import '@/vendor/liquid-glass/glass.css'

type Action = { label: string; onSelect: () => void }

export function GlassBar({ actions }: { actions: Action[] }) {
  const mount = useRef<HTMLDivElement>(null)
  const [glass, setGlass] = useState(false)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return
    let cancelled = false
    let bar: { element: HTMLElement } | undefined
    document.fonts.ready
      .then(() => import('@/vendor/liquid-glass'))
      .then(({ Container, Button }) => {
        if (cancelled || !mount.current) return
        const container = new Container({ type: 'pill', borderRadius: 32, tintOpacity: 0.25 })
        for (const action of actions) {
          const button = container.addChild(new Button({ text: action.label, size: 18, type: 'pill', onClick: action.onSelect }))
          button.element.setAttribute('role', 'button')
          button.element.tabIndex = 0
          button.element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action.onSelect() }
          })
        }
        mount.current.appendChild(container.element)
        bar = container
        setGlass(true)
      })
    return () => { cancelled = true; bar?.element.remove() }
  }, [actions])

  return (
    <>
      <div ref={mount} />
      {!glass && (
        <div className="glass-fallback">
          {actions.map((action) => <button key={action.label} onClick={action.onSelect}>{action.label}</button>)}
        </div>
      )}
    </>
  )
}
```

Pass a stable `actions` array (module constant or `useMemo`), and mount the bar in a layout so it is created once. The snapshot is taken when the first `Container` is constructed, so construct it after fonts and the hero image have painted. To refresh the snapshot after a theme change, remove the bar, set `Container.pageSnapshot = null`, and create it again.

The fallback is also the reduced-transparency and no-WebGL path, so make it good:

```css
.glass-fallback {
  display: inline-flex; gap: 8px; padding: 8px; border-radius: 999px;
  backdrop-filter: blur(16px) saturate(1.5);
  background: color-mix(in oklch, var(--color-paper-50) 55%, transparent);
  border: 1px solid color-mix(in oklch, white 40%, transparent);
  box-shadow: var(--shadow-card);
}
@media (prefers-reduced-transparency: reduce) {
  .glass-fallback { backdrop-filter: none; background: var(--color-paper-50); }
}
```

Budget: three glass instances per page at most, above the fold only, on landing-length pages. The capture cost grows with page height, and html2canvas skips cross-origin images without CORS and renders other canvases blank. Fine-tune the look through `window.glassControls` (`edgeIntensity`, `rimIntensity`, `baseIntensity`, `blurRadius`, `cornerBoost`, `rippleEffect`) before the first instance is created.

## Recipe 4: Liquid metal logo

Live and maintained: Paper Shaders' `LiquidMetal`. The logo must have a transparent background.

```bash
pnpm add @paper-design/shaders-react
```

```tsx
'use client'
import { LiquidMetal } from '@paper-design/shaders-react'

export function MetalMark() {
  return (
    <LiquidMetal
      width={320}
      height={320}
      image="/logo.svg"
      shape="none"
      colorBack="#aaaaac"
      colorTint="#ffffff"
      repetition={2}
      softness={0.1}
      shiftRed={0.3}
      shiftBlue={0.3}
      distortion={0.07}
      contour={0.4}
      angle={70}
      speed={1}
      scale={0.6}
      fit="contain"
    />
  )
}
```

Props: `image` (URL or image element used as the mask), `shape` (`none`, `circle`, `daisy`, `diamond`, `metaballs` when there is no image), `colorBack`, `colorTint`, `repetition` 1 to 10, `softness` 0 to 1, `shiftRed` and `shiftBlue` −1 to 1, `distortion` 0 to 1, `contour` 0 to 1, `angle` 0 to 360, `speed` (0 stops it; use that for reduced motion), `scale` 0.1 to 4, `fit` (`contain` or `cover`). The same package has `Heatmap` and `GemSmoke` for other logo treatments.

Exported asset: `collidingScopes/liquid-logo`, MIT, a browser tool at collidingscopes.github.io/liquid-logo. Upload a clean, high-contrast logo, press R to randomize or pick a preset, tune it, then export a PNG (S) or an MP4 (V). Everything runs client-side. Use the MP4 as a muted looping hero video with the PNG as its poster, as the loader, or as the first two seconds of the demo video. This needs a human at the tool, so record it under Decisions in MISSILE.md as an option for the user and build the live route meanwhile.

Custom shader: when neither route gives the look, vendor `fragment-shader.glsl` and `vertex-shader.glsl` from that repo (keep `LICENSE.txt`) and draw a full-canvas quad, in plain WebGL or as a React Three Fiber `shaderMaterial`. Uniforms: `u_resolution`, `u_time`, `u_speed`, `u_iterations`, `u_scale`, `u_dotFactor`, `u_dotMultiplier`, `u_vOffset`, `u_intensityFactor`, `u_expFactor`, `u_noiseIntensity`, `u_colorFactors` (vec3), `u_colorShift`, `u_logoTexture`, `u_logoOpacity`, `u_logoScale`, `u_logoAspectRatio`, `u_logoInteractStrength`, `u_logoBlendMode` (0 normal, 1 multiply, 2 screen, 3 overlay). Start from the repo's `Glow` preset: speed 0.34, iterations 15, scale 3.11, dotFactor 0.66, dotMultiplier 0.36, vOffset 6.0, intensityFactor 0.1, expFactor 1.8, noiseIntensity 0.5, colorFactors (0.2, 0.0, −0.2), colorShift 0.5, logoInteractStrength 0.66.

## Recipe 5: Spline scene

For a scene a designer builds visually. `pnpm add @splinetool/react-spline @splinetool/runtime`, then `import Spline from '@splinetool/react-spline/next'` and `<Spline scene="https://prod.spline.design/<id>/scene.splinecode" />`. The free tier watermarks web exports. Spline's desktop app registers its own MCP server in Claude Code when it launches, which lets the missile edit the scene. Apply the same poster, lazy-load and budget rules.

## After adding any effect

- The server HTML contains the poster: fetch the page with `curl` and confirm the fallback markup or gradient is there.
- Screenshots at 390 and 1440 show the effect and nothing clipped by it.
- Lighthouse performance before and after, recorded in MISSILE.md.
- The console shows no WebGL context warnings.
- The reduced-motion and reduced-transparency paths render the poster or the opaque fallback.
