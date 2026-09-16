# Precision in Motion — Cinematic Portfolio

A scroll-driven, cinematic 3D portfolio built for a SaaS + real estate video
editor. Scrolling is the navigation: typography, a shared WebGL scene, video
reveals, and section transitions are all choreographed against scroll
position rather than laid out as a static page.

---

## 1. Experience architecture (short version)

The page is one continuous timeline, broken into scenes:

```
Hero (pinned, 3D object)
  → Intro (word-by-word manifesto reveal)
  → What I Do (SaaS / Real Estate / Motion / Cinematic — pinned, each word
    enters with its own motion language)
  → SaaS (UI fragments assemble → hold → disassemble)
  → Real Estate (shader-distorted image reveal, slow luxury parallax)
  → Portfolio (data-driven project scenes, alternating layout)
  → Before / After (draggable cinematic comparison slider)
  → Motion Design (kinetic type + morphing shape)
  → 3D Showcase (pinned, camera "travels" through floating frames)
  → Services (karaoke-style scroll highlight)
  → Process (vertical timeline with a scroll-filled progress line)
  → About → CTA → Contact → Footer
```

Each section owns its own animation via a scoped `gsap.context()`
(`useScopedGsap`), so nothing leaks between sections and everything cleans
up correctly.

## 2. Tech stack — and why

| Layer | Library | Job |
|---|---|---|
| Smooth scroll | **Lenis** | Owns the scroll position/velocity |
| Animation orchestration | **GSAP + ScrollTrigger** | Owns all DOM/typography/pin/scrub animation |
| 3D rendering | **Three.js + React Three Fiber + Drei** | Owns the shared WebGL scene |
| Screen-space effects | **@react-three/postprocessing** | Bloom / vignette / grain |
| GPU effects | **Custom GLSL** (`src/shaders`) | Hero object fresnel material, image distortion |

**Deliberately not used:** Next.js (this is a single scroll experience with
no routing/SSR need — Vite keeps the dev loop fast and avoids
window/Three.js SSR headaches), Anime.js, Motion, Theatre.js, Barba.js. Each
would duplicate a job GSAP/Lenis/R3F already own cleanly — per the brief's
own rule, no library is included without a clear, singular job.

**Scroll chain:** `Lenis → GSAP ticker → ScrollTrigger → DOM/3D/shader
uniforms`, exactly as specified. A single mutable store
(`src/lib/scrollState.ts`) exposes live scroll progress/velocity/pointer
position to Three.js so the 3D scene reads it inside `useFrame` without
ever triggering a React re-render on scroll.

**Single canvas:** There is one primary `<Canvas>` (`SceneCanvas`), mounted
once and fixed behind all content. It renders the hero's rotating radar/HUD
object and the later 3D showcase scene, and only runs its render
loop (`frameloop`) while one of those two zones is actually on screen — it's
fully idle the rest of the scroll. The Real Estate section uses one small
second canvas for its shader-distorted image; both canvases and all
postprocessing are skipped entirely on mobile / `prefers-reduced-motion`.

## 3. Install & run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → /dist
npm run preview   # preview the production build locally
```

Requires Node 18+.

## 4. Where things live

| What | Where |
|---|---|
| Portfolio videos | `/public/videos/*.mp4` |
| Poster images (incl. placeholders) | `/public/images/*` |
| A future GLTF hero model, if you want one | `/public/models/` |
| Project content (title, client, description, etc.) | `src/data/projects.ts` |
| Services / process / categories / contact links | `src/data/content.ts` |

## 5. Replacing placeholder videos

Every project video is a plain path like `/videos/real-estate.mp4`. To swap
in your real footage:

1. Export an H.264 `.mp4` (no audio needed — every project video renders
   muted) and drop it into `/public/videos/` using the filename already
   referenced in `src/data/projects.ts` (or add a new filename and update
   the entry).
2. Replace the matching poster in `/public/images/`.
3. Nothing else needs to change — `VideoProject` lazy-loads the source once
   it's near the viewport and only plays while it's actually visible.

The placeholder posters currently in `/public/images/` are generated SVGs
labeled "PLACEHOLDER" so the layout previews cleanly before you add real
assets; the placeholder `.mp4` paths simply won't resolve until you add
files, and the component quietly falls back to the poster in that case.

## 6. Adding / editing projects

Edit the `projects` array in `src/data/projects.ts` — no component changes
required. Each entry supports `title`, `category`, `year`, `client`,
`role`, `software`, `description`, `video`, `poster`, and `accent`.

## 7. How the scroll architecture works

- **Pinned scenes** (Hero, What I Do, 3D Showcase) use
  `ScrollTrigger.create({ pin: true, scrub: 1, ... })` and write their
  progress into `scrollState` for the 3D layer to read.
- **Scrubbed reveals** (Intro's word reveal, SaaS assembly, Real Estate
  image mask, Process fill line) use `scrub` timelines tied to each
  section's own position, no pinning required.
- **One-shot reveals** (Portfolio metadata, About, Contact) use
  `ScrollTrigger`'s default `toggleActions` to fire once as they enter.
- On mobile and with `prefers-reduced-motion` enabled, pinning is disabled
  and durations shrink — see `src/lib/MotionContext.tsx` and the `lite`
  flag threaded through each section.

## 8. Performance notes

- The heavy three.js/postprocessing stack is code-split via `React.lazy` —
  it downloads in its own chunk after the initial page paints.
- The shared 3D canvas only renders while a 3D zone is actually in the
  viewport (`IntersectionObserver`-driven `frameloop` toggling).
- Videos are lazy-loaded (`IntersectionObserver` + deferred `<source>`) and
  paused whenever less than ~35% visible.
- Postprocessing, particles, and pointer-parallax are disabled on
  mobile/coarse-pointer devices and under `prefers-reduced-motion`.
- `dpr` is capped (lower on mobile) to avoid over-rendering on high-density
  displays.

## 9. Accessibility

- `prefers-reduced-motion` disables Lenis smoothing, canvas pinning, and
  the custom cursor, falling back to simpler fades.
- The custom cursor and cursor-hiding CSS are gated behind
  `(pointer: fine)` and never applied on touch devices.
- Semantic HTML (`nav`, `section`, `article`, `dl`, headings in order) and
  real links/buttons throughout — nothing critical depends on animation
  completing to be readable.

## 10. Extending further

- Swap the procedural radar HUD for an authored model by loading a GLTF
  in `src/components/SceneCanvas/RadarHUD.tsx` with Drei's `useGLTF`.
- Add more projects by extending `src/data/projects.ts` — the Portfolio
  section re-renders automatically.
- The palette is intentionally strict and global: one neon-orange HUD
  accent (`--accent` in `src/index.css`, mirrored as `HUD_COLOR` in
  `src/lib/themeState.ts` for the 3D layer) used everywhere, with mint
  (`--mint`) reserved exclusively for the CTA headline. There is no
  per-section theming — introducing one would mean re-adding a
  `[data-accent]`-style switch, which was deliberately removed.
