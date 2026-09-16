# Cinematic Portfolio - Agent Guidelines & Mandatory Skills

> **CRITICAL INSTRUCTION FOR ALL CODE GENERATION:**
> Whenever generating, modifying, reviewing, or refactoring code in this repository, you **MUST ALWAYS** consult, apply, and adhere to the project skills in `.agents/skills/` (and `CINEMATIC_WEB_SKILLS/`). 
> Deliver only production-grade, award-winning (Awwwards/FWA-calibre) interactive code. Generic, template-like, or basic code is strictly unacceptable.

---

## 1. Core Architectural Ownership (No Conflicts)

Every animation and visual layer has a single, strictly designated owner:

| Layer | Designated Technology | Responsibility | Forbidden Pattern |
|---|---|---|---|
| **Scroll Engine** | **Lenis** | Smooth scrolling, velocity interpolation, anchor navigation | Never combine with native CSS `scroll-behavior: smooth` or Locomotive Scroll. |
| **Animation Orchestration** | **GSAP & ScrollTrigger** | Timelines, scroll-driven scrubbing, pinning, section transitions, staggered reveals | Never animate the exact same property with both GSAP and CSS/Anime.js. |
| **3D Canvas & Scene Graph** | **Three.js + React Three Fiber (R3F)** | WebGL scene, camera choreography, lights, geometry, materials, GLTF loading | Never call `useState` inside `useFrame` 60fps loops; use mutable refs. |
| **3D Component Helpers** | **Drei** | `Environment`, `Float`, `OrbitControls`, `Html`, `useGLTF`, `shaderMaterial` | Do not write manual boilerplate when Drei provides performant helpers. |
| **GPU Visual Effects** | **GLSL Shaders** | Liquid ripples, vertex displacement, UV distortions, procedural noise | Never recalculate static constants in inner fragment loops. |
| **Screen-Space Polish** | **Postprocessing** | Bloom, chromatic aberration, vignette, noise grain | Always set `multisampling={0}` on `EffectComposer` with `mipmapBlur`. |
| **Micro-Interactions** | **Anime.js / Motion** | Self-contained SVG path drawing, UI buttons, modals, HUD overlays | Do not let micro-interaction libraries fight GSAP for document scroll. |

---

## 2. Standard Scroll & Animation Synchronization

For all scroll-driven interactions in this project, adhere to this initialization pattern:

```typescript
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 1. Lenis Smooth Scrolling
const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  touchMultiplier: 2,
});

// 2. Drive ScrollTrigger from Lenis
lenis.on('scroll', ScrollTrigger.update);

// 3. Connect GSAP ticker
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// 4. Disable lag smoothing to prevent visual jumps
gsap.ticker.lagSmoothing(0);
```

---

## 3. Aesthetic & Design Standard (Frontend Design Lead)

Follow the directives from `.agents/skills/frontend-design/SKILL.md`:
1. **Never build generic AI templates**: Avoid uninspired dark-mode with neon-green clichés or plain centered cards.
2. **Intentional Typography**: Pair a characterful display typeface with a complementary, highly readable body face. Use deliberate letter spacing and weight hierarchies.
3. **Palette Cohesion**: Define 4–6 harmonious colors with bespoke naming and clear utility roles.
4. **Signature Element**: Every major scene or page must feature one memorable, signature interactive element (e.g. dynamic shader displacement, interactive 3D centerpiece, or choreographed camera path).
5. **Restraint**: Spend boldness on the signature element; keep surrounding UI disciplined and quiet.

---

## 4. Performance & Cleanliness Checklist

- **Cleanup**: Always return cleanup functions in `useEffect` / `useGSAP` (`tl.kill()`, `ScrollTrigger.kill()`, `lenis.destroy()`).
- **GPU Acceleration**: Animate `transform` (`x`, `y`, `z`, `scale`, `rotation`) and `opacity`. Never animate layout triggers (`top`, `left`, `width`, `height`, `margin`).
- **Geometry & Textures**: Keep textures ≤ 2048x2048, polycounts < 100k, and dispose unused Three.js assets on unmount.
- **Accessibility**: Respect `prefers-reduced-motion` using `gsap.matchMedia()`.

---

## 5. Skills Directory Reference

- **Frontend Design**: `.agents/skills/frontend-design/SKILL.md`
- **GSAP Suite**: `.agents/skills/gsap-*` (Core, Timeline, ScrollTrigger, React, Plugins, Performance, Utils)
- **Lenis Smooth Scroll**: `.agents/skills/lenis/SKILL.md`
- **Three.js Architecture**: `.agents/skills/threejs/SKILL.md`
- **React Three Fiber (R3F)**: `.agents/skills/r3f/SKILL.md`
- **Drei Components**: `.agents/skills/drei/SKILL.md`
- **Postprocessing**: `.agents/skills/postprocessing/SKILL.md`
- **GLSL Shaders**: `.agents/skills/shaders/SKILL.md`
- **Barba.js**: `.agents/skills/barbajs/SKILL.md`
- **Theatre.js**: `.agents/skills/theatrejs/SKILL.md`
- **Motion**: `.agents/skills/motion/SKILL.md`
- **Anime.js**: `.agents/skills/animejs/SKILL.md`
- **Cinematic Web Master Skill**: `.agents/skills/cinematic-web/SKILL.md`
